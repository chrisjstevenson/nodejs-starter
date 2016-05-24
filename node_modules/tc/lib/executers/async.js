var testExec = require('./test-exec/exec.js');

exports.exec = function (inText, tc, callback) {
    function finish () {
        callback();
        tc.finish = function () {
            throw new Error('Double finish!');
        };
    }
    tc.finish = finish;

    try {
        testExec(inText, tc);
    } catch (e) {
        callback(e);
    }

};