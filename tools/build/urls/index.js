var YAML = require("yamljs");
var fs = require("fs");
var path = require("path");
var util = require("util");
var gutil = require("gulp-util");

var red = gutil.colors.red;
var yellow = gutil.colors.yellow;
var green = gutil.colors.green;
var paramEx = /[-/]?\[\S+?]/g;

function getUrlsObject() {
  try {
    var content = fs.readFileSync(path.resolve("./src/urls.yml"));
    return YAML.parse(content.toString());
  }
  catch (err) {
    console.log("Unable to parse 'urls' data file.", err);
  }
}

function warnIfKeyNotFound(key) {
  var segments = key.split(".");
  var current = exports.data;

  return segments.every(function (segment, index) {
    if (segment === "urls") return true;
    current = current[segment];
    if (index < segments.length - 1 && current) return true;
    if (util.isString(current)) return true;

    if (current) gutil.log(red("url is not a string"), yellow("'" + key + "' at"), green("'" + segment + "'"));
    else gutil.log(red("url is not found"), yellow("'" + key + "' at"), green("'" + segment + "'"));
    return false;
  });
}
function verify(rootDirectory) {
  function getAccessCallback(url) {
    return function (err) {
      if (err) gutil.log(red("url doesn't exist:"), yellow(url));
    };
  }
  function enumerateValues(container) {
  for (var p in container) {
    if (!container.hasOwnProperty(p)) continue;
    var current = container[p];
      if (util.isObject(current)) enumerateValues(current);
    else {
        var location = path.resolve(rootDirectory, "." + removeSegmentParameters(current));
        fs.access(location, getAccessCallback(current));
      }
    }
  }
  enumerateValues(exports.data);
}

function removeSegmentParameters(location) {
  if (!location) return location;
  return location.replace(paramEx, "");
}

function reload() {
  exports.data = getUrlsObject();
}

exports.data = getUrlsObject();
exports.warnIfKeyNotFound = warnIfKeyNotFound;
exports.verify = verify;
exports.removeSegmentParameters = removeSegmentParameters;
exports.reload = reload;
