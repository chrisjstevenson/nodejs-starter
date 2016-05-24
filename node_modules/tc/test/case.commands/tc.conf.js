(function () {

    function exec (inText, tc, callback) {
        var commands;
        eval('commands=' + inText);

        require('abc').async.sequence(
            commands,
            function (command, callback) {
                execCommand(command, tc, callback);
            },
            callback
        );

    }

    function execCommand (command, tc, callback) {
        switch (command) {
            case 'test':
                tc.out(42);
                callback();
                break;
            case 'towel':
                tc.out('yes');
                callback();
                break;            
            default:
                tc.out('unknown command');
                callback();
        } 
    }

    return {
        exec: exec
    };

})();