var through = require("through2");
var YAML = require("yamljs");
var fs = require("fs");
var path = require("path");
var util = require("util");

var includeBaseDir = path.resolve(process.cwd(), "./src/");

function expandToValueSpecTuple(value) {
  if (util.isObject(value)) {
    if ("_templates" in value) return value;
    if ("_include" in value) {
      expandIncludesForObject(value);
    }
    
    if ("value" in value) {
      if (!value.spec) value.spec = {};
      return value;
    }
  }

  return {
    value: value,
    spec: {}
  };
}

function expandIncludesForObject(obj) {
  if (!("_include" in obj)) return;

  var path = obj._include;
  delete obj._include;

  var include = getInclude(path);

  for (var p in include) {
    obj[p] = include[p];
  }
}

function expandIncludesForValueSpecTuple(valueSpecTuple) {
  if (!util.isObject(valueSpecTuple)) return;
  expandIncludesForObject(valueSpecTuple);
  if (!("value" in valueSpecTuple) || !util.isObject(valueSpecTuple.value)) return;
  expandIncludesForObject(valueSpecTuple.value);
}

function processValueSpecTuple(valueSpecTuple, name) {
  if (name && !valueSpecTuple.name) valueSpecTuple.name = name;

  expandIncludesForValueSpecTuple(valueSpecTuple);

  // process value/spec templates
  if (valueSpecTuple._templates) {
    valueSpecTuple._templates.forEach( function (template) {
      template.content = expandToValueSpecTuple(template.content);
      processValueSpecTuple(template.content, name);
    });
  } // process value templates
  else if (valueSpecTuple.value && valueSpecTuple.value._templates) {
    var isArrayTemplate = valueSpecTuple.value._templates[0].tag.indexOf("@") === 0;

    if (isArrayTemplate) {
      exports.extensions(valueSpecTuple);
    }

    function getValueSpecTupleForTemplate(template) {
      if (isArrayTemplate) {
        template.content = expandToValueSpecTuple(template.content);
        return template.content;
      }

      return {
        value: template.content,
        spec: valueSpecTuple.spec
      };
    }

    valueSpecTuple.value._templates.forEach( function (template) {
      var vsp = getValueSpecTupleForTemplate(template);
      processValueSpecTuple(vsp, name);
    });
  } // process values
  else {
    // if value is object or array, recursively process child values
    if (util.isObject(valueSpecTuple.value)) {
      for (var p in valueSpecTuple.value) {
        valueSpecTuple.value[p] = expandToValueSpecTuple(valueSpecTuple.value[p]);
        processValueSpecTuple(valueSpecTuple.value[p], p);
      }
    }

    exports.extensions(valueSpecTuple);
  }
}

function parseYaml(buffer) {
  // ensure unique object instances by stringifying first
  return YAML.parse(
    YAML.stringify(
      YAML.parse(
        buffer.toString()
      )
    )
  );
}

function getInclude(includePath) {
  if(includePath.indexOf("/") === 0) includePath = "." + includePath;
  var fullName = path.resolve(includeBaseDir, includePath);
  var buffer = fs.readFileSync(fullName);
  return parseYaml(buffer);
}

function normalizeYamlFile(file, enc, cb) {

  try {
    var yaml = parseYaml(file.contents);
    var valueSpecTuple = expandToValueSpecTuple(yaml);

    processValueSpecTuple(valueSpecTuple, null);

    valueSpecTuple.url = path.relative(file.base, file.path);
    exports.extensions.done(valueSpecTuple);
    delete valueSpecTuple.url;

    file.contents = new Buffer(YAML.stringify(valueSpecTuple, Number.MAX_VALUE, 2));
    cb(null, file);
  }
  catch(ex){
    console.log(file.path, ex);
    cb(ex, null);
  }
}

module.exports = exports = function (includeRoot) {
  if(includeRoot) includeBaseDir = includeRoot;
  return through.obj(normalizeYamlFile);
};

exports.extensions = require("./extensible")();
