var connect = require('connect'),
    fs = require('fs');

exports.boot = function (app, config, env) {

    app.use(connect.logger('dev'));
    app.use(connect.static(config.root + '/public'));

    console.log('\033[36m✔\u001b[0m Node.JS server successfully started');
};
