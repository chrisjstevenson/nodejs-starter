var util = require("util");
var path = require("path");
var url = require("url");
var predicates = require("./predicates");
var urls = require("../../urls");
var nameMatches = predicates.nameMatches;
var isText = predicates.isText;
var isArray = predicates.isArray;
var isObject = predicates.isObject;
var hasProperty = predicates.hasProperty;

function hasHint(valueSpecTuple, hintName) {
  return valueSpecTuple.spec.hints.some(function (hint) {
    return hint === hintName;
  });
}

function hasBaseHint(valueSpecTuple) {
  return ["container", "link", "form", "submit", "content", "text"].some(function (baseHintName) {
    return hasHint(valueSpecTuple, baseHintName);
  });
}

exports.setSpecName = function setSpecName(valueSpecTuple) {
  if (!valueSpecTuple.name) return;
  valueSpecTuple.spec.name = valueSpecTuple.name;
};

exports.normalizeSpecHints = function normalizeSpecHints(valueSpecTuple) {
  var hints = valueSpecTuple.spec.hints || [];
  if (!util.isArray(hints)) hints = [hints];
  valueSpecTuple.spec.hints = hints;
};

exports.titleLabelsItsContainer = function titleLabelsItsContainer(valueSpecTuple) {
  if (hasProperty(valueSpecTuple, "title")) {
    valueSpecTuple.spec.labeledBy = "title";
  }
};

exports.inferTitle = function inferTitle(valueSpecTuple) {
  if (nameMatches(valueSpecTuple, /title/i) &&
    isText(valueSpecTuple) && !hasHint(valueSpecTuple, "label")) {
    valueSpecTuple.spec.hints.push("label");
  }
};

exports.inferLabel = function inferLabel(valueSpecTuple) {
  if (nameMatches(valueSpecTuple, /label$/i) && isText(valueSpecTuple)) {
    valueSpecTuple.spec.hints.push("label");
  }
};

exports.inferText = function inferText(valueSpecTuple) {
  if (isText(valueSpecTuple) && !hasHint(valueSpecTuple, "text")) {
    valueSpecTuple.spec.hints.push("text");
  }
};

exports.inferTextInput = function inferTextInput(valueSpecTuple) {
  if (hasHint(valueSpecTuple, "text") && valueSpecTuple.spec.input) {
    valueSpecTuple.spec.hints.splice(valueSpecTuple.spec.hints.length - 1, 0, "phrasing");
  }
};

exports.inferLink = function inferLink(valueSpecTuple) {
  if (hasProperty(valueSpecTuple, "href")) {
    if (!hasBaseHint(valueSpecTuple)) {
      valueSpecTuple.spec.hints.push("link");
    }
    convertToDataProperties(valueSpecTuple, ["href", "type"]);
    applyUrlsConvention(valueSpecTuple, "href");
  }
};

exports.inferImage = function inferImage(valueSpecTuple) {
  if (hasProperty(valueSpecTuple, "height") && hasProperty(valueSpecTuple, "width")) {
    if (!hasBaseHint(valueSpecTuple)) {
      valueSpecTuple.spec.hints.push("image");
    }
    convertToDataProperties(valueSpecTuple, ["height", "width"]);
  }
};

exports.inferContent = function inferContent(valueSpecTuple) {
  var hasSrc = hasProperty(valueSpecTuple, "src");
  var hasDataAndType = hasProperty(valueSpecTuple, "data") && hasProperty(valueSpecTuple, "type");

  if ((hasSrc || hasDataAndType)) {
    if (!hasBaseHint(valueSpecTuple)) {
      valueSpecTuple.spec.hints.push("content");
    }
    convertToDataProperties(valueSpecTuple, ["data", "type", "src", "scope", "alt"]);
    applyUrlsConvention(valueSpecTuple, "src");
  }
};

exports.inferForm = function inferForm(valueSpecTuple) {
  if (nameMatches(valueSpecTuple, /form$/i) && !hasBaseHint(valueSpecTuple)) {
    valueSpecTuple.spec.hints.push("form");
  }
};

exports.inferSubmit = function inferSubmit(valueSpecTuple) {
  if (hasProperty(valueSpecTuple, "action")) {
    if (!hasBaseHint(valueSpecTuple)) {
      valueSpecTuple.spec.hints.push("submit");
    }
    convertToDataProperties(valueSpecTuple, ["action", "method", "enctype"]);
    applyUrlsConvention(valueSpecTuple, "action");
  }
};

exports.inferInputSection = function inferInputSection(valueSpecTuple) {
  if (nameMatches(valueSpecTuple, /section$/i) && hasProperty(valueSpecTuple, "label") && !hasHint(valueSpecTuple, "section")) {
    valueSpecTuple.spec.hints.push("section");
    valueSpecTuple.spec.labeledBy = valueSpecTuple.spec.labeledBy || "label";

    function isInput(node) {
      return node.spec && !!node.spec.input;
    }

    var inputNode = find(valueSpecTuple, isInput);
    if (inputNode) {
      inputNode.spec.labeledBy = inputNode.spec.labeledBy || "label";
    }

    function isLabel(node) {
      return node.spec && node.spec.hints.indexOf("label") >= 0;
    }

    var labelNode = find(valueSpecTuple, isLabel);
    if (labelNode) {
      labelNode.spec.hints.unshift("header");
    }
  }
};

