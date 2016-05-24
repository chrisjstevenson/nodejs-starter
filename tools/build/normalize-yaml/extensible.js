module.exports = exports = function () {
  var runFunctions = [];
  var doneFunctions = [];

  function applyFunctions(funcs, item) {
    funcs.forEach( function (fn) {
      fn(item);
    });
  }
  
  var self = applyFunctions.bind(null, runFunctions);

  self.add = function (func) {
    runFunctions.push(func);
  };

  self.after = function (func) {
    doneFunctions.push(func);
  };
  
  self.done = applyFunctions.bind(null, doneFunctions);

  return self;
};
