/* Main application entry file. Please note, the order of loading is important.
 * Configuration loading and booting of controllers and custom error handlers */

var env = process.env.NODE_ENV || 'development',
    config = require('./app/config')[env],
    port = process.env.PORT || 5000,
    app = require('connect')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, { log: false });

// Boot services
require('./app/sockets').boot(io, config);
require('./app/connect').boot(app, config, env);

// Start the app by listening on <port>
server.listen(port);
