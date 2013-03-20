var express = require('express'),
    fs = require('fs');

// App settings and middleware
exports.boot = function(app, config, env) {

    app.set('showStackError', true);

    // should be placed before express.static
    app.use(express.compress({
        filter: function(req, res){
          return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 9
    }));

    app.configure(function () {

        app.use(express['static'](config.root + '/public'));

        // provides logging to console for each incoming request
        setupLoggers();
        if (env === 'development') app.use(express.logger(':simple'));

        // assume "not found" in the error msgs
        // is a 404. this is somewhat silly, but
        // valid, you can do whatever you like, set
        // properties, use instanceof etc.
        app.use(function(err, req, res, next) {
            // treat as 404
            if (~err.message.indexOf('not found')) {
                return next();
            }
            // log it
            console.error(err.stack);

            // error page
            res.status(500).send('500');
        });

        // assume 404 since no middleware responded
        app.use(function(req, res, next) {
            res.status(404).send('404', {url: req.originalUrl});
            /*
            } else {
                var index = config.root + '/public/index.html';
                fs.readFile(index, function (err, main) {
                    res.contentType('text/html; charset=UTF-8');
                    res.send(main);
                });
            }
            */
        });
    });

    console.log('\033[36m✔\u001b[0m Node.JS server successfully started');
};


function setupLoggers() {
    express.logger.token('simple', function (req, res) {
        return '\033[96m' + req.method + ' ' + req.originalUrl + ' ' + res.statusCode + '\033[0m';
    });

    express.logger.token('headers', function (req, res) {
        var l = '';
        for (var header in req.headers) {l += '\n\033[33m' + header + '\033[0m: ' + req.headers[header];}
        return l;
    });
}
