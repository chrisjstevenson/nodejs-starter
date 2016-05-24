var util = require("util");
// if we're going to put examples in here that require handlebars, then 
//   'gulp build' better work when you pull, then
//   handlebars better be the default
var argv = require("yargs").default("handlebars", true).argv;

var useHandlebars = argv.handlebars !== undefined;

var arrayItemSeparator = useHandlebars === true ? "{{#unless @last}},{{/unless}}" : "{{^last}},{{/last}}";

function writeStartBlock(template, output) {
  var tag = template.tag.replace(/^@/, "#");
  output.push(" {{" + tag + "}} ");
}

function writeEndBlock(template, output) {
  output.push(" {{/" + template.tag.substr(1) + "}} ");
}

function isValueSpecTuple(obj) {
  return util.isObject(obj) &&
    "value" in obj &&
    "spec" in obj;
}

function generateOutputFor(valueOrValueSpecTuple, output) {
  if (isValueSpecTuple(valueOrValueSpecTuple)) {
    generateOutputForValueSpecTuple(valueOrValueSpecTuple, output);
  }
  else {
    generateOutputForValue(valueOrValueSpecTuple, output);  
  }
}

function generateOutputForValueTemplate(value, output) {
  var isArrayTemplate = value._templates[0].tag.indexOf("@") === 0;
  if (isArrayTemplate) output.push("[");
  
  value._templates.forEach( function (template) {
    writeStartBlock(template, output);
    
    generateOutputFor(template.content, output);

    if (template.tag.indexOf("@") === 0) output.push(arrayItemSeparator);
    writeEndBlock(template, output);
  });
  
  if (isArrayTemplate) {
    output.push("]");
  }
}

function generateOutputForArray(value, output) {
  output.push("[");
  for (var p in value) {
    generateOutputForValueSpecTuple(value[p], output);
    output.push(",");
  }
  if (output[output.length - 1] === ",") output.pop();
  output.push("]");
}

function generateOutputForObject(value, output) {
  output.push("{");
  for (var p in value) {
    output.push(JSON.stringify(p));
    output.push(":");
    generateOutputFor(value[p], output);
    output.push(",");
  }
  if (output[output.length - 1] === ",") output.pop();
  output.push("}");
}

function generateOutputForValue(value, output) {
  // templates
  if (value && value._templates) {
    return generateOutputForValueTemplate(value, output);
  }
  
  //  array
  if (util.isArray(value)) {
    return generateOutputForArray(value, output);
  }
  
  // object
  if (util.isObject(value)) {
    return generateOutputForObject(value, output)
  }
  
  // string, number, true, false, null (for ` template prefix, just output the value with no quotes)
  if (value && value.toString().indexOf("`") != -1) {
    console.log(value);
    output.push(value.replace(/`/g, ""));
  } else {
    output.push(JSON.stringify(value));
  }
}

function generateOutputForSpec(spec, output) {
  output.push(JSON.stringify(spec));
}

function generateOutputForValueSpecTuple(valueSpecTuple, output) {
  // process value/spec templates
  if (valueSpecTuple._templates) {
    valueSpecTuple._templates.forEach( function (template) {
      writeStartBlock(template, output);
      generateOutputForValueSpecTuple(template.content, output);
      writeEndBlock(template, output);
    });
    
    return;
  }

  if (util.isObject(valueSpecTuple.spec)) {
    output.push('{"value":');
    generateOutputForValue(valueSpecTuple.value, output);
    output.push(',"spec":');
    generateOutputForSpec(valueSpecTuple.spec, output);
    if (valueSpecTuple.realm) {
      output.push(',"realm": ' + JSON.stringify(valueSpecTuple.realm));
    }
    output.push("}");
  }
  else {
    generateOutputForValue(valueSpecTuple, output);
  } 
}

function getMustacheForValueSpecTuple(valueSpecTuple) {
  var output = [];
  generateOutputForValueSpecTuple(valueSpecTuple, output);
  return output.join("");
}

function generateLynxMustacheFile(file, valueSpecTuple, createFile) {
  var mustacheFile = {
    path: file.path.replace(".yml", ".mustache"),
    contents: new Buffer(getMustacheForValueSpecTuple(valueSpecTuple))
  };

  createFile(mustacheFile);
}

module.exports = exports = generateLynxMustacheFile;
