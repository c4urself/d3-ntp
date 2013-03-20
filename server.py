import datetime
import errno
import fcntl
import re
import subprocess
import sys
from gevent import monkey, sleep, socket, spawn
monkey.patch_all()
from flask import Flask, request, send_file

from socketio import socketio_manage
from socketio.namespace import BaseNamespace

import pygeoip


# The socket.io namespace
class MapNamespace(BaseNamespace):
    sockets = set()

    @classmethod
    def send(cls, event, *args):
        pkt = {
            'type': 'event',
            'name': event,
            'args': args,
            'endpoint': '/latlon',
        }

        for socket in cls.sockets:
            socket.send_packet(pkt)

    def recv_connect(self):
        self.sockets.add(self.socket)
        MapNamespace.send('viewers', len(self.sockets))

    def recv_disconnect(self):
        self.sockets.discard(self.socket)
        MapNamespace.send('viewers', len(self.sockets))


# Flask routes
app = Flask(__name__)


@app.route('/')
def index():
    return send_file('public/index.html')


@app.route("/socket.io/<path:path>")
def run_socketio(path):
    socketio_manage(request.environ, {'/latlon': MapNamespace})
    return ''


def generate_data(local_addresses):
    gi = pygeoip.GeoIP('/usr/share/GeoIP/GeoIPCity.dat', pygeoip.MEMORY_CACHE)
    args = ['tcpdump', '-l', '-i', 'eth0', '-s', '64', '-n', 'udp src port 123']
    p = subprocess.Popen(args,
                         stdin=subprocess.PIPE,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT)
    fcntl.fcntl(p.stdout, fcntl.F_SETFL, os.O_NONBLOCK)
    chunk = None
    queries = 0
    last_qps_update = datetime.datetime.now()
    while True:
        socket.wait_read(p.stdout.fileno())
        try:
            chunk = p.stdout.readline()
            if not chunk:
                break
        except IOError, ex:
            if ex[0] != errno.EAGAIN:
                raise
            sys.exc_clear()

        if not chunk:
            continue

        match = re.match(r'.+ IP6? (.+)\.[0-9]+ > (.+?)\.[0-9]+: .+$', chunk)
        if not match:
            continue

        src, dest = match.groups()
        if src not in local_addresses:
            continue

        queries += 1
        now = datetime.datetime.now()
        if (now - last_qps_update).total_seconds() > 10:
            dt = now - last_qps_update
            last_qps_update = now
            MapNamespace.send('qps', float(queries) / dt.total_seconds())
            queries = 0

        try:
            record = gi.record_by_addr(dest)
            if record:
                MapNamespace.send('latlon',
                                  record['latitude'], record['longitude'])
        except:
            continue

if __name__ == '__main__':
    print 'Discovering local interfaces...'
    import netifaces
    addresses = set()
    for iface in netifaces.interfaces():
        for address in netifaces.ifaddresses(iface).get(netifaces.AF_INET, []):
            addresses.add(address['addr'])
    print 'Got ', addresses
    print 'Spawning data gatherererer'
    spawn(generate_data, addresses)
    print 'Listening on http://0.0.0.0:8080'
    app.debug = True
    import os
    from werkzeug.wsgi import SharedDataMiddleware
    app = SharedDataMiddleware(app, {
        '/': os.path.join(os.path.dirname(__file__), 'public')
        })
    from socketio.server import SocketIOServer
    SocketIOServer(('0.0.0.0', 8080), app,
        resource="socket.io", policy_server=False).serve_forever()
