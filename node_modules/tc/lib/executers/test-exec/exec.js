module.exports = function (inText, tc) {
    createFunction(inText)(tc);
}

function createFunction (inText) {
    var f;
    return eval('f = function (tc) {' + inText + '}');
}