
module.exports = exports = function (readDataFile) {
  var data = readDataFile("./default.js");
  
  //copy the first item in the array 50 times
  for(var i = 0; i <= 50; i++){
    data.matchingProducts.push(data.matchingProducts[0]);
  }
  
  return data;
};
