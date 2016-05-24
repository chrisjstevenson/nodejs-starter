var through = require("through2");
var File = require("gulp-util").File;
var path = require("path");

module.exports = exports = function () {
  var folders = {};
  
  return through.obj(function (file, enc, cb) {
    var directoryName = path.dirname(file.path);
    if (!folders[directoryName]) {
      folders[directoryName] = [];
    }
    
    folders[directoryName].push(file.path);
    
    var lynx = {
      spec: {
        hints: [ "object" ],
        children: [
          {
            name: "index",
            hints: [ "array" ],
            children: {
              hints: [ "object" ],
              children: [
                {
                  name: "title",
                  hints: [ "title", "text" ]
                },
                {
                  name: "items",
                  hints: [ "array" ],
                  children: {
                    hints: [ "link" ],
                    children: [
                      {
                        name: "title",
                        hints: [ "title", "text" ]
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      index: []
    };
    
    var cwd = process.cwd();
    
    for (var folder in folders) {
      var f = {
        title: folder.replace(path.join(cwd, "out"), "").replace(/\\/g, "/"),
        items: []
      };
      
      folders[folder].forEach(function (filePath) {
        var href = filePath.replace(path.join(cwd, "out"), "").replace(/\\/g, "/");
        var link = {
          title: href,
          href: href
        };
        f.items.push(link);
      });
      
      lynx.index.push(f);
    }
    
    this.push(new File({
      cwd: cwd,
      base: cwd,
      path: "test-index.lnx",
      contents: new Buffer(JSON.stringify(lynx, null, 2))
    }));
    
    cb();
  });
};
