global.log = require('../config/log');
global.contentType = 'application/collection+json';
var Promise = global.Promise = require('bluebird');

var app = Promise.promisifyAll(require('./express'));
var config = require('../config/config');
var mongooseWrapper = require('../config/mongooseWrapper');

module.exports.run = function (cb) {
    log.info("server - Starting")

    return mongooseWrapper.connect()
        .then(app.listenAsync(config.express.port))
        .then(() => log.info(`running on port ${config.express.port}`))
        .catch((error) => log.error('server - Error while starting', error));
};

