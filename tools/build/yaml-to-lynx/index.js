var through = require("through2");
var YAML = require("yamljs");
var File = require("gulp-util").File;
var generateLynxMustacheFile = require("../yaml-to-mustache");
var util = require("util");
var md5 = require("md5");

module.exports = exports = function (specBasePath) {
  function ensureChildrenProperty(spec) {
    spec.children = spec.children || [];
  }

  function flattenValueSpecPair(vsp) {

    if (!util.isObject(vsp.value)) return;
    //loop through the children and flatten
    for (var p in vsp.value) {
      var child = vsp.value[p];
      if (child._templates) {
        ensureChildrenProperty(vsp.spec);
        vsp.spec.children.push({name: child.name});
        continue;
      }

      if (!child.spec)continue;

      flattenValueSpecPair(child);

      ensureChildrenProperty(vsp.spec);
      vsp.spec.children.push(child.spec);
      if (child.value !== undefined && child.value !== null && !child.value._templates) vsp.value[p] = child.value;
    }
  }

  function generate(file, createFile) {
    var vsp = YAML.parse(file.contents.toString());

    //flatten yaml and pull up static spec
    flattenValueSpecPair(vsp);

    //create spec file
    var buffer = new Buffer(JSON.stringify(vsp.spec));
    var hash = md5(buffer);
    var specUrl = file.path.replace(".yml", "-" + hash + ".lnxs");
    
    createFile({path: specUrl, contents: buffer});
    vsp.spec = specUrl.replace(file.base, specBasePath || "/").replace(/\\/g, "/");

    if (util.isObject(vsp.value) && !vsp.value._templates) {
      for (var p in vsp.value) {
        vsp[p] = vsp.value[p];
      }
      delete vsp.value;
    }

    //create mustache file
    generateLynxMustacheFile(file, vsp, createFile);
  }

  //noinspection JSUnusedLocalSymbols
  function generate_gulp(file, enc, cb) {
    var self = this;

    function createFile(result) {
      var data = result.cwd ? result :
        new File({
          cwd: file.cwd,
          base: file.base,
          path: result.path,
          contents: result.contents
        });

      self.push(data);
    }

    generate(file, createFile);
    self.push(file);
    cb();
  }

  return function() {
    return through.obj(generate_gulp);  
  }
};
