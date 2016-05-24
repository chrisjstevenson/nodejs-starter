var abc = require('abc');
var path = require('path');
var testCase = require('./test-case.js');
var config = require('./config.js');

exports.run = function (caseDir, caseNames, callback) {
    if (!callback) {
        callback = function () {};
    }
    findCaseFiles(caseDir, caseNames, function (caseFiles) {
        loadCases(caseFiles, function (testCases) {
            config.get(caseDir, function (config) {
                runAllCases(config, testCases, callback);
            });
        });
    });
}

function findCaseFiles (caseDir, caseNames, callback) {
    var caseFiles = [];
    abc.find(
        caseDir, 
        function check (file, filePath) {
            if (caseNames ? caseNames.indexOf(file) !== -1 : /\.case\./.test(file)) {
                caseFiles.push(path.join(filePath, file))
            }
        },
        function () {
            callback(caseFiles);
        }
    );

}

function loadCases (caseFiles, callback) {
    var testCases = [];
    abc.async.forEach(
        caseFiles,
        function (caseFile, callback) {
            testCase.load(caseFile, function (testCaseDesc) {
                testCases.push(testCaseDesc);
                callback();
            })
        },
        function () {
            callback(testCases);
        }
    );
}


function runAllCases (config, testCases, callback) {
    abc.async.sequence(
        testCases, 
        function (testCaseDesc, callback) {
            testCase.run(testCaseDesc, config, callback);
        },
        callback
    );
}