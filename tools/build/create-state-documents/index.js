var through = require("through2");
var YAML = require("yamljs");
var File = require("gulp-util").File;
var path = require("path");
var fs = require("fs");
var mustache = require("mustache");
var handlebars = require("handlebars");
var urls = require("../urls");
var lint = require("json-lint");
var gutil = require("gulp-util");
// if we're going to put examples in here that require handlebars, then 
//   'gulp build' better work when you pull, then
//   handlebars better be the default
var argv = require("yargs").default("handlebars", true).argv;

var red = gutil.colors.red;
var green = gutil.colors.green;

var useHandlebars = argv.handlebars !== undefined;

function renderTemplate(contents, data) {
  if (useHandlebars === true) {
    var template = handlebars.compile(contents, {compat: true});
    return template(data);
  }
  return mustache.render(contents, data);
}

function createStateDocument(file, dataFilePath, data, createFile) {

  var result = {
    path: dataFilePath.replace(".data" + path.sep, "-").replace(/\.yml$|\.json$|\.js$/, ".lnx").replace("-default.lnx", ".lnx"),
    contents: null
  };

  if (!data.urls) data.urls = urls.data;
  var contents = renderTemplate(file.contents.toString(), data);
  var linted = lint(contents);
  if (linted.error) {
    var message = "Invalid state document. Merge of template and data file resulted in invalid JSON. \r\nTemplate: ".concat(file.path, "\r\nData file: ", dataFilePath, "\r\n", linted.error, " at ", linted.line, ":", linted.character);
    gutil.log(red(message), "\r\n", green(contents.substr(0, linted.character - 1)), red(contents.substr(linted.character - 1)));
    throw new Error("Unable to create valid state document");
  }

  result.contents = new Buffer(contents);

  createFile(result);
}

function safeYamlParse(buffer) {
  return YAML.parse(
    YAML.stringify(
      YAML.parse(
        buffer.toString()
      )
    )
  );
}

function processDataFiles(sourceFile, dataDir, createFile, cb) {

  function readDataFile(dataFile) {
    var contents = fs.readFileSync(dataFile);
    try {
      if (path.extname(dataFile) === ".yml") {
        return safeYamlParse(contents) || {};//protect against empty data file
      }
      else if (path.extname(dataFile) === ".json") {
        return JSON.parse(contents.toString());
      }
      else if (path.extname(dataFile) === ".js") {
        function resolveDataFile(otherDataFile) {
          otherDataFile = path.resolve(path.dirname(dataFile), otherDataFile);
          return readDataFile(otherDataFile);
        }
        
        delete require.cache[require.resolve(dataFile)];

        var generator = require(dataFile);
        return generator(resolveDataFile);
      }
      else {
        throw new Error("Unrecognized example data file");
      }
    }
    catch (err) {
      console.log(dataFile, err);
      throw err;
    }
  }

  function processDataFile(dataFile) {
    var data = readDataFile(dataFile);

    createStateDocument(sourceFile, dataFile, data, createFile);
  }

  function onDataFiles(err, dataFiles) {
    if (err) return cb(); //notify done with source file

    dataFiles.forEach(function (dataFile) {
      var dataFileFull = path.join(dataDir, dataFile);
      processDataFile(dataFileFull);
    });

    cb(); //notify done with source file  
  }

  fs.readdir(dataDir, onDataFiles);

}

function createStateDocuments() {
  return through.obj(function (file, enc, cb) {

    var self = this;
    // exit if the current file is not a mustache template
    if (path.extname(file.path) !== ".mustache") return cb(null, file);

    var dataDir = file.path.replace(".mustache", ".data");

    function createFile(result) {
      if (!result || !result.path || !result.contents) return;

      var data = new File({
        cwd: file.cwd,
        base: file.base,
        path: result.path,
        contents: result.contents
      });

      self.push(data);
    }

    function checkAndProcess(err, stat) {
      if (err || !stat.isDirectory()) {
        // create an empty default.yml data file
        var dataFilePath = path.join(dataDir, "default.yml");
        var data = {};
        createStateDocument(file, dataFilePath, data, createFile);
        return cb(); //notify done with source file
      }
      processDataFiles(file, dataDir, createFile, cb);
    }

    fs.stat(dataDir, checkAndProcess);
  });
}

module.exports = createStateDocuments;