function find(node, sel) {
  if (sel(node)) return node;
  if (!util.isObject(node)) return null;

  for (var p in node) {
    if (sel(node[p])) return node[p];
    var result = find(node[p], sel);
    if (result) return result;
  }

  return null;
}

exports.inferSection = function inferSection(valueSpecTuple) {
  var needsSectionHint = !hasHint(valueSpecTuple, "section");
  var defaultLabeledBy;
  
  if (hasProperty(valueSpecTuple, "header")) defaultLabeledBy = "header";
  if (hasProperty(valueSpecTuple, "banner")) defaultLabeledBy = "banner";
  
  if (defaultLabeledBy) {
    if (needsSectionHint) valueSpecTuple.spec.hints.push("section");
    valueSpecTuple.spec.labeledBy = valueSpecTuple.spec.labeledBy || defaultLabeledBy;
  }
};

exports.inferContainer = function inferContainer(valueSpecTuple) {
  if ((isArray(valueSpecTuple) || 
    isObject(valueSpecTuple)) && 
    !hasBaseHint(valueSpecTuple)) {
    valueSpecTuple.spec.hints.push("container");
  }
};

exports.inferHeader = function inferHeader(valueSpecTuple) {
  if (nameMatches(valueSpecTuple, /header|banner$/i)) {
    if (!hasHint(valueSpecTuple, "header")) valueSpecTuple.spec.hints.push("header");
    if (!hasHint(valueSpecTuple, "label")) valueSpecTuple.spec.hints.push("label");
  }
};

exports.removeRealmSpec = function removeRealmSpec(valueSpecTuple) {
  convertToDataProperties(valueSpecTuple, ["realm"]);
};

exports.removeScopeSpec = function removeScopeSpec(valueSpecTuple) {
  convertToDataProperties(valueSpecTuple, ["scope"]);
};


exports.addFollowDelay = function addFollowDelay(followDelay) {
  return function (valueSpecTuple) {
    if (valueSpecTuple.spec.follow !== 0) return;
    valueSpecTuple.spec.follow = followDelay;
  };
};

exports.inferMediaType = function inferMediaType(valueSpecTuple) {
  if (!valueSpecTuple.value) return;
  if (valueSpecTuple.value.type) return;
  if (hasHint(valueSpecTuple, "image")) return;
  if (!hasHint(valueSpecTuple, "link") && !hasHint(valueSpecTuple, "content")) return;
  
  valueSpecTuple.value.type = "application/lynx+json";
};

exports.inferAttributeList = function inferAttributeList(valueSpecTuple) {
  if (nameMatches(valueSpecTuple, /attributes$/i)) {
    if (!hasHint(valueSpecTuple, "http://bestbuy.com/retail/ux-patterns/attribute-list")) valueSpecTuple.spec.hints.push("http://bestbuy.com/retail/ux-patterns/attribute-list");
  }
};

exports.inferListing = function inferListing(valueSpecTuple) {
  if (nameMatches(valueSpecTuple, /listing$/i)) {
    if (!hasHint(valueSpecTuple, "http://bestbuy.com/retail/ux-patterns/listing")) valueSpecTuple.spec.hints.push("http://bestbuy.com/retail/ux-patterns/listing");
  }
};

exports.applyRealmToDocument = function applyRealmToDocument(realmBaseURI) {
  return function (valueSpecTuple) {
    if (!valueSpecTuple.realm && valueSpecTuple.value && valueSpecTuple.value.realm) {
      valueSpecTuple.realm = valueSpecTuple.value.realm;
      delete valueSpecTuple.value.realm;
    }
    
    if (valueSpecTuple.realm) return;
    if (!valueSpecTuple.url) return;
    
    var realmPath = path.join(path.dirname(valueSpecTuple.url), "/");
    valueSpecTuple.realm = url.resolve(realmBaseURI, realmPath);
  };
};

function convertToDataProperties(valueSpecTuple, properties) {
  if (!util.isObject(valueSpecTuple.value)) return;

  properties.forEach(function (property) {
    if (property in valueSpecTuple.value &&
      (util.isObject(valueSpecTuple.value[property]) &&
      "value" in valueSpecTuple.value[property])) {
      valueSpecTuple.value[property] = valueSpecTuple.value[property].value;
    }
  });
}

function applyConventions(valueSpecTuple, options) {
  if (!("value" in valueSpecTuple)) return;
  conventions.forEach(function (convention) {
    convention(valueSpecTuple, options);
  });
}

function applyUrlsConvention(valueSpecTuple, key) {
  var hypertextRef = valueSpecTuple.value[key];
  if (!hypertextRef || hypertextRef.indexOf("urls.") !== 0) return;

  var urlKey = hypertextRef;
  valueSpecTuple.value[key] = "{{{" + urlKey + "}}}";
  urls.warnIfKeyNotFound(urlKey);
}
