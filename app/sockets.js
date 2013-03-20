/**
 * Setup of sockets functionality.
 */

var _ = require('underscore'),
    config = require('./config');
    http = require('http'),
    spawn = require('child_process').spawn,
    follow = spawn('tail', ['-f', 'sample.log']),
    geoip = require('geoip-lite');

exports.boot = function (io, config) {

    io.sockets.on('connection', function (socket) {

        console.log('connection');
        start(socket);

        socket.on('disconnect', function () {
            console.log('disconnected');
        });

    });

    var start = function startF(socket) {
            follow.stdout.on('data', function (data) {
                data = data.toString();
                /\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/.test(data);
                //var ip = RegExp.$1;
                var ip = '207.97.227.239';
                var geo = geoip.lookup(ip);
                if (geo) {
                    socket.emit('ping', geo.ll);
                }
            });
            follow.on('close', function (code) {
                console.log('exit with code: ' + code);
            });
        };

};
