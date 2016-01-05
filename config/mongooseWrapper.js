var Promise = global.Promise = require('bluebird');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
var config = require('./config');

module.exports.mongoose = mongoose;

module.exports.connect = function connect() {
    return new Promise(function (resolve, reject) {
        if(mongoose.connection._readyState === 1) {
            resolve();
            return;
        }
        mongoose.connect(config.mongoDbUri);

        mongoose.connection.once('open', function (err) {
            if (err) return reject(err);
            log.info(`mongoose - ${config.mongoDbUri}`);
            resolve();
        })
    });
}