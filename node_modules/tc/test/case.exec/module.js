exports.exec = function (inText, tc, callback) {
    tc.out('\'' + inText + '\'');
    callback();
}