/**
 * Setup of sockets functionality.
 */

var _ = require('underscore'),
    config = require('./config'),
    http = require('http'),
    spawn = require('child_process').spawn,
    follow = spawn('tcpdump', ['-i', 'eth0', '-s', '64', '-n', 'udp src port 123']),
    geoip = require('geoip-lite')
    emitLines = function emitLinesF(stream) {
        var backlog = '';
        stream.on('data', function (data) {
            backlog += data;
            var n = backlog.indexOf('\n');
            // got a \n? emit one or more 'line' events
            while (~n) {
                stream.emit('line', backlog.substring(0, n));
                backlog = backlog.substring(n + 1);
                n = backlog.indexOf('\n');
            }
        });
        stream.on('end', function () {
            if (backlog) {
                stream.emit('line', backlog);;;;
            }
        });
    };

exports.boot = function bootF(io, config) {

    io.sockets.on('connection', function onSocketConnectionF(socket) {
        emitLines(follow.stdout);
        start(socket);
    });

    var start = function startF(socket) {
        follow.stdout.on('line', function onDataF(data) {
            line = data.toString();
            /.+ IP6? (.+)\.[0-9]+ > (.+?)\.[0-9]+: .+$/.test(line);
            var ip = RegExp.$2;
            var geo = geoip.lookup(ip);
            if (geo) {
                socket.emit('latlon', geo.ll);
            }
        });
        follow.on('close', function onCloseF(code) {
            console.log('exit with code: ' + code);
        });
    };
};
