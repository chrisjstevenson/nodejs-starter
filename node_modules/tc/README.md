## tc
Test case runner.

### Test case files
Create the directory with testCases. Each file with testCase must contains '.case.' in the name. 
```
caseDir/
  tc.conf.js //optional
  A.case.js
  B.case.js
```

### TestCase file structure
```
//in
test case text (js code by default)
//out
expected result
```

For example:
```javascript
//in
tc.out(2 + 2);
tc.out(2 * 2);
//out
4
4
```
Method 'tc.out' accumulates results. Each call creates the new line.

You can run testCases from command line:
```
node tc/bin/tc caseDir
```
or from js:
```javascript
require('ts').run(caseDir);
```

### Config file - tc.conf.js
Config file should return the object with next fields:
  * exec(inText, tc, callback) - function for testCase execution. 
    * 'inText' - text from testCase between '//in' and '//out'. 
    * 'tc' - testCase object. 
      * 'tc.out' - this method accumulates results. 
      * 'tc.fixPath' - can be used for resolving of relative path.
    * 'callback' - must be called for finish of test.
  * [beforeEach(tc, callback)] - function will be called before each testCase.
    * 'tc' - testCase object. 
      * 'tc.out' - this method accumulates results. 
      * 'tc.fixPath' - can be used for resolving of relative path.
    * 'callback' - callback.
  * [afterEach(tc, callback)] - function will be called after each testCase.
    * 'tc' - testCase object. 
      * 'tc.out' - this method accumulates results. 
      * 'tc.fixPath' - can be used for resolving of relative path.
    * 'callback' - callback.

For example:
```javascript
{
    exec: function (inText, tc, callback) {
        tc.out('\'' + inText + '\'');
        callback();
    }
}
```
'exec' can be the name of predefined executer. 
```javascript
{
    exec: 'async'
}
```
'exec' can send Error object to callback.
```javascript
{
    exec: function (inText, tc, callback) {
        // do something
        if (smfWrong) {
            callback(new Error('Something wrong!'))
        } else {
            callback();
        }
    }
}
```
You can use code from another files. You should use 'conf.fixPath' for resolving of relative path.
```javascript
{
    exec: require(conf.fixPath(./module.js)).exec
}
```

### Example
See more examples in the test directory.
