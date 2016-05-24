var util = require("util");

module.exports = exports = function (readDataFile) {
  var data = readDataFile("../_default-data.yml");

  //change the image urls to random product image 1-10
  function lookForImage(value){
    for(var p in value){
      if(p === "image" && value[p].url !== undefined) {
        value[p].url = randomizeProductImage();
        continue;
      }
      if(util.isString(value[p])) continue;
      lookForImage(value[p]);
    }
  }
  
  function randomizeProductImage(){
    var value = Math.floor(Math.random() * 10) + 1;
    return "/images/" + value + ".jpg";
  }
  
  lookForImage(data);

  return data;
};
