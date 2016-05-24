var util = require("util");

var isArrayTemplate = exports.isArrayTemplate = function isArrayTemplate(valueSpecTuple) {
  return valueSpecTuple.value && 
    valueSpecTuple.value._templates && 
    valueSpecTuple.value._templates[0].tag.indexOf("@") === 0;
}

var isText = exports.isText = function isText(valueSpecTuple) {
  return valueSpecTuple.value === null || 
    valueSpecTuple.value === undefined || 
    ((typeof valueSpecTuple.value !== "object") &&
    !isArrayTemplate(valueSpecTuple));
};

var isArray = exports.isArray = function isArray(valueSpecTuple) {
  return util.isArray(valueSpecTuple.value) || 
    isArrayTemplate(valueSpecTuple);
};

var isObject = exports.isObject = function isObject(valueSpecTuple) {
  return !isText(valueSpecTuple) && 
    !isArray(valueSpecTuple) && 
    typeof valueSpecTuple.value === "object";
};

exports.hasProperty = function (valueSpecTuple, propertyName) {
  return valueSpecTuple.value && 
    isObject(valueSpecTuple) && 
    propertyName in valueSpecTuple.value;
};

exports.nameMatches = function (valueSpecTuple, pattern) {
  return valueSpecTuple.spec.name && pattern.test(valueSpecTuple.spec.name);
};

exports.and = function and() {
  var predicates = Array.prototype.slice.call(arguments);
  return function andPredicate(yaml) {
    return predicates.every(function (predicate) {
      return predicate(yaml);
    });
  };
};

exports.or = function or() {
  var predicates = Array.prototype.slice.call(arguments);
  return function orPredicate(yaml) {
    return predicates.some(function (predicate) {
      return predicate(yaml);
    });
  };
};

exports.not = function not(predicate) {
  return function notPredicate(yaml) {
    return !predicate(yaml);
  };
};
