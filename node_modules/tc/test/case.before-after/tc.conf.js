(function () {
    var testCase = {};
    return {
        beforeEach: function (tc, callback) {
            setTimeout(function () {
                if (testCase && testCase != tc) {
                    testCase = tc;
                    tc.OK = true;
                }
                callback();                
            }, 200);
        },
        afterEach: function (tc, callback) {
            if (testCase != tc) {
                testCase = null;
            }
            callback();
        }
    };
})()