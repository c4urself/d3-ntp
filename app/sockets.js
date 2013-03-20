/**
 * Setup of sockets functionality.
 */

var _ = require('underscore'),
    config = require('./config');
    http = require('http'),
    spawn = require('child_process').spawn,
    follow = spawn('tail', ['-f', 'sample.log']);

exports.boot = function (io, config) {

    io.sockets.on('connection', function (socket) {

        console.log('connection');

        start(socket);

        socket.on('disconnect', function () {
            console.log('disconnected');
        });

    });

    var emit = function emitF(poller) {
            if (!poller.cache || mustDie(poller)) {
                console.log('die');
                return;
            }
            var listeners = 0;
            _.each(poller.listeners, function (socket) {
                socket.emit(poller.url, poller.cache);
                listeners++;
            });
            log.log('info', 'sockets', '☄', '[' + poller.type + ']', 'emitted new data to ' + listeners + ' listeners');
        },
        start = function startF(socket){
            console.log('emitting');
            follow.stdout.on('data', function (data) {
                data = data.toString();
                console.log('emitted');
                console.log(data);
                socket.emit('news', data);
            });
            follow.on('close', function (code) {
                console.log('exit with code: ' + code);
            });
        };

};
