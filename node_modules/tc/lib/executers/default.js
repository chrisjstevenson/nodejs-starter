var testExec = require('./test-exec/exec.js');

exports.exec = function (inText, tc, callback) {
    var err = null;
    try {
        testExec(inText, tc);
    } catch (e) {
        err = e;
    } finally {
        callback(err);
    }
};

