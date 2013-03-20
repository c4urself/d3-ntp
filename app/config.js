module.exports = {
    development: {
        root: require('path').normalize(__dirname + '/..'),
        log: [{
            level: 'debug',
            exclude: [],
            transport: 'console'
        }]
    },
    production: {
        root: require('path').normalize(__dirname + '/..'),
        log: [{
            level: 'warn',
            exclude: [],
            transport: '/var/log/d3.log'
        }]
    }
};
