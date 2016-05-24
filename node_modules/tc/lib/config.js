var fs = require('fs');
var path = require('path');
var abc = require('abc');

exports.get = getConfig;

function getConfig (caseDir, callback) {
    loadConfig(caseDir, function (config) {
        config = abc.extend({
            exec: require('./executers/default.js').exec,
            beforeEach: function (tc, callback) {callback()},
            afterEach: function (tc, callback) {callback()}
        }, config);

        if (typeof config.exec === 'string') {
            config.exec = require('./executers/' + config.exec).exec;
        }

        callback(config);
    }); 
}

function loadConfig (caseDir, callback) {
    var configFile = path.join(caseDir, 'tc.conf.js');
    
    var configToJSON = function (text) {

        var config = null;
        
        if (text) {
        
            var confContext = {
                fixPath: function (relPath) {
                    return path.resolve(path.join(caseDir, relPath));
                }
            };
        
            try {
                config = createFunction(text)(confContext);
            } catch (e) {
                console.log(configFile + ' - parse error');
                console.log(e);
            }
        }
        
        callback(config);
    }

    fs.exists(configFile, function (exists) {
        if (exists) {
            abc.file.read(configFile, configToJSON)
        } else {
            configToJSON(null);
        }
    })
}

function createFunction (text) {
    var f;
    return eval('f = function (conf) { return ' + text + '}');
}