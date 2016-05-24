(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var notBlockName = /^-|^_|__|--/;

function hasNoBlock() {
  return function(result) {
    var isNotBlock = Array.prototype.every.call(result.element.classList, function (className) {
      return notBlockName.test(className);
    });

    return isNotBlock;
  };
}

module.exports = exports = function (app) {
  //TODO: This feels like we're not classifying properly. Is this necessary.
  function remove(name) {
    name = app.extensions.common.css.qualifiedClassName(name);
    
    function isRelatedClassName(className) {
      if (className === name) return true;
      if (className.indexOf(name + "__") === 0) return true;
      if (className.indexOf(name + "--") === 0) return true;
      
      return false;
    }
    
    return function (result) {
      var elements = app.extensions.common.select("*")(result.element);
      
      elements.forEach(function (el) {
        var classList = [];
        Array.prototype.forEach.call(el.classList, function (c) {
          if (!isRelatedClassName(c)) {
            classList.push(c);
          }
        });
        el.className = classList.join(" ");
      });
      
      return result;
    };
  }
  
  function block(name) {
    return function (result) {
      name = app.extensions.common.css.qualifiedClassName(name);
      
      if (hasNoBlock()(result)) {
        result.element.classList.add(name);
      }
      
      return result;
    };
  }
  
  function addBemClass(name) {
    name = app.extensions.common.css.qualifiedClassName(name);
    return function (result) {
      result.element.classList.add(name);
      return result;
    };
  }

  return {
    block: block,
    element: addBemClass,
    modifier: addBemClass,
    mixin: addBemClass,
    state: addBemClass,
    remove: remove,
    hasNoBlock: hasNoBlock
  };
};

},{}],2:[function(require,module,exports){
module.exports = exports = function (app) {
  function applyLinkBehavior(result) {
    var linkElements = app.extensions.common.select("a,[role*=link]")(result.element);
    linkElements.forEach(applyLinkBehaviorToLinkElement);
    return result;
  }
  
  function applyLinkBehaviorToLinkElement(linkElement) {
    function followLink(delay) {
      var options = {};
      options.type = linkElement.type || linkElement.dataset.type;
      options.origin = linkElement;
      
      if (delay) {
        options.delay = delay;
      }
      
      app.follow(linkElement.href || linkElement.dataset.href, options);
    }
    
    function isControlledCommand(e) {
      if (linkElement.tagName !== "A") return false;
      
      return (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey);
    }

    linkElement.addEventListener("click", function(e) {
      if (isControlledCommand(e)) return;
      
      e.stopPropagation();
      e.preventDefault();
      followLink();
    });

    linkElement.addEventListener("keydown", function(e) {
      if (isControlledCommand(e)) return;
      
      if (e.keyCode !== 13) return;
      e.stopPropagation();
      e.preventDefault();
      followLink();
    });
    
    if (linkElement.dataset.follow) {
      followLink(linkElement.dataset.follow);
    }
  }
  
  return applyLinkBehavior;
};

},{}],3:[function(require,module,exports){
module.exports = exports = function (app) {
  
  function applyOptionsKeyboardBehavior(optionSelector, selectedOptionSelector) {
    return function (result) {
      var optionsElement = result.element;
      
      if (optionsElement.removeOptionsKeyboardBehavior) return result;
      
      function onOptionKeyDown(evt) {
        var activeOptionElement = getActiveOptionElement(optionsElement, optionSelector);
        var nextOptionElement;
        var select = app.extensions.common.select;
        
        if (isDownKey(evt) || isRightKey(evt)) {
          nextOptionElement = getRelatedOptionElement(optionsElement, activeOptionElement, 1, optionSelector);
          shiftOptionFocus(activeOptionElement, nextOptionElement);
          evt.preventDefault();
        } else if (isUpKey(evt) || isLeftKey(evt)) {
          nextOptionElement = getRelatedOptionElement(optionsElement, activeOptionElement, -1, optionSelector);
          shiftOptionFocus(activeOptionElement, nextOptionElement);
          evt.preventDefault();
        } else if (isSpaceKey(evt)) {
          activeOptionElement = activeOptionElement ||
            select(selectedOptionSelector).first() ||
            select(optionSelector)(optionsElement).first();

          if (activeOptionElement) activeOptionElement.click();
          evt.preventDefault();
        }
      }
      
      optionsElement.tabIndex = "0";
      optionsElement.addEventListener("keydown", onOptionKeyDown);
      
      optionsElement.removeOptionsKeyboardBehavior = function () {
        delete optionsElement.removeOptionsKeyboardBehavior;
        
        optionsElement.removeAttribute("tabindex");
        
        function removeTabIndex(optionElement) {
          optionElement.removeAttribute("tabindex");
        }
        
        var optionsWithTabIndex = app.extensions.common.select(optionSelector + "[tabindex]")(optionsElement);
        optionsWithTabIndex.forEach(removeTabIndex);
        
        optionsElement.removeEventListener("keydown", onOptionKeyDown);
      };
      
      return result;
    };
  }

  function shiftOptionFocus(fromOptionElement, toOptionElement) {
    if (fromOptionElement === toOptionElement) return toOptionElement.focus();

    if (fromOptionElement) fromOptionElement.tabIndex = "-1";

    toOptionElement.tabIndex = "0";
    toOptionElement.focus();
  }

  function getRelatedOptionElement(optionsSourceElement, activeOptionElement, position, optionSelector) {
    var select = app.extensions.common.select;
    var optionElements = select(optionSelector)(optionsSourceElement);

    if (!activeOptionElement) return optionElements.first();
    
    optionElements = optionElements.array();

    for (var i = 0; i < optionElements.length; i++) {
      var currentOptionElement = optionElements[i];
      if (currentOptionElement === activeOptionElement) return optionElements[i + position] || activeOptionElement;
    }

    return null;
  }

  function getActiveOptionElement(optionsSourceElement, optionSelector) {
    var select = app.extensions.common.select;
    return select(optionSelector + "[tabindex='0']")(optionsSourceElement).first();
  }

  var KEY_SPACE = 32;
  var KEY_LEFT = 37;
  var KEY_UP = 38;
  var KEY_RIGHT = 39;
  var KEY_DOWN = 40;

  function isSpaceKey(evt) {
    return evt.keyCode === KEY_SPACE;
  }

  function isLeftKey(evt) {
    return evt.keyCode === KEY_LEFT;
  }

  function isUpKey(evt) {
    return evt.keyCode === KEY_UP;
  }

  function isRightKey(evt) {
    return evt.keyCode === KEY_RIGHT;
  }

  function isDownKey(evt) {
    return evt.keyCode === KEY_DOWN;
  }

  return applyOptionsKeyboardBehavior;
};

},{}],4:[function(require,module,exports){
(function (Buffer){
var Q = require("q");

module.exports = exports = function (app) {
  function applySubmitBehavior(result) {
    var select = app.extensions.common.select;
    var buttonElements = select("button,[role*=button]")(result.element);
    buttonElements.forEach(applySubmitBehaviorToSubmitElement);
    return result;
  }

  function applySubmitBehaviorToSubmitElement(submitElement) {
    function sendForm() {
      function addFormData(options) {
        options.formdata = [];

        var form = app.extensions.common.findNearestAncestor(submitElement, "[data-lynx-hints~=form]");
        if (!form) return options;

        function addFileInputToFormData(elem) {
          var deferred = Q.defer();

          var fileReader = new FileReader();
          var file = inputElement.files[0];

          if (!file) return;

          fileReader.onloadend = function () {
            if (fileReader.error) {
              deferred.reject(fileReader.error);
            }
            else {
              deferred.resolve({
                name: elem.name,
                value: {
                  type: file.type,
                  data: new Buffer(fileReader.result, "binary")
                }
              });
            }
          };

          fileReader.readAsBinaryString(file);

          return deferred.promise;
        }

        function createPromiseForFormData(formElement) {
          if (formElement.type === "file") return addFileInputToFormData(formElement);

          return Q(formElement).then(function (elem) {
            return {
              name: elem.name,
              value: {
                type: "",
                data: new Buffer(elem.value)
              }
            };
          });
        }

        var select = app.extensions.common.select;
        var inputSelector = "input:not([disabled]),textarea:not([disabled]),select:not([disabled])";
        var inputs = select(inputSelector)(form);
        var promises = inputs.map(createPromiseForFormData).array();

        function updateOptionsWithFormData(formdata) {
          options.formdata = formdata;
          return options;
        }

        return Q.all(promises).then(updateOptionsWithFormData).fail(app.error);
      }

      function sendFormData(options) {
        return app.send(submitElement.dataset.action, options);
      }

      var options = {};
      options.method = submitElement.dataset.method || "";
      options.enctype = submitElement.dataset.enctype || "";
      options.origin = submitElement;

      Q(options)
        .then(addFormData)
        .then(sendFormData);
    }

    submitElement.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      sendForm();
    });

    submitElement.addEventListener("keydown", function(e) {
      if (e.keyCode !== 13) return;
      e.stopPropagation();
      e.preventDefault();
      sendForm();
    });
  }

  return applySubmitBehavior;
};

}).call(this,require("buffer").Buffer)
},{"buffer":80,"q":134}],5:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  function apply(selector, elementFunction) {
    return function (result) {
      var elements = app.extensions.common.select(selector)(result.element);
      var promises = [];

      elements.forEach(function (element) {
        promises.push(elementFunction({element: element}));
      });

      return Q.all(promises).then( function () { return result; } );
    };
  }
  
  return apply;
};

},{"q":134}],6:[function(require,module,exports){
module.exports = exports = function (app) {
  function attachElementByScope(result) {
    var element = result.element;
    var origin = result.options.origin;
    
    // if the element has already been attached
    if (element.parentElement) return result;
    
    // if the element doesn't have a realm
    var realm = element.dataset.contentRealm;
    if (!realm) return result;
    
    // if no matching scope is found
    var matchingElement = app.extensions.common.findNearestElement(origin, function (currentElement) {
      var scope = currentElement.dataset.contentScope;
      if (!scope) return false;
      return app.extensions.common.scopeIncludesRealm(scope, realm);
    });
    
    if (!matchingElement) return result;
    
    app.extensions.common.replaceElementAndPreserveAttributes(matchingElement, element);
    return result;
  }
  
  return attachElementByScope;
};

},{}],7:[function(require,module,exports){
module.exports = exports = function (app) {
  return function composite() {
    var result = app.finishing.composite();
    
    Array.prototype.forEach.call(arguments, function (finishingFn) {
      result.add(finishingFn);
    });
    
    return result;
  };
};

},{}],8:[function(require,module,exports){
module.exports = exports = function (app) {
  function whenReady(fn) {
    return function (result) {
      function tryToFinish() {
        var appElement = app.getApplicationElement();
        if (appElement.dataset.uaState === "ready") {
          fn(result);
        } else {
          setTimeout(tryToFinish, 10);
        }
      }
      
      tryToFinish();
      
      return result;
    };
  }
  
  return whenReady;
};

},{}],9:[function(require,module,exports){
module.exports = exports = function (app) {
  var extension = {};
  
  extension.afterRendering = {};
  extension.afterRendering.setContentContext = require("./rendering/after/set-content-context")(app);
  
  extension.finishing = {};
  extension.finishing.applyLinkBehavior = require("./finishing/apply-link-behavior")(app);
  extension.finishing.applySubmitBehavior = require("./finishing/apply-submit-behavior")(app);
  extension.finishing.attachElementByScope = require("./finishing/attach-element-by-scope")(app);
  extension.finishing.applyOptionsKeyboardBehavior = require("./finishing/apply-options-keyboard-behavior")(app);
  extension.finishing.apply = require("./finishing/apply")(app);
  extension.finishing.whenReady = require("./finishing/when-ready")(app);
  extension.finishing.composite = require("./finishing/composite")(app);
  
  extension.setInputElementValue = require("./util/set-input-element-value")(app);
  extension.findNearestElement = require("./util/find-nearest-element")(app);
  extension.findNearestAncestor = require("./util/find-nearest-ancestor")(app);
  extension.replaceElementAndPreserveAttributes = require("./util/replace-element-and-preserve-attributes")(app);
  extension.scopeIncludesRealm = require("./util/scope-includes-realm")(app);
  extension.realmsAreEqual = require("./util/realms-are-equal")(app);
  extension.elementRealmIsInScope = require("./util/element-realm-is-in-scope")(app);
  extension.matchesSelector = require("./util/matches-selector")(app);
  extension.findElementsByRealm = require("./util/find-elements-by-realm")(app);
  extension.elementIsAttached = require("./util/element-is-attached")(app);
  extension.Iterable = require("./util/iterable");
  extension.select = require("./util/select")(app);
  extension.css = require("./util/css")(app);
  
  return extension;
};

},{"./finishing/apply":5,"./finishing/apply-link-behavior":2,"./finishing/apply-options-keyboard-behavior":3,"./finishing/apply-submit-behavior":4,"./finishing/attach-element-by-scope":6,"./finishing/composite":7,"./finishing/when-ready":8,"./rendering/after/set-content-context":10,"./util/css":11,"./util/element-is-attached":12,"./util/element-realm-is-in-scope":13,"./util/find-elements-by-realm":14,"./util/find-nearest-ancestor":15,"./util/find-nearest-element":16,"./util/iterable":17,"./util/matches-selector":18,"./util/realms-are-equal":19,"./util/replace-element-and-preserve-attributes":20,"./util/scope-includes-realm":21,"./util/select":22,"./util/set-input-element-value":23}],10:[function(require,module,exports){
module.exports = exports = function (app) {
  function setContentContext(result) {
    var contentLocation = result.content.location || result.content.src;
    if (contentLocation) result.element.dataset.contentLocation = contentLocation;
    result.element.dataset.contentType = result.content.type;
    return result;
  }
  
  return setContentContext;
};

},{}],11:[function(require,module,exports){
var cssParser = require("css-selector-tokenizer");

module.exports = exports = function (app) {
  var extension = {};
  var isPrefixedClassName = /^-|^_/;

  extension.namespace = "";

  extension.qualifiedClassName = function qualifiedClassName(className) {
    if (!extension.namespace) return className;
    if (!className) return className;
    if (className.indexOf(extension.namespace) !== -1) return className;
    
    if (isPrefixedClassName.test(className)) {
      return className[0] + extension.namespace + className.substr(1);
    }
    
    return extension.namespace + className;
  };

  extension.qualifiedSelector = function qualifiedSelector(selector) {
    if (!extension.namespace) return selector;
    if (!selector) return selector;
    
    function qualifyClassNames(sel) {
      if ("nodes" in sel) {
        return sel.nodes.forEach(qualifyClassNames);
      }
      
      if (sel.type !== "class") return;
      sel.name = extension.qualifiedClassName(sel.name);
    }
    
    var parsed = cssParser.parse(selector);
    qualifyClassNames(parsed);
    
    return cssParser.stringify(parsed);
  };
  
  return extension;
};

},{"css-selector-tokenizer":127}],12:[function(require,module,exports){
module.exports = exports = function (app) {
  function elementIsAttached(element) {
    while (element !== document && element.parentNode) {
      element = element.parentNode;
    }
    
    return element === document;
  }
  
  return elementIsAttached;
};

},{}],13:[function(require,module,exports){
module.exports = exports = function (app) {
  return function (element, scope) {
    return app.extensions.common.scopeIncludesRealm(scope, element.dataset.contentRealm);
  };
};

},{}],14:[function(require,module,exports){
module.exports = exports = function (app) {
  function findElementsByRealm(element, realm) {
    var selector = "[data-content-realm='" + realm + "']";
    return app.extensions.common.select(selector)(element);
  }
  
  return findElementsByRealm;
};

},{}],15:[function(require,module,exports){
module.exports = exports = function (app) {
  function findNearestAncestor(origin, selectorOrPredicate) {
    if (!origin) return null;
    if (!selectorOrPredicate) return null;
    
    var predicate = selectorOrPredicate;
    if (typeof selectorOrPredicate !== "function") {
      predicate = function (element) {
        return app.extensions.common.matchesSelector(element, selectorOrPredicate);
      };
    }
    
    var current = origin.parentElement;
    var applicationElement = app.getApplicationElement();
    
    while (current !== applicationElement) {
      if (predicate(current)) return current;
      current = current.parentElement;   
    }
    
    return null;
  }
  
  return findNearestAncestor;
};

},{}],16:[function(require,module,exports){
module.exports = exports = function (app) {
  function findNearestDescendant(element, predicate) {
    var descendants = element.getElementsByTagName("*");
    return Array.prototype.find.call(descendants, predicate);
  }
  
  function findNearestElement(origin, selectorOrPredicate) {
    if (!origin) return null;
    if (!selectorOrPredicate) return null;
    if (origin === app.getApplicationElement()) return null;
    
    var predicate = selectorOrPredicate;
    if (typeof selectorOrPredicate !== "function") {
      predicate = function (element) {
        return app.extensions.common.matchesSelector(element, selectorOrPredicate);
      };
    }
    
    if (predicate(origin)) return origin;
    
    var nearestDescendant = findNearestDescendant(origin, predicate);
    if (nearestDescendant) return nearestDescendant;
    
    return findNearestElement(origin.parentElement, predicate);
  }
  
  return findNearestElement;
};

},{}],17:[function(require,module,exports){
var util = require("util");

function createNodeListIterator(nodeList) {
  var index = 0;
  return {
    next: function () {
      var child = nodeList.item(index++);
      if (child) {
        return {
          done: false,
          value: child
        };
      } else {
        return {
          done: true
        };
      }
    }
  };
}

function createFilterIterator(sourceIterable, predicate, thisArg) {
  var index = 0;
  var iterator = sourceIterable["@@iterator"]();

  function nextFn() {
    var next = iterator.next();
    while (next.done === false) {
      if (predicate.call(thisArg, next.value, index++, sourceIterable)) {
        return {
          done: false,
          value: next.value
        };
      }

      next = iterator.next();
    }

    return {
      done: true
    };
  }

  return {
    next: nextFn
  };
}

function createMapIterator(sourceIterable, mapper, thisArg) {
  var index = 0;
  var iterator = sourceIterable["@@iterator"]();

  function nextFn() {
    var next = iterator.next();
    
    if (next.done === false) {
      return {
        done: false,
        value: mapper.call(thisArg, next.value, index++, sourceIterable)
      };
    }

    return {
      done: true
    };
  }

  return {
    next: nextFn
  };
}

function createEmptyIterator() {
  return {
    next: function () {
      return {done: true};
    }
  };
}

function createArrayIterator(array) {
  var index = 0;

  return {
    next: function () {
      var child = array[index++];
      if (child) {
        return {
          done: false,
          value: child
        };
      } else {
        return {
          done: true
        };
      }
    }
  };
}

function Iterable(source) {
  var iteratorFn;
  
  if (util.isArray(source)) {
    iteratorFn = function () {
      return createArrayIterator(source);
    };
  } else if (source && "item" in source && typeof(source.item === "function")) {
    iteratorFn = function () {
      return createNodeListIterator(source);
    };
  } else if (typeof source === "function") {
    iteratorFn = source;
  } else {
    iteratorFn = createEmptyIterator;
  }
  
  this["@@iterator"] = iteratorFn;
}

Iterable.prototype.filter = function (predicate) {

  var source = this;

  var thisArg = arguments[1];

  return new Iterable(function () {
    return createFilterIterator(source, predicate, thisArg);
  });
};

Iterable.prototype.forEach = function (callback) {
  var iterator = this["@@iterator"]();

  var index = 0;
  var next = iterator.next();

  var thisArg = arguments[1];

  while (next.done === false) {
    callback.call(thisArg, next.value, index++, this);
    next = iterator.next();
  }
};

Iterable.prototype.find = function (callback) {
  var source = this;

  var thisArg = arguments[1];
  var filter = createFilterIterator(source, callback, thisArg);
  return filter.next().value;
};

Iterable.prototype.first = function () {
  return this["@@iterator"]().next().value;
};

Iterable.prototype.last = function () {
  var a = this.array();
  if (a.length === 0) return;
  
  return a[a.length - 1];
};

Iterable.prototype.count = function () {
  var count = 0;
  this.forEach(function () {
    count++;
  });

  return count;
};

Iterable.prototype.some = function (predicate) {
  var source = this;
  if(!predicate) return !source["@@iterator"]().next().done;
  var thisArg = arguments[1];
  var filter = createFilterIterator(source, predicate, thisArg);

  return filter.next().done === false;
};

Iterable.prototype.every = function (predicate) {
  var iterator = this["@@iterator"]();

  var next = iterator.next();
  var index = 0;
  var thisArg = arguments[1];
  while (next.done === false) {
    if (!predicate.call(thisArg, next.value, index++, this)) {
      return false;
    }

    next = iterator.next();
  }

  return true;
};

Iterable.prototype.concat = function (iterable) {
  var firstIterator = this["@@iterator"];

  var concatIteratorFn = function () {
    var first = firstIterator();
    var second = iterable["@@iterator"]();

    return {
      next: function () {
        var next = first.next();
        if (!next.done) return next;
        return second.next();
      }
    };
  };

  return new Iterable(concatIteratorFn);
};

Iterable.prototype.map = function (mapper) {
  var source = this;
  var thisArg = arguments[1];

  return new Iterable(function () {
    return createMapIterator(source, mapper, thisArg);
  });
};

Iterable.prototype.array = function () {
  var result = [];

  this.forEach(function (item) {
    result.push(item);
  });

  return result;
};

module.exports = exports = Iterable;

},{"util":113}],18:[function(require,module,exports){
module.exports = exports = function (app) {
  function matchesSelector(element, selector) {
    selector = app.extensions.common.css.qualifiedSelector(selector);
    
    var matches = element.matches ||
      element.msMatchesSelector ||
      element.webkitMatchesSelector ||
      element.mozMatchesSelector ||
      element.oMatchesSelector;
      
    return matches.call(element, selector);
  }
  
  return matchesSelector;
};

},{}],19:[function(require,module,exports){
var urijs = require("urijs");

module.exports = exports = function (app) {
  return function realmsAreEqual(realmA, realmB) {
    if (!realmA || !realmB) return false;

    var normalizedRealmA = urijs(realmA).normalize().toString();
    var normalizedRealmB = urijs(realmB).normalize().toString();

    return normalizedRealmA === normalizedRealmB;
  };
};

},{"urijs":141}],20:[function(require,module,exports){
module.exports = exports = function (app) {
  var preservedAttributes = ["contentScope"];
  
  function isPreservedAttribute(name){
      return preservedAttributes.some(function (value) {
        return name === value;
      });
  }
  
  function copyAttributes(sourceElement, destinationElement) {
    for(var p in sourceElement.dataset){
      if(sourceElement.dataset.hasOwnProperty(p) && isPreservedAttribute(p)){
        destinationElement.dataset[p] = sourceElement.dataset[p];
      }
    }
  }
  
  function replaceElementAndPreserveAttributes(element, newElement) {
    copyAttributes(element, newElement);
    var parent = element.parentElement;
    parent.replaceChild(newElement, element);
  }
  
  replaceElementAndPreserveAttributes.addPreservedAttribute = function (name) {
    preservedAttributes.push(name);
  };
  
  return replaceElementAndPreserveAttributes;
};

},{}],21:[function(require,module,exports){
var urijs = require("urijs");

module.exports = exports = function (app) {
  return function scopeIncludesRealm(scope, realm) {
    if (!scope || !realm) return false;

    var normalizedRealm = urijs(realm).normalize().toString();
    var normalizedScope = urijs(scope).normalize().toString();

    return normalizedRealm.indexOf(normalizedScope) === 0;
  };
};

},{"urijs":141}],22:[function(require,module,exports){
var util = require("util");

module.exports = exports = function (app) {
  
  function createSelectorIterator(element, selector) {
    var resultsIterator;

    function next() {
      if (!resultsIterator) {
        resultsIterator = new app.extensions.common.Iterable(element.querySelectorAll(selector))["@@iterator"]();
        if (app.extensions.common.matchesSelector(element, selector)) {
          return {
            done: false,
            value: element
          };
        }
      }
      return resultsIterator.next();
    }

    return {
      next: next
    };
  }

  function select(selector) {
    if (util.isFunction(selector)) return selector;

    return function (element) {
      return new app.extensions.common.Iterable(function () {
        selector = app.extensions.common.css.qualifiedSelector(selector);
        return createSelectorIterator(element, selector);
      });
    };
  }

  select.concat = function concat() {
    var args = arguments;
    return function(element){
      var iterable = new app.extensions.common.Iterable();

      Array.prototype.forEach.call(args, function(arg){
        iterable = iterable.concat(select(arg)(element));
      });

      return iterable;
    };
  };
  
  select.children = function children(selector) {
    return function (element) {
      var elements = select(selector)(element);
      if (!elements.some()) return new app.extensions.common.Iterable();
      
      return elements.filter(function (match) {
        return match.parentElement === element;
      });
    };
  };

  select.siblings = function siblings(selector){
    return function(element){
      var elements = select(selector)(element.parentElement);
      if (!elements.some()) return new app.extensions.common.Iterable();

      return elements.filter(function (match) {
        return match !== element && match.parentElement === element.parentElement;
      });
    };
  };
  
  select.parent = function parent(selector) {
    return function (element) {
      var elements = select(selector)(element);
      
      var parents = [];
      elements.forEach(function (el) {
        if (parents.indexOf(el.parentElement) === -1) {
          parents.push(el.parentElement);
        }
      });
      
      return new app.extensions.common.Iterable(parents);
    };
  };

  select.wrap = function wrap(selector) {
    return function (element) {
      var elements = select.children(selector)(element);
      if (!elements.some()) return new app.extensions.common.Iterable();

      var wrapper = document.createElement("div");
      elements.forEach(function (matched, index) {
        if (index === 0) matched.parentElement.replaceChild(wrapper, matched);
        wrapper.appendChild(matched);
      });

      return new app.extensions.common.Iterable([wrapper]);
    };
  };

  select.wrapEachMatching = function wrapEachMatching(selector) {
    return function (element) {
      var elements = select(selector)(element);
      if (!elements.some()) return new app.extensions.common.Iterable();
      
      return elements.map(function (el) {
        var wrapper = document.createElement("div");
        el.parentElement.replaceChild(wrapper, el);
        wrapper.appendChild(el);
        
        return wrapper;
      });
    };
  };

  select.fromApp = function fromApp(selector) {
    return function () {
      return select(selector)(app.getApplicationElement());
    };
  };

  select.first = function first(selector) {
    return function (element) {
      var first = select(selector)(element).first();
      if (!first) return new app.extensions.common.Iterable();
      return new app.extensions.common.Iterable([first]);
    };
  };
  
  select.applicationElement = function selectApplicationElement(element) {
    return new app.extensions.common.Iterable([app.getApplicationElement()]);
  };
  
  return select;
};

},{"util":113}],23:[function(require,module,exports){
module.exports = exports = function (app) {
  function setInputElementValue(inputElement, newValue) {
    if (inputElement.value === newValue) return;
    
    inputElement.value = newValue;
    
    var inputEvent = document.createEvent("Event");
    inputEvent.initEvent("input", true, false);
    inputElement.dispatchEvent(inputEvent);
    
    var changeEvent = document.createEvent("Event");
    changeEvent.initEvent("change", true, false);
    inputElement.dispatchEvent(changeEvent);
  }
  
  return setInputElementValue;
};

},{}],24:[function(require,module,exports){
(function (Buffer){
var URI = require("urijs");
var Q = require("q");

function dataTransfer(url, options) {
  options = options || {};
  
  return Q().then(function () {
    var parsed = URI(url);
    var delim = parsed.path().indexOf(",");
    var type,encoding;
    
    if (delim === 0) {
      type = "text/plain;charset=US-ASCII";
      encoding = "ascii";
    }
    else {
      type = parsed.path().substr(0, delim);
      if (type.indexOf(";base64") !== -1) {
        encoding = "base64";
        type = type.replace(";base64", "");
      }
    }
    
    var data = new Buffer(parsed.path().substr(delim + 1), encoding || "utf8");
    
    return {
      location: url,
      options: options,
      data: data,
      type: type
    };
  });
}

module.exports = exports = function (/*app*/) {
  var extension = {
    transferring: dataTransfer  
  };
  
  return extension;
};

}).call(this,require("buffer").Buffer)
},{"buffer":80,"q":134,"urijs":141}],25:[function(require,module,exports){
function createDataUri(content) {
  return "data:" + content.type.fullName + ";base64," + content.data.toString("base64");
}

function renderGenericContent(content) {
  var rootElement = document.createElement("object");
  
  var src;
  if (content.src) src = content.src;
  else src = createDataUri(content);

  rootElement.data = src;

  var altText = content.alt || "Unable to display content from: " + content.src;
  var altElement = document.createElement("a");
  altElement.setAttribute("download", "content");
  altElement.href = content.src;
  altElement.textContent = altText;

  rootElement.appendChild(altElement);

  return rootElement;
}

module.exports = exports = function (/*app*/) {
  var extension = {
    rendering: renderGenericContent
  };
  
  return extension;
};

},{}],26:[function(require,module,exports){
function createDataUri(content) {
  return "data:" + content.type + ";base64," + content.data.toString("base64");
}

function renderHtml(content) {
  var rootElement = document.createElement("iframe");
  
  if (content.src) rootElement.src = content.src;
  else rootElement.src = createDataUri(content);

  return rootElement;
}

module.exports = exports = function (/*app*/) {
  var extension = {
    rendering: renderHtml
  };
  
  return extension;
};

},{}],27:[function(require,module,exports){
(function (Buffer){
var http = require("http");
var https = require("https");
var URI = require("urijs");
var urlParser = require("url");
var Q = require("q");

var useBodyForMethod = {
  GET: false,
  DELETE: false,
  PUT: true,
  POST: true
};

var defaultRetrievalMethod = "GET";

function httpTransfer(url, options) {
  options = options || {};
  
  var method = options.method || defaultRetrievalMethod;
  var body = options.body;
  var deferred = Q.defer();

  if (body && useBodyForMethod[method] === false) {
    var queryComponent = body.data.toString();
    url = URI(url).query(queryComponent).toString();
  }

  var requestOptions = urlParser.parse(url);
  requestOptions.method = method;
  requestOptions.headers = {};
  requestOptions.headers.accept = "*/*";
  
  if (httpTransfer.headers) {
    for (var globalHeader in httpTransfer.headers) {
      if (!httpTransfer.headers.hasOwnProperty(globalHeader)) continue;
      requestOptions.headers[globalHeader] = httpTransfer.headers[globalHeader];
    }
  }
  
  if (options.headers) {
    for (var requestHeader in options.headers) {
      if (!options.headers.hasOwnProperty(requestHeader)) continue;
      requestOptions.headers[requestHeader] = options.headers[requestHeader];
    }
  }
  
  if (body && useBodyForMethod[method]) requestOptions.headers["content-type"] = body.type;

  requestOptions.withCredentials = options.withCredentials || httpTransfer.withCredentials || false;
  requestOptions.responseType = "arraybuffer";

  var protocolPackage = http;
  if (requestOptions.protocol === "https:") protocolPackage = https;
  
  function responseHandler(response) {
    var data = [];

    response.on("data", function (chunk) {
      data.push(new Buffer(chunk));
    });

    response.on("error", function (err) {
      deferred.reject(err);
    });

    response.on("end", function () {
      var result = {
        location: url,
        data: null,
        type: response.headers["content-type"]
      };
      
      if (data.length > 0) {
        result.data = Buffer.concat(data);
      }

      deferred.resolve(result);
    });
  }

  var request = protocolPackage.request(requestOptions, responseHandler);
  
  request.on("error", function (err) {
    deferred.reject(err);
  });

  if (body && useBodyForMethod[method]) request.write(body.data);

  request.end();

  return deferred.promise;
}

module.exports = exports = function (/*app*/) {
  var extension = {
    transferring: httpTransfer  
  };
  
  return extension;
};

}).call(this,require("buffer").Buffer)
},{"buffer":80,"http":85,"https":89,"q":134,"urijs":141,"url":111}],28:[function(require,module,exports){
function createDataUri(content) {
  return "data:" + content.type + ";base64," + content.data.toString("base64");
}

function renderImageContent(content) {
  var img = document.createElement("img");
  
  if (content.src) img.src = content.src;
  else img.src = createDataUri(content);

  return img;
}

module.exports = exports = function (/*app*/) {
  var extension = {
    rendering: renderImageContent
  };
  
  return extension;
};

},{}],29:[function(require,module,exports){
(function (Buffer){
var util = require("util");
var Q = require("q");
var contentType = require("content-type");

module.exports = exports = function (app) {
  var Iterable = app.extensions.common.Iterable;
  var iterators = require("./iterators")(app);
  
  function parseSpecContent(content) {
    var spec = JSON.parse(content.data.toString());
    spec.url = content.location;
    return spec;
  }

  function resolveSpec(document) {
    return function (spec) {
      if (typeof spec === "string") {
        var url = document.resolveURI(spec);
        return app.transferring(url).then(parseSpecContent);
      }

      return spec;
    };
  }

  function resolveSpecFromValue(node) {
    var value = node.value;

    if (!value || !value.spec) return node;

    var specFromValue = value.spec;
    
    if ("value" in value) {
      // (value,spec) tuple
      node.value = value.value;
    }
    else {
      delete value.spec;
    }
    
    function finish(spec) {
      if (node.spec) spec.name = node.spec.name;
      node.spec = spec;
      return node;
    }
    
    return Q(specFromValue)
      .then(resolveSpec(node.document))
      .then(finish);
  }

  function buildVisibility(node) {
    node.spec.visibility = node.spec.visibility || "visible";
    return node;
  }
  
  function expandHints(spec) {
    spec.hints = spec.hints.map(function (hint) {
      if (util.isObject(hint)) return hint;
      return { name: hint };
    });
  }

  function buildHints(node) {
    var spec = node.spec;
    expandHints(spec);
    return node;
  }

  function isValidInputValue(inputValue) {
    if (inputValue === true ||
      (!util.isArray(inputValue) && util.isObject(inputValue)) ||
      typeof inputValue === "string") {
      return true;
    }

    return false;
  }

  function buildInput(node) {
    var input = node.spec.input;

    if (!input || !isValidInputValue(input)) {
      node.spec.input = null;
      return node;
    }

    if (input === true) input = node.spec.input = {};
    else if (typeof input === "string") input = node.spec.input = { name: input };

    if (!input.name) {
      input.name = node.spec.name;
    }

    return node;
  }
  
  function buildSubmit(node) {
    if (!node.hasHint("submit")) return node;
    node.value.enctype = node.value.enctype || "application/x-www-form-urlencoded";
    // this should be changed to resolve the default method for the action's protocol
    node.value.method = node.value.method || "GET";
    return node;
  }

  function buildContent(node) {
    var leastSpecificHint = node.spec.hints[node.spec.hints.length - 1];
    if (leastSpecificHint.name !== "content") return node;
    if (!node.value) return node;
    
    var value = node.value;
    
    if (value.src) {
      value.src = node.document.resolveURI(value.src);
    }

    if (!value.src && value.data) {
      var encoding = value.encoding || "utf8";
      value.data = new Buffer(value.data, encoding);
    }
    
    return node;
  }

  function buildChildren(node) {
    node.children = [];
    
    if (node.hasHint("text")) return node;
    if (!node.value) return node;
    
    var childPromises = [];
    
    function buildNodeForResolvedChildSpec(parentNode) {
      return function (childSpec) {
        var childValue = parentNode.value[childSpec.name];
        return buildNode(childValue, childSpec, parentNode.document);
      };
    }
    
    var usedValueDrivenStrategy = false;
    
    if (util.isArray(node.spec.children)) {
      // node.spec.children is an array (map) [spec driven approach]
      node.spec.children.forEach(function (childSpec) {
        var childPromise = Q(childSpec)
                            .then(resolveSpec(node.document))
                            .then(buildNodeForResolvedChildSpec(node));
                            
        childPromises.push(childPromise);
      });
    }
    else {
      usedValueDrivenStrategy = true;
      
      // node.spec.children is an object (template) [value driven approach]
      if (node.spec.input && node.spec.children.input === true) {
        // if the container is an input and the children spec template is a bool
        // then apply the parent's input specification to the children spec template
        node.spec.children.input = node.spec.input;
      }
      
      if (node.spec.children) expandHints(node.spec.children);
      
      for (var p in node.value) {
        if (!node.value.hasOwnProperty(p)) continue;
        var childSpec = node.spec.children ? JSON.parse(JSON.stringify(node.spec.children)) : null;
        var childValue = node.value[p];
        // preserve the name of the value/spec tuple
        if (childSpec) childSpec.name = p;
        
        if (!childSpec && !isSelfSpecified(childValue)) continue;
        
        childPromises.push(buildNode(childValue, childSpec, node.document));
      }
    }
    
    var parentValueIsArray = util.isArray(node.value);
    
    function attachChildrenAndReturnNode(childNodes) {
      childNodes.forEach(function (childNode, index) {
        if (!childNode) return;
        node.children.push(childNode);
        childNode.parent = node;
        
        if (usedValueDrivenStrategy && parentValueIsArray) {
          // rename the child nodes to their index/ordinal
          childNode.name = childNode.spec.name = index.toString();
        }
      });
      
      return node;
    }
    
    return Q.all(childPromises).then(attachChildrenAndReturnNode);
  }

  function buildName(node) {
    node.name = node.spec.name;
    return node;
  }

  function buildIterators(node) {
    Iterable.call(node, function () {
      return iterators.node(node);
    });
    
    for (var p in Iterable.prototype) {
      node[p] = Iterable.prototype[p];
    }

    node.descendants = new Iterable(function () {
      return iterators.descendants(node);
    });

    node.ancestors = new Iterable(function () {
      return iterators.ancestors(node);
    });
    
    return node;
  }

  function hasHint(hintName) {
    return this.spec.hints.some(function (hint) {
      return hint.name === hintName;
    });
  }

  function isSelfSpecified(value) {
    return util.isObject(value) && ("spec" in value);
  }

  function buildNode(value, spec, document) {
    if (!spec && !isSelfSpecified(value)) throw new Error("No specification was provided for the value.");
    
    var node = {};
    
    node.document = document;
    node.value = value;
    node.hasHint = hasHint;
    
    function attachSpec(resolvedSpec) {
      if (!resolvedSpec) return node;
      node.spec = resolvedSpec;
      return node;
    }
    
    return Q(spec)
      .then(resolveSpec(document))
      .then(attachSpec)
      .then(resolveSpecFromValue)
      .then(buildVisibility)
      .then(buildHints)
      .then(buildInput)
      .then(buildContent)
      .then(buildSubmit)
      .then(buildChildren)
      .then(buildName)
      .then(buildIterators);
  }

  function buildDocument(value, spec, content) {
    var document = {};
    
    document.location = content && content.location;
    
    var parsedContentType = contentType.parse(content.type);
    document.base = value.base || parsedContentType.parameters.base || document.location || "document://";
    document.realm = value.realm || parsedContentType.parameters.realm || null;
    
    document.resolveURI = function resolveURI(uri) {
      return app.resolveURI(document.base, uri);
    };
    
    function attachRootAndReturnDocument(node) {
      document.root = node;
      return document;
    }
    
    return buildNode(value, spec, document).then(attachRootAndReturnDocument);
  }

  // the parsing function returned from this module
  function parse(content) {
    var value = JSON.parse(content.data.toString());
    var parsedType = contentType.parse(content.type);
    var specValue = parsedType.parameters.spec || null;
    var spec = specValue && specValue.indexOf("{") === 0 ? 
      JSON.parse(specValue) : 
      specValue;
    
    return buildDocument(value, spec, content);
  }
  
  parse.buildNode = buildNode;
  
  return parse;
};

}).call(this,require("buffer").Buffer)
},{"./iterators":30,"buffer":80,"content-type":126,"q":134,"util":113}],30:[function(require,module,exports){
module.exports = exports = function (app) {
  var iterators = {};
  
  iterators.children = function children(node) {
    return new app.extensions.common.Iterable(node.children)["@@iterator"]();
  };
  
  iterators.ancestors = function ancestors(node) {
  
    var current = node;
  
    function next() {
  
      var result = current.parent;
      if (result) {
        current = result;
        return {
          done: false,
          value: result
        };
      }
  
      return {
        done: true
      };
    }
  
    return {
      next: next
    };
  };
  
  iterators.node = function nodeIterator(node) {
    var descendants;
  
    function next() {
      if (!descendants) {
        descendants = iterators.descendants(node);
        return {
          done: false,
          value: node
        };
      }
  
      return descendants.next();
    }
  
    return {
      next: next
    };
  };
  
  iterators.descendants = function descendants(node) {
    var iters = [];
    var current = iterators.children(node);
  
    function next() {
      var result = current.next();
  
      // not done?
      if (!result.done) {
  
        if (result.value.children.length > 0) {
          iters.push(current);
          current = iterators.children(result.value);
        }
  
        return {
          done: false,
          value: result.value
        };
      }
  
      // all done?
      if (result.done && iters.length === 0) {
        return result;
      }
  
      // done w/ this one!
      current = iters.pop();
      return next();
    }
  
    return {
      next: next
    };
  };
  
  return iterators;
};

},{}],31:[function(require,module,exports){
var util = require("util");

module.exports = exports = function (app) {
  function accumulateValidationStatesForConstraints(validationElement, validationStates) {
    var validationConstraintSet = validationElement.lynx.validation;
    
    function pushValidationConstraintState(validationConstraint) {
      validationStates.push(validationConstraint.state);
    }
    
    var reserved = ["invalid", "valid", "unknown"];
    
    for (var constraintName in validationConstraintSet) {
      if (reserved.indexOf(constraintName) > -1) continue;
      var constraintsOrConstraint = validationConstraintSet[constraintName];
      
      if (util.isArray(constraintsOrConstraint)) {
        constraintsOrConstraint.forEach(pushValidationConstraintState);
      }
      else {
        pushValidationConstraintState(constraintsOrConstraint);
      }
    }
  }
  
  return accumulateValidationStatesForConstraints;
};

},{"util":113}],32:[function(require,module,exports){
module.exports = exports = function (app) {
  var accumulateValidationStatesForConstraints = require("./accumulate-validation-states-for-constraint-set")(app);
  
  function accumulateValidationStatesForDescendants(validationElement, validationStates) {
    if (!validationElement) return;
    
    var selector = "[data-lynx-validation-state]";
    var validationElements = app.extensions.common.select(selector)(validationElement);
    
    function accumulateValidationState(descendant) {
      accumulateValidationStatesForConstraints(descendant, validationStates);
    }
    
    validationElements.forEach(accumulateValidationState);
  }
  
  return accumulateValidationStatesForDescendants;
};

},{"./accumulate-validation-states-for-constraint-set":31}],33:[function(require,module,exports){
module.exports = exports = function (app) {
  function applyContainerInputBehavior(result) {
    var containerInput = result.element;

    var removeSel = "[data-lynx-container-input-remove]";
    var addSel = "[data-lynx-container-input-add]";
    
    function applyRemoveBehavior(removeElement) {
      removeElement.addEventListener("click", function () {
        containerInput.lynx.removeElement(removeElement);
      });
    }
    
    var removeElements = app.extensions.common.select(removeSel)(containerInput);
    removeElements.forEach(applyRemoveBehavior);
    
    var addElements = app.extensions.common.select(addSel)(containerInput);
    var addElement = addElements.first();
    if (!addElement) return;
    
    function isRemoveElement(elem) {
      return app.extensions.common.matchesSelector(elem, removeSel);
    }
    
    addElement.addEventListener("click", function () {
      containerInput.lynx.addElement().then(function (addedElement) {
        var removeElement = app.extensions.common.findNearestElement(addedElement, isRemoveElement);
        applyRemoveBehavior(removeElement);
      });
    });
    
    return result;
  }
  
  return applyContainerInputBehavior;
};

},{}],34:[function(require,module,exports){
var util = require("util");


function getTextConstraintWithFormat(element) {
  if (!element.lynx || !element.lynx.validation || !element.lynx.validation.text) return null;

  function hasPatternAndFormat(textConstraint) {
    return ("pattern" in element.lynx.validation.text) && ("format" in element.lynx.validation.text);
  }

  if (!util.isArray(element.lynx.validation.text)) {
    if (hasPatternAndFormat(element.lynx.validation.text)) return element.lynx.validation.text;
    return null;
  }

  return element.lynx.validation.text.find(hasPatternAndFormat);
}

function applyFormattedBehavior(result) {
  var element = result.element;
  var textConstraint = getTextConstraintWithFormat(element);
  if (!textConstraint || !textConstraint.pattern || !textConstraint.format) return result;

  var regex = new RegExp(textConstraint.pattern);

  element.addEventListener("blur", function () {
    if (!regex.test(element.value)) return;
    element.value = element.value.replace(regex, textConstraint.format);
  });
  
  return result;
}

module.exports = exports = function (app) {
  return applyFormattedBehavior;
};

},{"util":113}],35:[function(require,module,exports){
module.exports = exports = function (app) {
  function applyOptionsBehavior(callbacks) {
    function inputElementContainsValue(inputElement, value) {
      var inputElements = app.extensions.common.select("input,textarea")(inputElement);
      return inputElements.some(function (elem) {
        return value === elem.value;
      });
    }

    function findMatchingInputElements(inputElement, value) {
      var inputElements = app.extensions.common.select("input,textarea")(inputElement);
      return inputElements.filter(function (elem) {
        return value === elem.value;
      });
    }

    function isAddElement(elem) {
      return app.extensions.common.matchesSelector(elem, "[data-lynx-container-input-add]");
    }

    function isRemoveElement(elem) {
      return app.extensions.common.matchesSelector(elem, "[data-lynx-container-input-remove]");
    }

    function removeInputElement(inputElement) {
      var removeElement = app.extensions.common.findNearestElement(inputElement, isRemoveElement);
      if (removeElement) removeElement.click();
    }

    function findOptionElementFor(valueElement, mostSpecificHint) {
      valueElement.dataset.lynxOptionValue = "true";
      var optionElement = valueElement;
      var parentLynxElement = app.extensions.common.findNearestAncestor(optionElement, "[data-lynx-hints]");

      var optionMatches = app.extensions.lynx.findElementsWithHint(parentLynxElement, mostSpecificHint);
      if (optionMatches.count() === 1) {
        optionElement = parentLynxElement;
      }

      optionElement.dataset.lynxOption = true;

      return optionElement;
    }

    function setSingleSelectOptionContextAndBehavior(optionsSourceElement, inputElement, mostSpecificHint) {
      var setSelectedFunctions = [];
      
      function onInput() {
        setSelectedFunctions.forEach( function (setSelected) {
          setSelected();
        });
      }
      
      inputElement.addEventListener("input", onInput);
      
      optionsSourceElement.lynx.addCleanup(function () {
        inputElement.removeEventListener("input", onInput);
      });

      return function (valueElement) {
        var optionElement = findOptionElementFor(valueElement, mostSpecificHint);

        var setSelected = function () {
          var isSelected = valueElement.textContent === inputElement.value;
          optionElement.dataset.lynxOptionSelected = isSelected;
          
          var state = isSelected ? "selected" : "";
          callbacks.optionSelectedChanged({ element: optionElement, state: state });
        };

        setSelected();
        setSelectedFunctions.push(setSelected);

        function onOptionClick () {
          if (optionElement.dataset.lynxOptionSelected === "true") {
            app.extensions.common.setInputElementValue(inputElement, null);
          }
          else {
            app.extensions.common.setInputElementValue(inputElement, valueElement.textContent);
          }

          setSelectedFunctions.forEach( function (setSelected) {
            setSelected();
          });
        }

        optionElement.addEventListener("click", onOptionClick);
        
        optionsSourceElement.lynx.addCleanup(function () {
          optionElement.removeEventListener("click", onOptionClick);
        });
        
        callbacks.optionRoleChanged({ element: optionElement, state: "option" });
      };
    }

    function setMultiSelectOptionContextAndBehavior(optionsSourceElement, inputElement, mostSpecificHint) {
      return function (valueElement) {
        var optionElement = findOptionElementFor(valueElement, mostSpecificHint);

        if (inputElementContainsValue(inputElement, valueElement.textContent)) {
          optionElement.dataset.lynxOptionSelected = true;
        }

        function onOptionClick(evt) {
          if (optionElement.dataset.lynxOptionSelected === "true") {
            optionElement.dataset.lynxOptionSelected = false;
            var inputElements = findMatchingInputElements(inputElement, valueElement.textContent);
            inputElements.forEach(removeInputElement);
            callbacks.optionSelectedChanged({ element: optionElement, state: "" });
          }
          else {
            optionElement.dataset.lynxOptionSelected = true;

            var addElement = app.extensions.common.findNearestElement(inputElement, isAddElement);
            addElement.click();

            window.setTimeout(function () {
              var newElement = inputElement.lastElementChild;
              var newInputElement = app.extensions.common.select("input,textarea")(newElement).first();
              newInputElement.value = valueElement.textContent;
              callbacks.optionSelectedChanged({ element: optionElement, state: "selected" });
            }, 10);
          }
        }

        optionElement.addEventListener("click", onOptionClick);
        
        optionsSourceElement.lynx.addCleanup(function () {
          optionElement.removeEventListener("click", onOptionClick);
        });
        
        callbacks.optionRoleChanged({ element: optionElement, state: "option" });
      };
    }
    
    function removeOptionsAttributes(optionsSourceElement) {
      delete optionsSourceElement.dataset.lynxOptionsFor;
      delete optionsSourceElement.dataset.lynxOptionsMultiSelect;
      
      app.extensions.common.select("[data-lynx-option-value]")(optionsSourceElement)
        .forEach(function (valueElement) {
          delete valueElement.dataset.lynxOptionValue;
        });
        
      app.extensions.common.select("[data-lynx-option]")(optionsSourceElement)
        .forEach(function (optionElement) {
          delete optionElement.dataset.lynxOption;
          delete optionElement.dataset.lynxOptionSelected;
          callbacks.optionRoleChanged({ element: optionElement, state: "" });
        });
        
      callbacks.optionsRoleChanged({ element: optionsSourceElement, state: "" });
    }
    
    function removeAllOptionsAttributesAndEventListeners(optionsSourceElement) {
      if (optionsSourceElement.lynx && optionsSourceElement.lynx.cleanup) {
        optionsSourceElement.lynx.cleanup();
      }
    }
    
    function initializeOptionsSourceElement(optionsSourceElement) {  
      var cleanups = [];
      
      optionsSourceElement.lynx = optionsSourceElement.lynx || {};
      
      optionsSourceElement.lynx.addCleanup = function (cleanup) {
        cleanups.push(cleanup);
      };
      
      optionsSourceElement.lynx.cleanup = function () {
        cleanups.forEach(function (cleanup) {
          cleanup();
        });
        
        removeOptionsAttributes(optionsSourceElement);
      };
    }

    function applyOptionsBehaviorToInputElement(inputElement) {
      var optionsSourceSelector = "[data-lynx-name='" + inputElement.dataset.lynxOptions + "']";
      var optionsSourceElement = app.extensions.common.findNearestElement(inputElement, optionsSourceSelector);
      if (!optionsSourceElement) return;
      
      initializeOptionsSourceElement(optionsSourceElement);

      var mostSpecificHint = inputElement.dataset.lynxOptionsValueHint;
      var valueElements = app.extensions.lynx.findElementsWithHint(optionsSourceElement, mostSpecificHint).filter( function (valueElement) {
        return valueElement !== inputElement;
      });
      
      if (valueElements.count() === 0) return;

      optionsSourceElement.dataset.lynxOptionsFor = inputElement.dataset.lynxName;
      callbacks.optionsRoleChanged({ element: optionsSourceElement, state: "options" });

      var setOptionContextAndBehavior;

      if (app.extensions.common.matchesSelector(inputElement, "[data-lynx-hints~='container']")) {
        optionsSourceElement.dataset.lynxOptionsMultiSelect = true;
        setOptionContextAndBehavior = setMultiSelectOptionContextAndBehavior(optionsSourceElement, inputElement, mostSpecificHint);
      }
      else {
        setOptionContextAndBehavior = setSingleSelectOptionContextAndBehavior(optionsSourceElement, inputElement, mostSpecificHint);
      }

      valueElements.forEach(setOptionContextAndBehavior);
    }
    
    return function (result) {
      var scopeElement = result.element;
      
      var optionsSelector = "[data-lynx-options-for]";
      var optionsSourceElements = app.extensions.common.select(optionsSelector)(scopeElement);
      optionsSourceElements.forEach(removeAllOptionsAttributesAndEventListeners);
      
      var inputSelector = "[data-lynx-options]";
      var inputElements = app.extensions.common.select(inputSelector)(scopeElement);
      inputElements.forEach(applyOptionsBehaviorToInputElement);

      return result;
    };
  }

  return applyOptionsBehavior;
};

},{}],36:[function(require,module,exports){
module.exports = exports = function (app) {
  var calculateDerivedValidationState = require("./calculate-derived-validation-state")(app);
  
  function setVisibility(originElement, elementName, visibility, validationState, visibilityChanged) {
    if (!elementName) return;
    
    function finder(element) {
      return element.dataset.lynxName === elementName;
    }
    
    var element = app.extensions.common.findNearestElement(originElement, finder);
    if (!element) return;
    
    if (element.dataset.lynxVisibility !== visibility) {
      element.dataset.lynxVisibility = visibility;
      visibilityChanged(element);  
    }
    
    element.dataset.lynxValidationContentForState = validationState;
  }
  
  function showHideValidationConstraintContent(validationElement, validationObject, validationState, visibilityChanged) {
    validationState = validationState || "unknown";
    var elementNameToShow = validationObject[validationState];
    setVisibility(validationElement, elementNameToShow, "visible", validationState, visibilityChanged);
    
    ["unknown", "invalid", "valid"].filter(function (state) {
      return state !== validationState;
    }).forEach(function (stateToHide) {
      var elementNameToHide = validationObject[stateToHide];
      setVisibility(validationElement, elementNameToHide, "hidden", stateToHide, visibilityChanged);
    });
  }
  
  function evaluateValidationConstraints(validationElement, visibilityChanged) {
    function updateConstraintState(constraint, validator) {
      if (validator) {
        constraint.state = validator(validationElement, constraint);
      }
      else {
        constraint.state = "unknown";
      }
      
      showHideValidationConstraintContent(validationElement, constraint, constraint.state, visibilityChanged);
    }
    
    // update the state of the validation constraints in validationElement
    app.extensions.lynx.forEachValidationConstraint(validationElement, function (constraint, constraintName) {
      var validator = app.extensions.lynx.validators[constraintName];
      updateConstraintState(constraint, validator);
    });
  }
  
  function showHideValidationConstraintContentForAll(visibilityChanged) {
    return function (result) {
      var applicationElement = app.getApplicationElement();
      var selector = "[data-lynx-validation-state]";
      
      app.extensions.common.select(selector)(applicationElement)
        .forEach(function (validationElement) {
          showHideValidationConstraintContent(validationElement, validationElement.lynx.validation, validationElement.dataset.lynxValidationState, visibilityChanged);
          
          app.extensions.lynx.forEachValidationConstraint(validationElement, function (constraint) {
            showHideValidationConstraintContent(validationElement, constraint, constraint.state, visibilityChanged);
          });
        });
        
      return result;
    };
  }
  
  function applyValidationBehavior(visibilityChanged, validityChanged) {
    return function (result) {
      function applyValidationBehaviorElement(validationElement) {
        
        function setValidationState(newValidationState) {
          if (validationElement.dataset.lynxValidationState === newValidationState) return;
          validationElement.dataset.lynxValidationState = newValidationState;
          validityChanged(validationElement);
        }
        
        function recalculateValidationState() {
          evaluateValidationConstraints(validationElement, visibilityChanged);
          setValidationState(calculateDerivedValidationState(validationElement));
          showHideValidationConstraintContent(validationElement, validationElement.lynx.validation, validationElement.dataset.lynxValidationState, visibilityChanged);
        }
        
        validationElement.addEventListener("input", recalculateValidationState);
        setValidationState(calculateDerivedValidationState(validationElement));
      }
      
      var selector = "[data-lynx-validation-state]";
      var validationElements = app.extensions.common.select(selector)(result.element);
      validationElements.forEach(applyValidationBehaviorElement);
      
      return result;
    };
  }
  
  return {
    applyValidationBehavior: applyValidationBehavior,
    showHideValidationConstraintContentForAll: showHideValidationConstraintContentForAll
  };
};

},{"./calculate-derived-validation-state":37}],37:[function(require,module,exports){
module.exports = exports = function (app) {
  var accumulateValidationStatesForConstraints = require("./accumulate-validation-states-for-constraint-set")(app);
  var accumulateValidationStatesForDescendants = require("./accumulate-validation-states-for-descendants")(app);
  
  function calculateDerivedValidationState(validationElement, cb) {
    var validationStates = [];
    accumulateValidationStatesForConstraints(validationElement, validationStates);
    accumulateValidationStatesForDescendants(validationElement, validationStates);
    
    function are(expected) {
      return function (actual) {
        return actual === expected;
      };
    }
    
    if (validationStates.some(are("invalid"))) return "invalid";
    if (validationStates.some(are("unknown"))) return "unknown";
    if (validationStates.some(are("valid"))) return "valid";
    return "unknown";
  }
  
  return calculateDerivedValidationState;
};

},{"./accumulate-validation-states-for-constraint-set":31,"./accumulate-validation-states-for-descendants":32}],38:[function(require,module,exports){
module.exports = exports = function (app) {
  var extension = {};

  extension.parsing = require("jsua-lynx-parsing")(app);
  extension.rendering = require("./rendering/render")(app);

  extension.finishing = {};
  extension.finishing.applyOptionsBehavior = require("./finishing/apply-options-behavior")(app);
  var validationBehavior = require("./finishing/apply-validation-behavior")(app);
  extension.finishing.applyValidationBehavior = validationBehavior.applyValidationBehavior;
  extension.finishing.showHideValidationConstraintContentForAll = validationBehavior.showHideValidationConstraintContentForAll;
  extension.finishing.applyContainerInputBehavior = require("./finishing/apply-container-input-behavior")(app);
  extension.finishing.applyFormattedBehavior = require("./finishing/apply-formatted-behavior")(app);

  extension.nodeRendering = {};
  extension.nodeRendering.container = require("./rendering/functions/container")(app);
  extension.nodeRendering.containerInput = require("./rendering/functions/container-input")(app);
  extension.nodeRendering.content = require("./rendering/functions/content")(app);
  extension.nodeRendering.image = require("./rendering/functions/image")(app);
  extension.nodeRendering.form = require("./rendering/functions/form")(app);
  extension.nodeRendering.submit = require("./rendering/functions/submit")(app);
  extension.nodeRendering.link = require("./rendering/functions/link")(app);
  extension.nodeRendering.text = require("./rendering/functions/text")(app);
  extension.nodeRendering.textInput = require("./rendering/functions/text-input")(app);

  extension.afterNodeRendering = {};
  extension.afterNodeRendering.setName = require("./rendering/after/set-name")(app);
  extension.afterNodeRendering.setHints = require("./rendering/after/set-hints")(app);
  extension.afterNodeRendering.setVisibility = require("./rendering/after/set-visibility")(app);
  extension.afterNodeRendering.setScope = require("./rendering/after/set-scope")(app);
  extension.afterNodeRendering.setOptions = require("./rendering/after/set-options")(app);
  extension.afterNodeRendering.link = require("./rendering/after/link")(app);
  extension.afterNodeRendering.submit = require("./rendering/after/submit")(app);
  extension.afterNodeRendering.setValidation = require("./rendering/after/set-validation")(app);
  extension.afterNodeRendering.setLabeledBy = require("./rendering/after/set-labeled-by")(app);
  extension.afterNodeRendering.setFormatted = require("./rendering/after/set-formatted")(app);

  extension.validators = {};
  extension.validators.required = require("./util/validators/required-validator")(app);
  extension.validators.text = require("./util/validators/text-validator")(app);
  extension.validators.number = require("./util/validators/number-validator")(app);

  extension.getHintsForElement = require("./util/get-hints-for-element")(app);
  extension.setHintsForElement = require("./util/set-hints-for-element")(app);
  extension.findElementsWithHint = require("./util/find-elements-with-hint")(app);
  extension.findLabelElement = require("./util/find-label-element")(app);
  extension.findOptionsElement = require("./util/find-options-element")(app);
  extension.forEachValidationConstraint = require("./util/for-each-validation-constraint")(app);

  return extension;
};

},{"./finishing/apply-container-input-behavior":33,"./finishing/apply-formatted-behavior":34,"./finishing/apply-options-behavior":35,"./finishing/apply-validation-behavior":36,"./rendering/after/link":39,"./rendering/after/set-formatted":40,"./rendering/after/set-hints":41,"./rendering/after/set-labeled-by":42,"./rendering/after/set-name":43,"./rendering/after/set-options":44,"./rendering/after/set-scope":45,"./rendering/after/set-validation":46,"./rendering/after/set-visibility":47,"./rendering/after/submit":48,"./rendering/functions/container":50,"./rendering/functions/container-input":49,"./rendering/functions/content":51,"./rendering/functions/form":52,"./rendering/functions/image":53,"./rendering/functions/link":54,"./rendering/functions/submit":55,"./rendering/functions/text":57,"./rendering/functions/text-input":56,"./rendering/render":58,"./util/find-elements-with-hint":59,"./util/find-label-element":60,"./util/find-options-element":61,"./util/for-each-validation-constraint":62,"./util/get-hints-for-element":63,"./util/set-hints-for-element":64,"./util/validators/number-validator":65,"./util/validators/required-validator":66,"./util/validators/text-validator":67,"jsua-lynx-parsing":29}],39:[function(require,module,exports){
module.exports = exports = function (app) {
  function afterLink(result) {
    if (!result.node.hasHint("link")) return result;
    
    var node = result.node;
    var element = result.element;
    
    if (element.tagName !== "A") {
      app.extensions.common.addAriaRole(element, "link");
      element.setAttribute("tabindex", "0");
      element.dataset.href = node.document.resolveURI(node.value.href);
      element.dataset.type = node.value.type || "";
    }
    
    if ("follow" in node.spec) {
      element.dataset.follow = node.spec.follow;
    }
    
    return result;
  }
  
  return afterLink;
};

},{}],40:[function(require,module,exports){
var util = require("util");

module.exports = exports = function (app) {
  function hasFormat(textConstraint) {
    if (util.isArray(textConstraint)) return textConstraint.some(hasFormat);
    return "format" in textConstraint;
  }
  
  function setFormatted(result) {
    if (!result.node.spec.validation || !result.node.spec.validation.text) return result;
    if (!hasFormat(result.node.spec.validation.text)) return result;

    result.element.dataset.lynxValidationFormatted = true;
    return result;
  }

  return setFormatted;
};

},{"util":113}],41:[function(require,module,exports){
module.exports = exports = function (app) {
  function setHints(result) {
    function getHintName(hint) {
      return hint.name;
    }
    
    var hintNames = result.node.spec.hints.map(getHintName);
    
    // TODO: Review this. How do we ensure specificity when merging?
    if (result.element.dataset.lynxHints) {
      var currentHints = app.extensions.lynx.getHintsForElement(result.element);
      hintNames = currentHints.concat(hintNames);
    }
    
    app.extensions.lynx.setHintsForElement(result.element, hintNames);
    
    return result;
  }
  
  return setHints;
};

},{}],42:[function(require,module,exports){
module.exports = exports = function (app) {
  function setLabeledBy(result) {
    if (!result.node.spec.labeledBy) return result;
    
    result.element.dataset.lynxLabeledBy = result.node.spec.labeledBy;
    
    return result;
  }
  
  return setLabeledBy;
};

},{}],43:[function(require,module,exports){
module.exports = exports = function (app) {
  function setName(result) {
    if (!result.node.name) return result;
    result.element.dataset.lynxName = result.node.name;
    return result;
  }
  
  return setName;
};

},{}],44:[function(require,module,exports){
module.exports = exports = function (app) {
  function setOptions(result) {
    if (!result.node.spec.options) return result;
    result.element.dataset.lynxOptions = result.node.spec.options;
    return result;
  }
  
  return setOptions;
};

},{}],45:[function(require,module,exports){
var util = require("util");

module.exports = exports = function (app) {
  function setScope(result) {
    if (!util.isObject(result.node.value)) return result;
    if (!result.node.value.scope) return result;
    
    result.element.dataset.contentScope = result.node.value.scope;
    return result;
  }
  
  return setScope;
};

},{"util":113}],46:[function(require,module,exports){
module.exports = exports = function (app) {
  function setValidation(result) {
    var node = result.node;
    var element = result.element;
    
    if (!node.spec.validation) return result;
    
    element.lynx = element.lynx || {};
    element.lynx.validation = node.spec.validation;
    element.dataset.lynxValidationState = "unknown";
    
    return result;
  }
  
  return setValidation;
};

},{}],47:[function(require,module,exports){
module.exports = exports = function (app) {
  function setVisibility(result) {
    result.element.dataset.lynxVisibility = result.node.spec.visibility;
    return result;
  }
  
  return setVisibility;
};

},{}],48:[function(require,module,exports){
module.exports = exports = function (app) {
  function afterSubmit(result) {
    if (!result.node.hasHint("submit")) return result;
    
    var node = result.node;
    var element = result.element;
    
    if (element.tagName !== "BUTTON") 
    {
      app.extensions.common.addAriaRole(element, "button");
      element.setAttribute("tabindex", "0");
    }
    
    element.dataset.action = node.document.resolveURI(node.value.action);
    element.dataset.enctype = node.value.enctype || "";
    element.dataset.method = node.value.method || "";
    
    return result;
  }
  
  return afterSubmit;
};

},{}],49:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  function renderContainerInput(node) {
    var rootElement = document.createElement("div");
    rootElement.dataset.lynxInput = true;
    rootElement.appendChild(createAddElement());
    
    rootElement.lynx = rootElement.lynx || {};
    
    if (node.spec.options) rootElement.dataset.lynxOptionsValueHint = node.spec.children.hints[0].name;
    
    rootElement.lynx.addElement = function addContainerInputElement() {
      return app.extensions.lynx.parsing.buildNode(null, node.spec.children, node.document)
        .then(app.extensions.lynx.rendering.node)
        .then(appendChild);
    };
    
    function isContainerItem(elem) {
      return app.extensions.common.matchesSelector(elem, "[data-lynx-container-input-item]");
    }
    
    rootElement.lynx.removeElement = function removeContainerInputElement(removeElement) {
      var containerItem = app.extensions.common.findNearestElement(removeElement, isContainerItem);
      containerItem.parentElement.removeChild(containerItem);
    };

    function createAddElement() {
      var add = document.createElement("div");
      add.textContent = "+";
      add.dataset.lynxContainerInputAdd = true;
      return add;
    }
    
    function createRemoveElement() {
      var remove = document.createElement("div");
      remove.textContent = "-";
      remove.dataset.lynxContainerInputRemove = true;
      return remove;
    }

    function appendChild(child) {
      var container = document.createElement("div");
      container.dataset.lynxContainerInputItem = true;
      
      container.appendChild(child);
      container.appendChild(createRemoveElement());
      rootElement.appendChild(container);
      
      return container;
    }
    
    function appendChildren(children) {
      children.forEach(appendChild);
      return rootElement;
    }
    
    return Q(node)
      .then(app.extensions.lynx.rendering.children)
      .then(appendChildren);
  }
  
  return renderContainerInput;
};

},{"q":134}],50:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  function renderContainer(node) {
    var rootElement = document.createElement("div");

    function appendChild(child) {
      rootElement.appendChild(child);
    }
    
    function appendChildren(children) {
      children.forEach(appendChild);
    }
    
    return Q(node)
      .then(app.extensions.lynx.rendering.children)
      .then(appendChildren)
      .then(function () { return rootElement; });
  }
  
  return renderContainer;
};

},{"q":134}],51:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  function renderContent(node) {
    var content = node.value;
    
    if (content.data) {
      content.location = node.document.location;
    }
    
    function returnElement(result) {
      return result.element;
    }
    
    return Q(content)
      .then(app.rendering)
      .then(returnElement);
  }
  
  return renderContent;
};

},{"q":134}],52:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function(app) {
  function renderForm(node) {
    var rootElement = document.createElement("form");

    function appendChild(child) {
      rootElement.appendChild(child);
    }
    
    function appendChildren(children) {
      children.forEach(appendChild);
    }

    return Q(node)
      .then(app.extensions.lynx.rendering.children)
      .then(appendChildren)
      .then(function () { return rootElement; });
  }
  
  return renderForm;
};

},{"q":134}],53:[function(require,module,exports){
module.exports = exports = function (app) {
  function renderImage(node) {
    var rootElement = document.createElement("img");
    rootElement.src = node.document.resolveURI(node.value.src);

    var height = parseInt(node.value.height);
    if (height) rootElement.height = height;

    var width = parseInt(node.value.width);
    if (width) rootElement.width = width;
    
    return rootElement;
  }
  
  return renderImage;
};

},{}],54:[function(require,module,exports){
module.exports = exports = function (app) {
  function renderLink(node) {
    var rootElement = document.createElement("a");
    var href = node.document.resolveURI(node.value.href);
    rootElement.href = href;
    
    if (node.value.type) {
      rootElement.type = node.value.type;
    }

    function appendChild(child) {
      rootElement.appendChild(child);
    }
    
    function appendChildren(children) {
      if (children.length === 0) {
        rootElement.textContent = href;
      }
      else {
        children.forEach(appendChild);  
      }
    }
    
    return app.extensions.lynx.rendering.children(node)
      .then(appendChildren)
      .then(function () { return rootElement; });
  }

  return renderLink;
};

},{}],55:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  function renderSubmit(node) {
    var rootElement = document.createElement("button");

    function appendChild(child) {
      rootElement.appendChild(child);
    }
    
    function appendChildren(children) {
      if (children.length === 0) {
        rootElement.textContent = node.document.resolveURI(node.value.action);
      }
      else {
        children.forEach(appendChild);
      }
    }
    
    return Q(node)
      .then(app.extensions.lynx.rendering.children)
      .then(appendChildren)
      .then(function () { return rootElement; });
  }
  
  return renderSubmit;
};

},{"q":134}],56:[function(require,module,exports){
module.exports = exports = function (app) {
  function renderTextInput(node) {
    var rootElement;
    
    var isPhrasing = node.spec.hints.some(function (hint) { 
      return hint.name === "phrasing";
    });
    
    if (isPhrasing) {
      rootElement = document.createElement("input");
      
      if (node.spec.visibility === "concealed") {
        rootElement.type = "password";
      } else {
        rootElement.type = "text";
      }
    } else {
       rootElement = document.createElement("textarea");
    }
    
    rootElement.name = node.spec.input.name || "";
    rootElement.value = node.value && node.value.toString();
    rootElement.dataset.lynxInput = "true";
    
    if (node.spec.options) rootElement.dataset.lynxOptionsValueHint = node.spec.hints[0].name;
    
    return rootElement;
  }
  
  return renderTextInput;
};

},{}],57:[function(require,module,exports){
module.exports = exports = function (app) {
  function renderText(node) {
    var rootElement = document.createElement("pre");
    rootElement.textContent = node.value.toString();
    return rootElement;
  }
  
  return renderText;
};

},{}],58:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  var renderFunctions = [];
  var afterFunctions = [];
  
  function applyContentRealm(document) {
    return function (rootElement) {
      if (document.realm) {
        rootElement.dataset.contentRealm = document.realm;
      }

      return rootElement;
    };
  }
  
  function ensureContentHasData(content) {
    if (content.data) return Q(content);
    return app.transferring(content.src);
  }
  
  function renderLynxChildren(node) {
    var childPromises = [];

    node.children.forEach(function (child) {
      childPromises.push(Q(child)
        .then(renderLynxNode)
        .fail(app.error));
    });

    return Q.all(childPromises);
  }
  
  function renderLynxNode(node) {
    function filter(hintName, isInput) {
      return function (lynxNodeRenderingFunction) {
        return lynxNodeRenderingFunction.hintName == hintName &&
          lynxNodeRenderingFunction.isInput === isInput;
      };
    }
    
    function setLynxNodeRenderingContext(renderingHint, hintNames) {
      return function (element) {
        element.dataset.lynxRenderingHint = renderingHint;
        return element;
      };
    }
    
    var hintNames = node.spec.hints.map(function (hint) {
      return hint.name;
    });

    var promiseForElement;

    // If there is no value to render, then there is nothing to return
    if ((node.value === null || node.value === undefined) && !node.spec.input) {
      return document.createComment("Value was null or undefined for node w/ name: " + node.name);
    }
    
    var isInput = !!node.spec.input;
    
    var currentPromiseForElement;
        
    hintNames.forEach(function (hintName) {
      var lynxNodeRenderingFunction = renderFunctions.find( filter(hintName, isInput) );
      if (!lynxNodeRenderingFunction) return;
      if(!promiseForElement) {
        promiseForElement = Q(node)
          .then(lynxNodeRenderingFunction.fn)
          .then(setLynxNodeRenderingContext(hintName, hintNames));
        currentPromiseForElement = promiseForElement;
      }
      else {
        currentPromiseForElement = currentPromiseForElement.fail( function (err) {
          app.error(err);
          return Q(node)
            .then(lynxNodeRenderingFunction.fn)
            .then(setLynxNodeRenderingContext(hintName, hintNames));
        });
      }
    });
    
    currentPromiseForElement.fail(function (err) {
      // TODO: consider returning an element here to visually indicate a node rendering failure
      app.error(err);
    });
    
    if (!promiseForElement) throw new Error("No node rendering functions are available to render node hints: " + hintNames.join(", "));
    
    function returnElement(result) {
      return result.element;
    }
    
    function createLynxNodeRenderingResult(element) {
      return { 
        node: node, 
        element: element 
      };
    }
    
    promiseForElement = promiseForElement.then(createLynxNodeRenderingResult);
    
    promiseForElement = afterFunctions.reduce(
      Q.when, 
      promiseForElement
    );
    
    return promiseForElement
      .then(returnElement);
  }
  
  function renderLynxDocument(lynxDocument) {
    return Q(lynxDocument.root)
      .then(renderLynxNode)
      .then(applyContentRealm(lynxDocument));
  }
  
  function addLynxNodeRenderingFunction(hintName, lynxNodeRenderingFunction, isInput) {
    if (!hintName) throw new Error("Parameter 'hintName' is required.");
    if (!lynxNodeRenderingFunction) throw new Error("Parameter 'lynxNodeRenderingFunction' is required.");
    isInput = isInput || false;
    
    renderFunctions.push({
      hintName: hintName,
      isInput: isInput,
      fn: lynxNodeRenderingFunction
    });
  }
  
  function addLynxNodePostRenderingFunction(lynxNodePostRenderingFunction) {
    afterFunctions.push(lynxNodePostRenderingFunction);
  }
  
  function renderLynxContent(content) {
    return ensureContentHasData(content)
  		.then(app.extensions.lynx.parsing)
      .then(renderLynxDocument);
  }
  
  renderLynxContent.add = addLynxNodeRenderingFunction;
  renderLynxContent.after = addLynxNodePostRenderingFunction;
  renderLynxContent.children = renderLynxChildren;
  renderLynxContent.node = renderLynxNode;
  
  return renderLynxContent;
};

},{"q":134}],59:[function(require,module,exports){
module.exports = exports = function (app) {
  function findElementsWithHint(element, hintName) {
    return app.extensions.common.select("[data-lynx-hints~='" + hintName + "']")(element);
  }

  return findElementsWithHint;
};

},{}],60:[function(require,module,exports){
module.exports = exports = function (app) {
  return function findLabelElement(labeledElement) {
    var labeledBy = labeledElement.dataset.lynxLabeledBy;
    if (!labeledBy) return null;
    
    return app.extensions.common.findNearestElement(labeledElement, function (el) {
      return el.dataset.lynxName === labeledBy;
    });
  };
};

},{}],61:[function(require,module,exports){
module.exports = exports = function (app) {
  return function findOptionsElement(inputElement) {
    var optionsName = inputElement.dataset.lynxOptions;
    if (!optionsName) return null;
    
    return app.extensions.common.findNearestElement(inputElement, function (el) {
      return el.dataset.lynxName === optionsName;
    });
  };
};

},{}],62:[function(require,module,exports){
var util = require("util");

module.exports = exports = function(app){
  return function forEachValidationConstraint(validationElement, cb) {
    var validationConstraintSet = validationElement.lynx.validation;

    function invokeCb(constraintName) {
      return function (constraint) {
        cb(constraint, constraintName);
      };
    }

    for (var constraintName in validationConstraintSet) {
      var constraintsOrConstraint = validationConstraintSet[constraintName];

      if (util.isArray(constraintsOrConstraint)) {
        constraintsOrConstraint.forEach(invokeCb(constraintName));
      }
      else {
        cb(constraintsOrConstraint, constraintName);
      }
    }
  };
};
},{"util":113}],63:[function(require,module,exports){
module.exports = exports = function (app) {
  function getHintsForElement(element) {
    var hints = element.dataset.lynxHints;
    if (!hints) return [];
    return hints.split(" ");
  }
  
  return getHintsForElement;
};

},{}],64:[function(require,module,exports){
module.exports = exports = function (app) {
  function setHintsForElement(element, hints) {
    element.dataset.lynxHints = hints.join(" ");
  }
  
  return setHintsForElement;
};

},{}],65:[function(require,module,exports){
module.exports = exports = function (app) {
  function validateNumber(element, constraint) {
    var value = element.value;
    var empty = (value === undefined || value === null || value === "");
    if (empty) {
      return "valid";
    }

    if(isNaN(+value)){
      return "invalid";
    }

    if (constraint.min && (value < Number(constraint.min))) {
      return "invalid";
    }

    if (constraint.max && (value > Number(constraint.max))) {
      return "invalid";
    }

    if (constraint.step && (value % Number(constraint.step) !== 0)) {
      return "invalid";
    }
    
    return "valid";
  }
  
  return validateNumber;
};

},{}],66:[function(require,module,exports){
var util = require("util");

module.exports = exports = function (app) {
  function validateRequired(element, constraint) {
    var value = element.value;
    var valid = !(value === undefined || value === null || value === "" || (util.isArray(value) && value.length === 0));
    return valid ? "valid" : "invalid";
  }
  
  return validateRequired;
};

},{"util":113}],67:[function(require,module,exports){
module.exports = exports = function (app) {
  function validateText(element, constraint) {
    var value = element.value;
    var empty = (value === undefined || value === null || value === "");
    if (empty) {
      return "valid";
    }

    if (constraint.minLength && (value.length < constraint.minLength)) {
      return "invalid";
    }

    if (constraint.maxLength && (value.length > constraint.maxLength)) {
      return "invalid";
    }

    if (constraint.pattern) {
      var pattern = constraint.pattern;
      if (pattern.substring(0, 1) !== "^") pattern = "^" + pattern;
      if (pattern.substring(pattern.length - 1, 1) !== "$") pattern += "$";
      if (new RegExp(pattern).test(value) === false) {
        return "invalid";
      }
    }
    
    return "valid";
  }
  
  return validateText;
};

},{}],68:[function(require,module,exports){
var Q = require("q");
var commonmark = require("commonmark");

module.exports = exports = function (app) {
  function ensureContentHasData(content) {
    if (content.data !== undefined) return Q(content);
    return app.transferring(content.src);
  }

  function renderMarkdown(content) {
    var rootElement = document.createElement("div");

    var reader = new commonmark.Parser();
    var parsedMarkdown = reader.parse(content.data.toString());

    var writer = new commonmark.HtmlRenderer();
    rootElement.innerHTML = writer.render(parsedMarkdown);

    return rootElement;
  }

  function render(content) {
    return ensureContentHasData(content)
      .then(renderMarkdown);
  }
  
  var extension = {
    rendering: render
  };
  
  return extension;
};

},{"commonmark":121,"q":134}],69:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  function convertLineBreaksToHtmlBreaks(value) {
    return value && value.toString().replace(/\r?\n/g, "<br />");
  }

  function convertHtmlToText(htmlElement) {

    function accumulateText(htmlElement, accum) {
      var child = htmlElement.firstChild;

      while (child) {
        if (child.nodeName === "#text") {
          accum.push(child.textContent);
        } else if (child.previousSibling && child.nodeName === "BR" && child.previousSibling.nodeName === "BR") {
          accum.push("");
        } else if (child.nodeName !== "BR" && child.textContent === "") {
          accum.push("");
        }

        accumulateText(child, accum);

        child = child.nextSibling;
      }
    }

    var accum = [];
    accumulateText(htmlElement, accum);

    return accum.join("\n");
  }

  function ensureContentHasData(content) {
    if (content.data !== undefined) return Q(content);
    return app.transferring(content.src);
  }

  function renderTextPlain(content) {
    var rootElement = document.createElement("pre");
    rootElement.textContent = content.data.toString();
    return rootElement;
  }

  function render(content) {
    return ensureContentHasData(content)
      .then(renderTextPlain);
  }
  
  render.convertLineBreaksToHtmlBreaks = convertLineBreaksToHtmlBreaks;
  // render.convertHtmlToText = convertHtmlToText;
  
  var extension = {
    rendering: render
  };
  
  return extension;
};

},{"q":134}],70:[function(require,module,exports){
(function (Buffer){
function urlFormDataEncoding(formdata) {
  function urlEncodeNameValuePair(item) {
    var value = item.value.data || "";
    return encodeURIComponent(item.name) + "=" + encodeURIComponent(value);
  }
  
  var content = formdata.map(urlEncodeNameValuePair)
    .join("&")
    .replace(/%20/g, "+")
    .replace("'", "%27");

  return {
    data: new Buffer(content, "utf8"),
    type: "application/x-www-form-urlencoded"
  };
}

module.exports = exports = function (/*app*/) {
  var extension = {
    encoding: urlFormDataEncoding
  };
  
  return extension;
};

}).call(this,require("buffer").Buffer)
},{"buffer":80}],71:[function(require,module,exports){
var Q = require("q");

var encodingFunctions = [];

function typeFilter(type) {
  return function (encodingFunction) {
    return encodingFunction.type === type;
  };
}

function encodeFormData(formdata, enctype) {
  var encodingFunction = encodingFunctions.find( typeFilter(enctype) );
  if (!encodingFunction) throw new Error("No encoding functions are available to encode type: " + enctype);
  return Q(formdata).then(encodingFunction);
}

function addEncodingFunction(type, encodingFunction) {
  if (!type) throw new Error("Parameter 'type' is required.");
  if (!encodingFunction) throw new Error("Parameter 'encodingFunction' is required.");
  encodingFunction.type = type;
  encodingFunctions.push(encodingFunction);
}

encodeFormData.add = addEncodingFunction;

module.exports = exports = function (/*app*/) {
  return encodeFormData;
};

},{"q":134}],72:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  
  function makeCompositeFinishingFunction(predicate) {
    var finishingFunctions = [];
    
    function makeFailSafePromise(finishingFunction) {
      return function (result) {
        return Q(result)
          .then(finishingFunction)
          .fail(function (err) {
            app.error(err);
            return result;
          });
      };
    }
    
    function finishResult(result) {
      if (predicate && !predicate(result)) return result;
      return finishingFunctions.reduce(Q.when, Q(result));
    }

    finishResult.add = function addFinishingFunction(finishingFunction) {
      finishingFunctions.push(makeFailSafePromise(finishingFunction));
      return finishResult;
    };

    return finishResult;  
  }
  
  
  
  var rootFinishingFunction = makeCompositeFinishingFunction();
  
  rootFinishingFunction.composite = makeCompositeFinishingFunction;
  
  rootFinishingFunction.scope = function (scope) {
    return rootFinishingFunction.composite(function (result) {
      return app.extensions.common.scopeIncludesRealm(scope, result.element.dataset.contentRealm);
    });
  };
  
  rootFinishingFunction.realm = function (realm) {
    return rootFinishingFunction.composite(function (result) {
      var current = result.element;
      var appElement = app.getApplicationElement();
      while (current !== appElement) {
        if (app.extensions.common.realmsAreEqual(realm, current.dataset.contentRealm)) {
          return true;
        }
        current = current.parentElement;
      }
      
      return false;
    });
  };
  
  return rootFinishingFunction;
};

},{"q":134}],73:[function(require,module,exports){
var Q = require("q");
var util = require("util");

module.exports = exports = function (app) {

  var getTransitionPromiseHandlers = require("./get-transition-promise-handlers")(app);

  function follow(href, options) {
    function finish(result) {
      result.options = options;
      return app.finishing(result);
    }

    var content = {
      src: href
    };

    options = options || {};
    options.transition = new Date().valueOf();

    if (options.type) content.type = options.type;

    var promise = Q(content);
    
    var transitions = getTransitionPromiseHandlers(options.transition);
    promise.then(transitions.starting);

    if (options.delay) {
      promise = promise.delay(options.delay);
    }
    
    function onRejected(err) {
      var message = [];
      message.push("URL:");
      message.push(href);
      message.push("Content:");
      message.push(err.message);
      err.message = message.join("\n");
      
      app.error(err);
      throw err;
    }

    return promise.then(app.rendering)
      .then(finish)
      .fail(onRejected)
      .finally(transitions.ending);
  }

  return follow;
};

},{"./get-transition-promise-handlers":74,"q":134,"util":113}],74:[function(require,module,exports){
module.exports = exports = function (app) {
  function getTransitionPromiseHandlers(transition) {
    function setUserAgentState(applicationElement, newState) {
      // valid state transitions:
      //    ready -> loading, loading -> busy, busy -> ready
      var currentState = applicationElement.dataset.uaState;
      if (currentState === newState) return;
      if (currentState === "ready" && newState !== "loading") return;
      if (currentState === "busy" && newState !== "ready") return;

      applicationElement.dataset.uaState = newState;

      var jsuaEvent = document.createEvent("Event");
      jsuaEvent.initEvent("jsua", true, false);
      jsuaEvent.state = newState;
      applicationElement.dispatchEvent(jsuaEvent);
    }

    function startingTransition(passthrough) {
      var applicationElement = app.getApplicationElement();
      var transitionCount = +applicationElement.dataset.uaTransitionCount;
      if (isNaN(transitionCount)) transitionCount = 0;
      applicationElement.dataset.uaTransitionCount = ++transitionCount;

      if (transitionCount === 1) {
        window.setTimeout(setUserAgentState, 100, applicationElement, "busy");
      }
      setUserAgentState(applicationElement, "loading");
      return passthrough;
    }

    function endingTransition() {
      var applicationElement = app.getApplicationElement();

      var transitionCount = +applicationElement.dataset.uaTransitionCount;
      applicationElement.dataset.uaTransitionCount = --transitionCount;

      if (transitionCount !== 0) return;
      setUserAgentState(applicationElement, "ready");
    }

    return {
      starting: startingTransition,
      ending: endingTransition
    };
  }

  return getTransitionPromiseHandlers;
};

},{}],75:[function(require,module,exports){
var url = require("url");

module.exports = exports = function () {
  var app = {};
  
  app.encoding = require("./encoding")(app);
  app.transferring = require("./transferring")(app);
  app.rendering = require("./rendering")(app);
  app.finishing = require("./finishing")(app);
  app.follow = require("./follow")(app);
  app.send = require("./send")(app);
  app.extensions = {};
  
  app.resolveURI = function (base, uri) {
    return url.resolve(base, uri);
  };
  
  app.error = function defaultErrorHandler(err) { 
    console.error(err);
  };
  
  var applicationElement = null;
  
  app.getApplicationElement = function getApplicationElement() {
    if (!applicationElement) throw new Error("Use the 'setApplicationElement' function to configure the application's root element.");
    return applicationElement;
  };
  
  app.setApplicationElement = function setApplicationElement(element) {
    applicationElement = element;
  };
  
  app.getLocation = function getLocation() {
    var appElement = app.getApplicationElement();
    
    var contentElement = appElement.querySelector("[data-content-location]");
    return contentElement && contentElement.dataset.contentLocation;
  };
  
  return app;
};

},{"./encoding":71,"./finishing":72,"./follow":73,"./rendering":76,"./send":77,"./transferring":78,"url":111}],76:[function(require,module,exports){
var Q = require("q");
var contentType = require("content-type");

module.exports = exports = function (app) {
  var contentRenderingFunctions = [];
  var postContentRenderingFunctions = [];

  // TODO: Improve Matching
  // we should make the finding of content rendering functions
  // weighted according to the same rules as Accept
  // so that it is not dependent upon the order in which the functions are added
  // e.g. an exact match of text/plain has higher precedence than
  // a type/* match which has a higher precedence than a */* match
  function typeRangeFilter(type) {
    return function (contentRenderingFunction) {
      var typeRange = contentRenderingFunction.typeRange;
      type = contentType.parse(type).type;
      
      if (typeRange === "*/*") return true;
      if (typeRange === type) return true;
      
      var expected = typeRange.split("/");
      var actual = type.split("/");
      if (expected[1] === "*") return expected[0] === actual[0];
      
      return false;
    };
  }

  function createContentObjectFromHeadResult(content) {
    return function (result) {
      return {
        src: content.src,
        type: result.type
      };
    };
  }

  function ensureTypeAttribute(content) {
    if (content.type) {
      return content;
    }

    return app.transferring(content.src, { method: "HEAD" })
      .then(createContentObjectFromHeadResult(content));
  }

  // TODO: Catch error from rendering package and 
  // try other matching but less specific rendering packages
  function renderContent(content) {
    function createResult(element) {
      return {
        content: content,
        element: element
      };
    }
    
    function findRenderingFunctionAndRender(content) {
      var contentRenderingFunction = contentRenderingFunctions.find( typeRangeFilter(content.type) );
      
      if (!contentRenderingFunction) {
        throw new Error("No content rendering functions are available to render type: " + content.type);  
      }
      
      return Q(content)
        .then(contentRenderingFunction.fn)
        .then(function (element) {
          var functionName = contentRenderingFunction.fn.name;
          if (!element) throw new Error("The content rendering function failed to return an element: " + functionName);
          
          element.dataset.renderingTypeRange = contentRenderingFunction.typeRange;
          return element;
        });
    }
    
    var promise = Q(content)
      .then(ensureTypeAttribute)
      .then(function (expandedContent) {
        content = expandedContent;
        return content;
      })
      .then(findRenderingFunctionAndRender)
      .then(createResult);
      
    return postContentRenderingFunctions.reduce(Q.when, promise);
  }

  function addContentRenderingFunction(typeRange, contentRenderingFunction) {
    contentRenderingFunctions.push({
      typeRange: typeRange,
      fn: contentRenderingFunction
    });
  }

  function addPostContentRenderingFunction(postContentRenderingFunction) {
    postContentRenderingFunctions.push(postContentRenderingFunction);
  }

  renderContent.add = addContentRenderingFunction;
  renderContent.after = addPostContentRenderingFunction;

  return renderContent;
};

},{"content-type":126,"q":134}],77:[function(require,module,exports){
var Q = require("q");
var util = require("util");

module.exports = exports = function (app) {

  var getTransitionPromiseHandlers = require("./get-transition-promise-handlers")(app);

  return function send(url, options) {

    options = options || {};
    options.transition = new Date().valueOf();

    function encode() {
      if (options.body) return options.body;
      if (options.formdata) return app.encoding(options.formdata, options.enctype);
      return null;
    }

    function transfer(content) {
      options.body = content;
      return app.transferring(url, options);
    }

    function finish(result) {
      result.options = options;
      return app.finishing(result);
    }

    var promise = Q();

    var transitions = getTransitionPromiseHandlers(options.transition);
    promise.then(transitions.starting);

    if (options.delay) {
      promise = promise.delay(options.delay);
    }
    
    function onRejected(err) {
      var message = [];
      message.push("URL:");
      message.push(href);
      message.push("Content:");
      message.push(err.message);
      err.message = message.join("\n");
      
      app.error(err);
      throw err;
    }

    return promise.then(encode)
      .then(transfer)
      .then(app.rendering)
      .then(finish)
      .fail(onRejected)
      .finally(transitions.ending);
  };
};

},{"./get-transition-promise-handlers":74,"q":134,"util":113}],78:[function(require,module,exports){
var Q = require("q");
var URI = require("urijs");

var transferringFunctions = [];

function protocolFilter(protocol) {
  return function (transferringFunction) {
    return transferringFunction.protocol === protocol;
  };
}

function transfer(url, options) {
  var protocol = URI(url).protocol();
  if (!protocol) throw new Error("Missing protocol scheme in URL: '" + url + "'");
  
  var transferringFunction = transferringFunctions.find( protocolFilter(protocol) );
  if (!transferringFunction) throw new Error("No transferring functions are available for protocol: '" + protocol + "'");
  
  return Q.spread([url, options], transferringFunction.fn);
}

function addTransferringFunction(protocol, transferringFunction) {
  transferringFunctions.push({
    protocol: protocol,
    fn: transferringFunction
  });
}

transfer.add = addTransferringFunction;

module.exports = exports = function (/*app*/) {
  return transfer;
};

},{"q":134,"urijs":141}],79:[function(require,module,exports){

},{}],80:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : (function () {
      function Bar () {}
      try {
        var arr = new Uint8Array(1)
        arr.foo = function () { return 42 }
        arr.constructor = Bar
        return arr.foo() === 42 && // typed array instances can be augmented
            arr.constructor === Bar && // constructor can be set
            typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
            arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
      } catch (e) {
        return false
      }
    })()

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":81,"ieee754":82,"is-array":83}],81:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],82:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],83:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],84:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],85:[function(require,module,exports){
var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');
var url = require('url')

http.request = function (params, cb) {
    if (typeof params === 'string') {
        params = url.parse(params)
    }
    if (!params) params = {};
    if (!params.host && !params.port) {
        params.port = parseInt(window.location.port, 10);
    }
    if (!params.host && params.hostname) {
        params.host = params.hostname;
    }

    if (!params.protocol) {
        if (params.scheme) {
            params.protocol = params.scheme + ':';
        } else {
            params.protocol = window.location.protocol;
        }
    }

    if (!params.host) {
        params.host = window.location.hostname || window.location.host;
    }
    if (/:/.test(params.host)) {
        if (!params.port) {
            params.port = params.host.split(':')[1];
        }
        params.host = params.host.split(':')[0];
    }
    if (!params.port) params.port = params.protocol == 'https:' ? 443 : 80;
    
    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

http.Agent = function () {};
http.Agent.defaultMaxSockets = 4;

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

http.STATUS_CODES = {
    100 : 'Continue',
    101 : 'Switching Protocols',
    102 : 'Processing',                 // RFC 2518, obsoleted by RFC 4918
    200 : 'OK',
    201 : 'Created',
    202 : 'Accepted',
    203 : 'Non-Authoritative Information',
    204 : 'No Content',
    205 : 'Reset Content',
    206 : 'Partial Content',
    207 : 'Multi-Status',               // RFC 4918
    300 : 'Multiple Choices',
    301 : 'Moved Permanently',
    302 : 'Moved Temporarily',
    303 : 'See Other',
    304 : 'Not Modified',
    305 : 'Use Proxy',
    307 : 'Temporary Redirect',
    400 : 'Bad Request',
    401 : 'Unauthorized',
    402 : 'Payment Required',
    403 : 'Forbidden',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    406 : 'Not Acceptable',
    407 : 'Proxy Authentication Required',
    408 : 'Request Time-out',
    409 : 'Conflict',
    410 : 'Gone',
    411 : 'Length Required',
    412 : 'Precondition Failed',
    413 : 'Request Entity Too Large',
    414 : 'Request-URI Too Large',
    415 : 'Unsupported Media Type',
    416 : 'Requested Range Not Satisfiable',
    417 : 'Expectation Failed',
    418 : 'I\'m a teapot',              // RFC 2324
    422 : 'Unprocessable Entity',       // RFC 4918
    423 : 'Locked',                     // RFC 4918
    424 : 'Failed Dependency',          // RFC 4918
    425 : 'Unordered Collection',       // RFC 4918
    426 : 'Upgrade Required',           // RFC 2817
    428 : 'Precondition Required',      // RFC 6585
    429 : 'Too Many Requests',          // RFC 6585
    431 : 'Request Header Fields Too Large',// RFC 6585
    500 : 'Internal Server Error',
    501 : 'Not Implemented',
    502 : 'Bad Gateway',
    503 : 'Service Unavailable',
    504 : 'Gateway Time-out',
    505 : 'HTTP Version Not Supported',
    506 : 'Variant Also Negotiates',    // RFC 2295
    507 : 'Insufficient Storage',       // RFC 4918
    509 : 'Bandwidth Limit Exceeded',
    510 : 'Not Extended',               // RFC 2774
    511 : 'Network Authentication Required' // RFC 6585
};
},{"./lib/request":86,"events":84,"url":111}],86:[function(require,module,exports){
var Stream = require('stream');
var Response = require('./response');
var Base64 = require('Base64');
var inherits = require('inherits');

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.writable = true;
    self.xhr = xhr;
    self.body = [];
    
    self.uri = (params.protocol || 'http:') + '//'
        + params.host
        + (params.port ? ':' + params.port : '')
        + (params.path || '/')
    ;
    
    if (typeof params.withCredentials === 'undefined') {
        params.withCredentials = true;
    }

    try { xhr.withCredentials = params.withCredentials }
    catch (e) {}
    
    if (params.responseType) try { xhr.responseType = params.responseType }
    catch (e) {}
    
    xhr.open(
        params.method || 'GET',
        self.uri,
        true
    );

    xhr.onerror = function(event) {
        self.emit('error', new Error('Network error'));
    };

    self._headers = {};
    
    if (params.headers) {
        var keys = objectKeys(params.headers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!self.isSafeRequestHeader(key)) continue;
            var value = params.headers[key];
            self.setHeader(key, value);
        }
    }
    
    if (params.auth) {
        //basic auth
        this.setHeader('Authorization', 'Basic ' + Base64.btoa(params.auth));
    }

    var res = new Response;
    res.on('close', function () {
        self.emit('close');
    });
    
    res.on('ready', function () {
        self.emit('response', res);
    });

    res.on('error', function (err) {
        self.emit('error', err);
    });
    
    xhr.onreadystatechange = function () {
        // Fix for IE9 bug
        // SCRIPT575: Could not complete the operation due to error c00c023f
        // It happens when a request is aborted, calling the success callback anyway with readyState === 4
        if (xhr.__aborted) return;
        res.handle(xhr);
    };
};

inherits(Request, Stream);

Request.prototype.setHeader = function (key, value) {
    this._headers[key.toLowerCase()] = value
};

Request.prototype.getHeader = function (key) {
    return this._headers[key.toLowerCase()]
};

Request.prototype.removeHeader = function (key) {
    delete this._headers[key.toLowerCase()]
};

Request.prototype.write = function (s) {
    this.body.push(s);
};

Request.prototype.destroy = function (s) {
    this.xhr.__aborted = true;
    this.xhr.abort();
    this.emit('close');
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.body.push(s);

    var keys = objectKeys(this._headers);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = this._headers[key];
        if (isArray(value)) {
            for (var j = 0; j < value.length; j++) {
                this.xhr.setRequestHeader(key, value[j]);
            }
        }
        else this.xhr.setRequestHeader(key, value)
    }

    if (this.body.length === 0) {
        this.xhr.send('');
    }
    else if (typeof this.body[0] === 'string') {
        this.xhr.send(this.body.join(''));
    }
    else if (isArray(this.body[0])) {
        var body = [];
        for (var i = 0; i < this.body.length; i++) {
            body.push.apply(body, this.body[i]);
        }
        this.xhr.send(body);
    }
    else if (/Array/.test(Object.prototype.toString.call(this.body[0]))) {
        var len = 0;
        for (var i = 0; i < this.body.length; i++) {
            len += this.body[i].length;
        }
        var body = new(this.body[0].constructor)(len);
        var k = 0;
        
        for (var i = 0; i < this.body.length; i++) {
            var b = this.body[i];
            for (var j = 0; j < b.length; j++) {
                body[k++] = b[j];
            }
        }
        this.xhr.send(body);
    }
    else if (isXHR2Compatible(this.body[0])) {
        this.xhr.send(this.body[0]);
    }
    else {
        var body = '';
        for (var i = 0; i < this.body.length; i++) {
            body += this.body[i].toString();
        }
        this.xhr.send(body);
    }
};

// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

Request.prototype.isSafeRequestHeader = function (headerName) {
    if (!headerName) return false;
    return indexOf(Request.unsafeHeaders, headerName.toLowerCase()) === -1;
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var indexOf = function (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (xs[i] === x) return i;
    }
    return -1;
};

var isXHR2Compatible = function (obj) {
    if (typeof Blob !== 'undefined' && obj instanceof Blob) return true;
    if (typeof ArrayBuffer !== 'undefined' && obj instanceof ArrayBuffer) return true;
    if (typeof FormData !== 'undefined' && obj instanceof FormData) return true;
};

},{"./response":87,"Base64":88,"inherits":90,"stream":109}],87:[function(require,module,exports){
var Stream = require('stream');
var util = require('util');

var Response = module.exports = function (res) {
    this.offset = 0;
    this.readable = true;
};

util.inherits(Response, Stream);

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (res) {
    var lines = res.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;
        
        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];
            
            if (headers[key] !== undefined) {
            
                if (isArray(headers[key])) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getResponse = function (xhr) {
    var respType = String(xhr.responseType).toLowerCase();
    if (respType === 'blob') return xhr.responseBlob || xhr.response;
    if (respType === 'arraybuffer') return xhr.response;
    return xhr.responseText;
}

Response.prototype.getHeader = function (key) {
    return this.headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
    if (res.readyState === 2 && capable.status2) {
        try {
            this.statusCode = res.status;
            this.headers = parseHeaders(res);
        }
        catch (err) {
            capable.status2 = false;
        }
        
        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && res.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
                this.emit('ready');
            }
        }
        catch (err) {}
        
        try {
            this._emitData(res);
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (res.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = res.status;
            this.emit('ready');
        }
        this._emitData(res);
        
        if (res.error) {
            this.emit('error', this.getResponse(res));
        }
        else this.emit('end');
        
        this.emit('close');
    }
};

Response.prototype._emitData = function (res) {
    var respBody = this.getResponse(res);
    if (respBody.toString().match(/ArrayBuffer/)) {
        this.emit('data', new Uint8Array(respBody, this.offset));
        this.offset = respBody.byteLength;
        return;
    }
    if (respBody.length > this.offset) {
        this.emit('data', respBody.slice(this.offset));
        this.offset = respBody.length;
    }
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{"stream":109,"util":113}],88:[function(require,module,exports){
;(function () {

  var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next input index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      input.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = input.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    input = input.replace(/=+$/, '');
    if (input.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],89:[function(require,module,exports){
var http = require('http');

var https = module.exports;

for (var key in http) {
    if (http.hasOwnProperty(key)) https[key] = http[key];
};

https.request = function (params, cb) {
    if (!params) params = {};
    params.scheme = 'https';
    params.protocol = 'https:';
    return http.request.call(this, params, cb);
}

},{"http":85}],90:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],91:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],92:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],93:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],94:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],95:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],96:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],97:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":95,"./encode":96}],98:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":99}],99:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(this.end.bind(this));
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

}).call(this,require('_process'))
},{"./_stream_readable":101,"./_stream_writable":103,"_process":93,"core-util-is":104,"inherits":90}],100:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":102,"core-util-is":104,"inherits":90}],101:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;

/*<replacement>*/
if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

var Stream = require('stream');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var StringDecoder;


/*<replacement>*/
var debug = require('util');
if (debug && debug.debuglog) {
  debug = debug.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/


util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (util.isString(chunk) && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (util.isNullOrUndefined(chunk)) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || util.isNull(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (!util.isNumber(n) || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (util.isNull(ret)) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (!util.isNull(ret))
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      process.nextTick(function() {
        emitReadable_(stream);
      });
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    process.nextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      debug('false write response, pause',
            src._readableState.awaitDrain);
      src._readableState.awaitDrain++;
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];



  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        var self = this;
        process.nextTick(function() {
          debug('readable nexttick read 0');
          self.read(0);
        });
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    if (!state.reading) {
      debug('resume read 0');
      this.read(0);
    }
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(function() {
      resume_(stream, state);
    });
  }
}

function resume_(stream, state) {
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))
},{"./_stream_duplex":99,"_process":93,"buffer":80,"core-util-is":104,"events":84,"inherits":90,"isarray":92,"stream":109,"string_decoder/":110,"util":79}],102:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (!util.isNullOrUndefined(data))
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('prefinish', function() {
    if (util.isFunction(this._flush))
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":99,"core-util-is":104,"inherits":90}],103:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Stream = require('stream');

util.inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    process.nextTick(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (util.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (!util.isFunction(cb))
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.buffer.length)
      clearBuffer(this, state);
  }
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      util.isString(chunk)) {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  if (util.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, false, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      state.pendingcb--;
      cb(er);
    });
  else {
    state.pendingcb--;
    cb(er);
  }

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.buffer.length) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  if (stream._writev && state.buffer.length > 1) {
    // Fast case, write everything using _writev()
    var cbs = [];
    for (var c = 0; c < state.buffer.length; c++)
      cbs.push(state.buffer[c].callback);

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
    state.buffer = [];
  } else {
    // Slow case, write chunks one-by-one
    for (var c = 0; c < state.buffer.length; c++) {
      var entry = state.buffer[c];
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);

      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        c++;
        break;
      }
    }

    if (c < state.buffer.length)
      state.buffer = state.buffer.slice(c);
    else
      state.buffer.length = 0;
  }

  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));

};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (util.isFunction(chunk)) {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (!util.isNullOrUndefined(chunk))
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else
      prefinish(stream, state);
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

}).call(this,require('_process'))
},{"./_stream_duplex":99,"_process":93,"buffer":80,"core-util-is":104,"inherits":90,"stream":109}],104:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return Buffer.isBuffer(arg);
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}
}).call(this,{"isBuffer":require("/Users/danmork/Projects/Lynx/web-browser-user-agent/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")})
},{"/Users/danmork/Projects/Lynx/web-browser-user-agent/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":91}],105:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":100}],106:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = require('stream');
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":99,"./lib/_stream_passthrough.js":100,"./lib/_stream_readable.js":101,"./lib/_stream_transform.js":102,"./lib/_stream_writable.js":103,"stream":109}],107:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":102}],108:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":103}],109:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":84,"inherits":90,"readable-stream/duplex.js":98,"readable-stream/passthrough.js":105,"readable-stream/readable.js":106,"readable-stream/transform.js":107,"readable-stream/writable.js":108}],110:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":80}],111:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":94,"querystring":97}],112:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],113:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":112,"_process":93,"inherits":90}],114:[function(require,module,exports){
"use strict";

var Node = require('./node');
var unescapeString = require('./common').unescapeString;

var CODE_INDENT = 4;

var C_NEWLINE = 10;
var C_GREATERTHAN = 62;
var C_SPACE = 32;
var C_OPEN_BRACKET = 91;

var InlineParser = require('./inlines');

var BLOCKTAGNAME = '(?:article|header|aside|hgroup|iframe|blockquote|hr|body|li|map|button|object|canvas|ol|caption|output|col|p|colgroup|pre|dd|progress|div|section|dl|table|td|dt|tbody|embed|textarea|fieldset|tfoot|figcaption|th|figure|thead|footer|footer|tr|form|ul|h1|h2|h3|h4|h5|h6|video|script|style)';

var HTMLBLOCKOPEN = "<(?:" + BLOCKTAGNAME + "(?:[\\s/>]|$)" + "|" +
        "/" + BLOCKTAGNAME + "(?:[\\s>]|$)" + "|" + "[?!])";

var reHtmlBlockOpen = new RegExp('^' + HTMLBLOCKOPEN, 'i');

var reHrule = /^(?:(?:\* *){3,}|(?:_ *){3,}|(?:- *){3,}) *$/;

var reMaybeSpecial = /^[#`~*+_=<>0-9-]/;

var reNonSpace = /[^ \t\f\v\r\n]/;

var reBulletListMarker = /^[*+-]( +|$)/;

var reOrderedListMarker = /^(\d+)([.)])( +|$)/;

var reATXHeaderMarker = /^#{1,6}(?: +|$)/;

var reCodeFence = /^`{3,}(?!.*`)|^~{3,}(?!.*~)/;

var reClosingCodeFence = /^(?:`{3,}|~{3,})(?= *$)/;

var reSetextHeaderLine = /^(?:=+|-+) *$/;

var reLineEnding = /\r\n|\n|\r/;

// Returns true if string contains only space characters.
var isBlank = function(s) {
    return !(reNonSpace.test(s));
};

var tabSpaces = ['    ', '   ', '  ', ' '];

// Convert tabs to spaces on each line using a 4-space tab stop.
var detabLine = function(text) {
    var start = 0;
    var offset;
    var lastStop = 0;

    while ((offset = text.indexOf('\t', start)) !== -1) {
        var numspaces = (offset - lastStop) % 4;
        var spaces = tabSpaces[numspaces];
        text = text.slice(0, offset) + spaces + text.slice(offset + 1);
        lastStop = offset + numspaces;
        start = lastStop;
    }

    return text;
};

var peek = function(ln, pos) {
    if (pos < ln.length) {
        return ln.charCodeAt(pos);
    } else {
        return -1;
    }
};

// DOC PARSER

// These are methods of a Parser object, defined below.

// Returns true if block ends with a blank line, descending if needed
// into lists and sublists.
var endsWithBlankLine = function(block) {
    while (block) {
        if (block._lastLineBlank) {
            return true;
        }
        var t = block.type;
        if (t === 'List' || t === 'Item') {
            block = block._lastChild;
        } else {
            break;
        }
    }
    return false;
};

// Break out of all containing lists, resetting the tip of the
// document to the parent of the highest list, and finalizing
// all the lists.  (This is used to implement the "two blank lines
// break of of all lists" feature.)
var breakOutOfLists = function(block) {
    var b = block;
    var last_list = null;
    do {
        if (b.type === 'List') {
            last_list = b;
        }
        b = b._parent;
    } while (b);

    if (last_list) {
        while (block !== last_list) {
            this.finalize(block, this.lineNumber);
            block = block._parent;
        }
        this.finalize(last_list, this.lineNumber);
        this.tip = last_list._parent;
    }
};

// Add a line to the block at the tip.  We assume the tip
// can accept lines -- that check should be done before calling this.
var addLine = function() {
    this.tip._string_content += this.currentLine.slice(this.offset) + '\n';
};

// Add block of type tag as a child of the tip.  If the tip can't
// accept children, close and finalize it and try its parent,
// and so on til we find a block that can accept children.
var addChild = function(tag, offset) {
    while (!this.blocks[this.tip.type].canContain(tag)) {
        this.finalize(this.tip, this.lineNumber - 1);
    }

    var column_number = offset + 1; // offset 0 = column 1
    var newBlock = new Node(tag, [[this.lineNumber, column_number], [0, 0]]);
    newBlock._string_content = '';
    this.tip.appendChild(newBlock);
    this.tip = newBlock;
    return newBlock;
};

// Parse a list marker and return data on the marker (type,
// start, delimiter, bullet character, padding) or null.
var parseListMarker = function(ln, offset, indent) {
    var rest = ln.slice(offset);
    var match;
    var spaces_after_marker;
    var data = { type: null,
                 tight: true,  // lists are tight by default
                 bulletChar: null,
                 start: null,
                 delimiter: null,
                 padding: null,
                 markerOffset: indent };
    if ((match = rest.match(reBulletListMarker))) {
        spaces_after_marker = match[1].length;
        data.type = 'Bullet';
        data.bulletChar = match[0][0];

    } else if ((match = rest.match(reOrderedListMarker))) {
        spaces_after_marker = match[3].length;
        data.type = 'Ordered';
        data.start = parseInt(match[1]);
        data.delimiter = match[2];
    } else {
        return null;
    }
    var blank_item = match[0].length === rest.length;
    if (spaces_after_marker >= 5 ||
        spaces_after_marker < 1 ||
        blank_item) {
        data.padding = match[0].length - spaces_after_marker + 1;
    } else {
        data.padding = match[0].length;
    }
    return data;
};

// Returns true if the two list items are of the same type,
// with the same delimiter and bullet character.  This is used
// in agglomerating list items into lists.
var listsMatch = function(list_data, item_data) {
    return (list_data.type === item_data.type &&
            list_data.delimiter === item_data.delimiter &&
            list_data.bulletChar === item_data.bulletChar);
};

// Finalize and close any unmatched blocks. Returns true.
var closeUnmatchedBlocks = function() {
    if (!this.allClosed) {
        // finalize any blocks not matched
        while (this.oldtip !== this.lastMatchedContainer) {
            var parent = this.oldtip._parent;
            this.finalize(this.oldtip, this.lineNumber - 1);
            this.oldtip = parent;
        }
        this.allClosed = true;
    }
};

// 'finalize' is run when the block is closed.
// 'continue' is run to check whether the block is continuing
// at a certain line and offset (e.g. whether a block quote
// contains a `>`.  It returns 0 for matched, 1 for not matched,
// and 2 for "we've dealt with this line completely, go to next."
var blocks = {
    Document: {
        continue: function() { return 0; },
        finalize: function() { return; },
        canContain: function(t) { return (t !== 'Item'); },
        acceptsLines: false
    },
    List: {
        continue: function() { return 0; },
        finalize: function(parser, block) {
            var item = block._firstChild;
            while (item) {
                // check for non-final list item ending with blank line:
                if (endsWithBlankLine(item) && item._next) {
                    block._listData.tight = false;
                    break;
                }
                // recurse into children of list item, to see if there are
                // spaces between any of them:
                var subitem = item._firstChild;
                while (subitem) {
                    if (endsWithBlankLine(subitem) &&
                        (item._next || subitem._next)) {
                        block._listData.tight = false;
                        break;
                    }
                    subitem = subitem._next;
                }
                item = item._next;
            }
        },
        canContain: function(t) { return (t === 'Item'); },
        acceptsLines: false
    },
    BlockQuote: {
        continue: function(parser) {
            var ln = parser.currentLine;
            if (!parser.indented &&
                peek(ln, parser.nextNonspace) === C_GREATERTHAN) {
                parser.offset = parser.nextNonspace + 1;
                if (peek(ln, parser.offset) === C_SPACE) {
                    parser.offset++;
                }
            } else {
                return 1;
            }
            return 0;
        },
        finalize: function() { return; },
        canContain: function(t) { return (t !== 'Item'); },
        acceptsLines: false
    },
    Item: {
        continue: function(parser, container) {
            if (parser.blank) {
                parser.offset = parser.nextNonspace;
            } else if (parser.indent >=
                       container._listData.markerOffset +
                       container._listData.padding) {
                parser.offset += container._listData.markerOffset +
                    container._listData.padding;
            } else {
                return 1;
            }
            return 0;
        },
        finalize: function() { return; },
        canContain: function(t) { return (t !== 'Item'); },
        acceptsLines: false
    },
    Header: {
        continue: function() {
            // a header can never container > 1 line, so fail to match:
            return 1;
        },
        finalize: function() { return; },
        canContain: function() { return false; },
        acceptsLines: false
    },
    HorizontalRule: {
        continue: function() {
            // an hrule can never container > 1 line, so fail to match:
            return 1;
        },
        finalize: function() { return; },
        canContain: function() { return false; },
        acceptsLines: false
    },
    CodeBlock: {
        continue: function(parser, container) {
            var ln = parser.currentLine;
            var indent = parser.indent;
            if (container._isFenced) { // fenced
                var match = (indent <= 3 &&
                    ln.charAt(parser.nextNonspace) === container._fenceChar &&
                    ln.slice(parser.nextNonspace).match(reClosingCodeFence));
                if (match && match[0].length >= container._fenceLength) {
                    // closing fence - we're at end of line, so we can return
                    parser.finalize(container, parser.lineNumber);
                    return 2;
                } else {
                    // skip optional spaces of fence offset
                    var i = container._fenceOffset;
                    while (i > 0 && peek(ln, parser.offset) === C_SPACE) {
                        parser.offset++;
                        i--;
                    }
                }
            } else { // indented
                if (indent >= CODE_INDENT) {
                    parser.offset += CODE_INDENT;
                } else if (parser.blank) {
                    parser.offset = parser.nextNonspace;
                } else {
                    return 1;
                }
            }
            return 0;
        },
        finalize: function(parser, block) {
            if (block._isFenced) { // fenced
                // first line becomes info string
                var content = block._string_content;
                var newlinePos = content.indexOf('\n');
                var firstLine = content.slice(0, newlinePos);
                var rest = content.slice(newlinePos + 1);
                block.info = unescapeString(firstLine.trim());
                block._literal = rest;
            } else { // indented
                block._literal = block._string_content.replace(/(\n *)+$/, '\n');
            }
            block._string_content = null; // allow GC
        },
        canContain: function() { return false; },
        acceptsLines: true
    },
    HtmlBlock: {
        continue: function(parser) {
            return (parser.blank ? 1 : 0);
        },
        finalize: function(parser, block) {
            block._literal = block._string_content.replace(/(\n *)+$/, '');
            block._string_content = null; // allow GC
        },
        canContain: function() { return false; },
        acceptsLines: true
    },
    Paragraph: {
        continue: function(parser) {
            return (parser.blank ? 1 : 0);
        },
        finalize: function(parser, block) {
            var pos;
            var hasReferenceDefs = false;

            // try parsing the beginning as link reference definitions:
            while (peek(block._string_content, 0) === C_OPEN_BRACKET &&
                   (pos =
                    parser.inlineParser.parseReference(block._string_content,
                                                       parser.refmap))) {
                block._string_content = block._string_content.slice(pos);
                hasReferenceDefs = true;
            }
            if (hasReferenceDefs && isBlank(block._string_content)) {
                block.unlink();
            }
        },
        canContain: function() { return false; },
        acceptsLines: true
    }
};

// block start functions.  Return values:
// 0 = no match
// 1 = matched container, keep going
// 2 = matched leaf, no more block starts
var blockStarts = [
    // block quote
    function(parser) {
        if (!parser.indented &&
            peek(parser.currentLine, parser.nextNonspace) === C_GREATERTHAN) {
            parser.offset = parser.nextNonspace + 1;
            // optional following space
            if (peek(parser.currentLine, parser.offset) === C_SPACE) {
                parser.offset++;
            }
            parser.closeUnmatchedBlocks();
            parser.addChild('BlockQuote', parser.nextNonspace);
            return 1;
        } else {
            return 0;
        }
    },

    // ATX header
    function(parser) {
        var match;
        if (!parser.indented &&
            (match = parser.currentLine.slice(parser.nextNonspace).match(reATXHeaderMarker))) {
            parser.offset = parser.nextNonspace + match[0].length;
            parser.closeUnmatchedBlocks();
            var container = parser.addChild('Header', parser.nextNonspace);
            container.level = match[0].trim().length; // number of #s
            // remove trailing ###s:
            container._string_content =
                parser.currentLine.slice(parser.offset).replace(/^ *#+ *$/, '').replace(/ +#+ *$/, '');
            parser.offset = parser.currentLine.length;
            return 2;
        } else {
            return 0;
        }
    },

    // Fenced code block
    function(parser) {
        var match;
        if (!parser.indented &&
            (match = parser.currentLine.slice(parser.nextNonspace).match(reCodeFence))) {
            var fenceLength = match[0].length;
            parser.closeUnmatchedBlocks();
            var container = parser.addChild('CodeBlock', parser.nextNonspace);
            container._isFenced = true;
            container._fenceLength = fenceLength;
            container._fenceChar = match[0][0];
            container._fenceOffset = parser.indent;
            parser.offset = parser.nextNonspace + fenceLength;
            return 2;
        } else {
            return 0;
        }
    },

    // HTML block
    function(parser) {
        if (!parser.indented &&
            reHtmlBlockOpen.test(parser.currentLine.slice(parser.nextNonspace))) {
            parser.closeUnmatchedBlocks();
            parser.addChild('HtmlBlock', parser.offset);
            // don't adjust parser.offset; spaces are part of block
            return 2;
        } else {
            return 0;
        }
    },

    // Setext header
    function(parser, container) {
        var match;
        if (!parser.indented &&
            container.type === 'Paragraph' &&
                   (container._string_content.indexOf('\n') ===
                      container._string_content.length - 1) &&
                   ((match = parser.currentLine.slice(parser.nextNonspace).match(reSetextHeaderLine)))) {
            parser.closeUnmatchedBlocks();
            var header = new Node('Header', container.sourcepos);
            header.level = match[0][0] === '=' ? 1 : 2;
            header._string_content = container._string_content;
            container.insertAfter(header);
            container.unlink();
            parser.tip = header;
            parser.offset = parser.currentLine.length;
            return 2;
        } else {
            return 0;
        }
    },

    // hrule
    function(parser) {
        if (!parser.indented &&
            reHrule.test(parser.currentLine.slice(parser.nextNonspace))) {
            parser.closeUnmatchedBlocks();
            parser.addChild('HorizontalRule', parser.nextNonspace);
            parser.offset = parser.currentLine.length;
            return 2;
        } else {
            return 0;
        }
    },

    // list item
    function(parser, container) {
        var data;
        if ((data = parseListMarker(parser.currentLine,
                                    parser.nextNonspace, parser.indent))) {
            parser.closeUnmatchedBlocks();
            if (parser.indented && parser.tip.type !== 'List') {
                return 0;
            }
            parser.offset = parser.nextNonspace + data.padding;

            // add the list if needed
            if (parser.tip.type !== 'List' ||
                !(listsMatch(container._listData, data))) {
                container = parser.addChild('List', parser.nextNonspace);
                container._listData = data;
            }

            // add the list item
            container = parser.addChild('Item', parser.nextNonspace);
            container._listData = data;
            return 1;
        } else {
            return 0;
        }
    },

    // indented code block
    function(parser) {
        if (parser.indented &&
            parser.tip.type !== 'Paragraph' &&
            !parser.blank) {
            // indented code
            parser.offset += CODE_INDENT;
            parser.closeUnmatchedBlocks();
            parser.addChild('CodeBlock', parser.offset);
            return 2;
        } else {
            return 0;
        }
     }

];

var findNextNonspace = function() {
    var currentLine = this.currentLine;
    var match = currentLine.slice(this.offset).match(reNonSpace);
    if (match === null) {
        this.nextNonspace = currentLine.length;
        this.blank = true;
    } else {
        this.nextNonspace = this.offset + match.index;
        this.blank = false;
    }
    this.indent = this.nextNonspace - this.offset;
    this.indented = this.indent >= CODE_INDENT;
};

// Analyze a line of text and update the document appropriately.
// We parse markdown text by calling this on each line of input,
// then finalizing the document.
var incorporateLine = function(ln) {
    var all_matched = true;
    var t;

    var container = this.doc;
    this.oldtip = this.tip;
    this.offset = 0;
    this.lineNumber += 1;

    // replace NUL characters for security
    if (ln.indexOf('\u0000') !== -1) {
        ln = ln.replace(/\0/g, '\uFFFD');
    }

    // Convert tabs to spaces:
    ln = detabLine(ln);
    this.currentLine = ln;

    // For each containing block, try to parse the associated line start.
    // Bail out on failure: container will point to the last matching block.
    // Set all_matched to false if not all containers match.
    var lastChild;
    while ((lastChild = container._lastChild) && lastChild._open) {
        container = lastChild;

        this.findNextNonspace();

        switch (this.blocks[container.type].continue(this, container)) {
        case 0: // we've matched, keep going
            break;
        case 1: // we've failed to match a block
            all_matched = false;
            break;
        case 2: // we've hit end of line for fenced code close and can return
            this.lastLineLength = ln.length;
            return;
        default:
            throw 'continue returned illegal value, must be 0, 1, or 2';
        }
        if (!all_matched) {
            container = container._parent; // back up to last matching block
            break;
        }
    }

    this.allClosed = (container === this.oldtip);
    this.lastMatchedContainer = container;

    // Check to see if we've hit 2nd blank line; if so break out of list:
    if (this.blank && container._lastLineBlank) {
        this.breakOutOfLists(container);
    }

    var matchedLeaf = container.type !== 'Paragraph' &&
            blocks[container.type].acceptsLines;
    var starts = this.blockStarts;
    var startsLen = starts.length;
    // Unless last matched container is a code block, try new container starts,
    // adding children to the last matched container:
    while (!matchedLeaf) {

        this.findNextNonspace();

        // this is a little performance optimization:
        if (!this.indented &&
            !reMaybeSpecial.test(ln.slice(this.nextNonspace))) {
            this.offset = this.nextNonspace;
            break;
        }

        var i = 0;
        while (i < startsLen) {
            var res = starts[i](this, container);
            if (res === 1) {
                container = this.tip;
                break;
            } else if (res === 2) {
                container = this.tip;
                matchedLeaf = true;
                break;
            } else {
                i++;
            }
        }

        if (i === startsLen) { // nothing matched
            this.offset = this.nextNonspace;
            break;
        }
    }

    // What remains at the offset is a text line.  Add the text to the
    // appropriate container.

   // First check for a lazy paragraph continuation:
    if (!this.allClosed && !this.blank &&
        this.tip.type === 'Paragraph') {
        // lazy paragraph continuation
        this.addLine();

    } else { // not a lazy continuation

        // finalize any blocks not matched
        this.closeUnmatchedBlocks();
        if (this.blank && container.lastChild) {
            container.lastChild._lastLineBlank = true;
        }

        t = container.type;

        // Block quote lines are never blank as they start with >
        // and we don't count blanks in fenced code for purposes of tight/loose
        // lists or breaking out of lists.  We also don't set _lastLineBlank
        // on an empty list item, or if we just closed a fenced block.
        var lastLineBlank = this.blank &&
            !(t === 'BlockQuote' ||
              (t === 'CodeBlock' && container._isFenced) ||
              (t === 'Item' &&
               !container._firstChild &&
               container.sourcepos[0][0] === this.lineNumber));

        // propagate lastLineBlank up through parents:
        var cont = container;
        while (cont) {
            cont._lastLineBlank = lastLineBlank;
            cont = cont._parent;
        }

        if (this.blocks[t].acceptsLines) {
            this.addLine();
        } else if (this.offset < ln.length && !this.blank) {
            // create paragraph container for line
            container = this.addChild('Paragraph', this.offset);
            this.offset = this.nextNonspace;
            this.addLine();
        }
    }
    this.lastLineLength = ln.length;
};

// Finalize a block.  Close it and do any necessary postprocessing,
// e.g. creating string_content from strings, setting the 'tight'
// or 'loose' status of a list, and parsing the beginnings
// of paragraphs for reference definitions.  Reset the tip to the
// parent of the closed block.
var finalize = function(block, lineNumber) {
    var above = block._parent;
    block._open = false;
    block.sourcepos[1] = [lineNumber, this.lastLineLength];

    this.blocks[block.type].finalize(this, block);

    this.tip = above;
};

// Walk through a block & children recursively, parsing string content
// into inline content where appropriate.
var processInlines = function(block) {
    var node, event, t;
    var walker = block.walker();
    this.inlineParser.refmap = this.refmap;
    while ((event = walker.next())) {
        node = event.node;
        t = node.type;
        if (!event.entering && (t === 'Paragraph' || t === 'Header')) {
            this.inlineParser.parse(node);
        }
    }
};

var Document = function() {
    var doc = new Node('Document', [[1, 1], [0, 0]]);
    return doc;
};

// The main parsing function.  Returns a parsed document AST.
var parse = function(input) {
    this.doc = new Document();
    this.tip = this.doc;
    this.refmap = {};
    this.lineNumber = 0;
    this.lastLineLength = 0;
    this.offset = 0;
    this.lastMatchedContainer = this.doc;
    this.currentLine = "";
    if (this.options.time) { console.time("preparing input"); }
    var lines = input.split(reLineEnding);
    var len = lines.length;
    if (input.charCodeAt(input.length - 1) === C_NEWLINE) {
        // ignore last blank line created by final newline
        len -= 1;
    }
    if (this.options.time) { console.timeEnd("preparing input"); }
    if (this.options.time) { console.time("block parsing"); }
    for (var i = 0; i < len; i++) {
        this.incorporateLine(lines[i]);
    }
    while (this.tip) {
        this.finalize(this.tip, len);
    }
    if (this.options.time) { console.timeEnd("block parsing"); }
    if (this.options.time) { console.time("inline parsing"); }
    this.processInlines(this.doc);
    if (this.options.time) { console.timeEnd("inline parsing"); }
    return this.doc;
};


// The Parser object.
function Parser(options){
    return {
        doc: new Document(),
        blocks: blocks,
        blockStarts: blockStarts,
        tip: this.doc,
        oldtip: this.doc,
        currentLine: "",
        lineNumber: 0,
        offset: 0,
        nextNonspace: 0,
        indent: 0,
        indented: false,
        blank: false,
        allClosed: true,
        lastMatchedContainer: this.doc,
        refmap: {},
        lastLineLength: 0,
        inlineParser: new InlineParser(options),
        findNextNonspace: findNextNonspace,
        breakOutOfLists: breakOutOfLists,
        addLine: addLine,
        addChild: addChild,
        incorporateLine: incorporateLine,
        finalize: finalize,
        processInlines: processInlines,
        closeUnmatchedBlocks: closeUnmatchedBlocks,
        parse: parse,
        options: options || {}
    };
}

module.exports = Parser;

},{"./common":115,"./inlines":122,"./node":123}],115:[function(require,module,exports){
"use strict";

var encode = require('./encode');
var decode = require('./decode');

var C_BACKSLASH = 92;

var entityToChar = require('./html5-entities.js').entityToChar;

var ENTITY = "&(?:#x[a-f0-9]{1,8}|#[0-9]{1,8}|[a-z][a-z0-9]{1,31});";

var reBackslashOrAmp = /[\\&]/;

var ESCAPABLE = '[!"#$%&\'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]';

var reEntityOrEscapedChar = new RegExp('\\\\' + ESCAPABLE + '|' + ENTITY, 'gi');

var XMLSPECIAL = '[&<>"]';

var reXmlSpecial = new RegExp(XMLSPECIAL, 'g');

var reXmlSpecialOrEntity = new RegExp(ENTITY + '|' + XMLSPECIAL, 'gi');

var unescapeChar = function(s) {
    if (s.charCodeAt(0) === C_BACKSLASH) {
        return s.charAt(1);
    } else {
        return entityToChar(s);
    }
};

// Replace entities and backslash escapes with literal characters.
var unescapeString = function(s) {
    if (reBackslashOrAmp.test(s)) {
        return s.replace(reEntityOrEscapedChar, unescapeChar);
    } else {
        return s;
    }
};

var normalizeURI = function(uri) {
    try {
        return encode(decode(uri));
    }
    catch(err) {
        return uri;
    }
};

var replaceUnsafeChar = function(s) {
    switch (s) {
    case '&':
        return '&amp;';
    case '<':
        return '&lt;';
    case '>':
        return '&gt;';
    case '"':
        return '&quot;';
    default:
        return s;
    }
};

var escapeXml = function(s, preserve_entities) {
    if (reXmlSpecial.test(s)) {
        if (preserve_entities) {
            return s.replace(reXmlSpecialOrEntity, replaceUnsafeChar);
        } else {
            return s.replace(reXmlSpecial, replaceUnsafeChar);
        }
    } else {
        return s;
    }
};

module.exports = { unescapeString: unescapeString,
                   normalizeURI: normalizeURI,
                   escapeXml: escapeXml,
                   ENTITY: ENTITY,
                   ESCAPABLE: ESCAPABLE
                 };

},{"./decode":116,"./encode":117,"./html5-entities.js":120}],116:[function(require,module,exports){
// from https://github.com/markdown-it/mdurl
// Copyright (c) 2015 Vitaly Puzrin, Alex Kocharin, MIT license.

'use strict';


/* eslint-disable no-bitwise */

var decodeCache = {};

function getDecodeCache(exclude) {
  var i, ch, cache = decodeCache[exclude];
  if (cache) { return cache; }

  cache = decodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);
    cache.push(ch);
  }

  for (i = 0; i < exclude.length; i++) {
    ch = exclude.charCodeAt(i);
    cache[ch] = '%' + ('0' + ch.toString(16).toUpperCase()).slice(-2);
  }

  return cache;
}


// Decode percent-encoded string.
//
function decode(string, exclude) {
  var cache;

  if (typeof exclude !== 'string') {
    exclude = decode.defaultChars;
  }

  cache = getDecodeCache(exclude);

  return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
    var i, l, b1, b2, b3, b4, char,
        result = '';

    for (i = 0, l = seq.length; i < l; i += 3) {
      b1 = parseInt(seq.slice(i + 1, i + 3), 16);

      if (b1 < 0x80) {
        result += cache[b1];
        continue;
      }

      if ((b1 & 0xE0) === 0xC0 && (i + 3 < l)) {
        // 110xxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);

        if ((b2 & 0xC0) === 0x80) {
          char = ((b1 << 6) & 0x7C0) | (b2 & 0x3F);

          if (char < 0x80) {
            result += '\ufffd\ufffd';
          } else {
            result += String.fromCharCode(char);
          }

          i += 3;
          continue;
        }
      }

      if ((b1 & 0xF0) === 0xE0 && (i + 6 < l)) {
        // 1110xxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
          char = ((b1 << 12) & 0xF000) | ((b2 << 6) & 0xFC0) | (b3 & 0x3F);

          if (char < 0x800 || (char >= 0xD800 && char <= 0xDFFF)) {
            result += '\ufffd\ufffd\ufffd';
          } else {
            result += String.fromCharCode(char);
          }

          i += 6;
          continue;
        }
      }

      if ((b1 & 0xF8) === 0xF0 && (i + 9 < l)) {
        // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        b4 = parseInt(seq.slice(i + 10, i + 12), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
          char = ((b1 << 18) & 0x1C0000) | ((b2 << 12) & 0x3F000) | ((b3 << 6) & 0xFC0) | (b4 & 0x3F);

          if (char < 0x10000 || char > 0x10FFFF) {
            result += '\ufffd\ufffd\ufffd\ufffd';
          } else {
            char -= 0x10000;
            result += String.fromCharCode(0xD800 + (char >> 10), 0xDC00 + (char & 0x3FF));
          }

          i += 9;
          continue;
        }
      }

      result += '\ufffd';
    }

    return result;
  });
}


decode.defaultChars = ';/?:@&=+$,#';
decode.componentChars = '';


module.exports = decode;

},{}],117:[function(require,module,exports){
// from https://github.com/markdown-it/mdurl
// Copyright (c) 2015 Vitaly Puzrin, Alex Kocharin, MIT license.

'use strict';


var encodeCache = {};


// Create a lookup array where anything but characters in `chars` string
// and alphanumeric chars is percent-encoded.
//
function getEncodeCache(exclude) {
  var i, ch, cache = encodeCache[exclude];
  if (cache) { return cache; }

  cache = encodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);

    if (/^[0-9a-z]$/i.test(ch)) {
      // always allow unencoded alphanumeric characters
      cache.push(ch);
    } else {
      cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
    }
  }

  for (i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }

  return cache;
}


// Encode unsafe characters with percent-encoding, skipping already
// encoded sequences.
//
//  - string       - string to encode
//  - exclude      - list of characters to ignore (in addition to a-zA-Z0-9)
//  - keepEscaped  - don't encode '%' in a correct escape sequence (default: true)
//
function encode(string, exclude, keepEscaped) {
  var i, l, code, nextCode, cache,
      result = '';

  if (typeof exclude !== 'string') {
    // encode(string, keepEscaped)
    keepEscaped = exclude;
    exclude = encode.defaultChars;
  }

  if (typeof keepEscaped === 'undefined') {
    keepEscaped = true;
  }

  cache = getEncodeCache(exclude);

  for (i = 0, l = string.length; i < l; i++) {
    code = string.charCodeAt(i);

    if (keepEscaped && code === 0x25 && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }

    if (code < 128) {
      result += cache[code];
      continue;
    }

    if (code >= 0xD800 && code <= 0xDFFF) {
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
        nextCode = string.charCodeAt(i + 1);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }
      result += '%EF%BF%BD';
      continue;
    }

    result += encodeURIComponent(string[i]);
  }

  return result;
}

encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
encode.componentChars = "-_.!~*'()";


module.exports = encode;

},{}],118:[function(require,module,exports){
"use strict";

// derived from https://github.com/mathiasbynens/String.fromCodePoint
/*! http://mths.be/fromcodepoint v0.2.1 by @mathias */
if (String.fromCodePoint) {
    module.exports = function (_) {
        try {
            return String.fromCodePoint(_);
        } catch (e) {
            if (e instanceof RangeError) {
                return String.fromCharCode(0xFFFD);
            }
            throw e;
        }
    };

} else {

  var stringFromCharCode = String.fromCharCode;
  var floor = Math.floor;
  var fromCodePoint = function() {
      var MAX_SIZE = 0x4000;
      var codeUnits = [];
      var highSurrogate;
      var lowSurrogate;
      var index = -1;
      var length = arguments.length;
      if (!length) {
          return '';
      }
      var result = '';
      while (++index < length) {
          var codePoint = Number(arguments[index]);
          if (
              !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                  codePoint < 0 || // not a valid Unicode code point
                  codePoint > 0x10FFFF || // not a valid Unicode code point
                  floor(codePoint) !== codePoint // not an integer
          ) {
              return String.fromCharCode(0xFFFD);
          }
          if (codePoint <= 0xFFFF) { // BMP code point
              codeUnits.push(codePoint);
          } else { // Astral code point; split in surrogate halves
              // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
              codePoint -= 0x10000;
              highSurrogate = (codePoint >> 10) + 0xD800;
              lowSurrogate = (codePoint % 0x400) + 0xDC00;
              codeUnits.push(highSurrogate, lowSurrogate);
          }
          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
              result += stringFromCharCode.apply(null, codeUnits);
              codeUnits.length = 0;
          }
      }
      return result;
  };
  module.exports = fromCodePoint;
}

},{}],119:[function(require,module,exports){
"use strict";

var escapeXml = require('./common').escapeXml;

// Helper function to produce an HTML tag.
var tag = function(name, attrs, selfclosing) {
    var result = '<' + name;
    if (attrs && attrs.length > 0) {
        var i = 0;
        var attrib;
        while ((attrib = attrs[i]) !== undefined) {
            result += ' ' + attrib[0] + '="' + attrib[1] + '"';
            i++;
        }
    }
    if (selfclosing) {
        result += ' /';
    }

    result += '>';
    return result;
};

var reHtmlTag = /\<[^>]*\>/;

var renderNodes = function(block) {

    var attrs;
    var info_words;
    var tagname;
    var walker = block.walker();
    var event, node, entering;
    var buffer = "";
    var lastOut = "\n";
    var disableTags = 0;
    var grandparent;
    var out = function(s) {
        if (disableTags > 0) {
            buffer += s.replace(reHtmlTag, '');
        } else {
            buffer += s;
        }
        lastOut = s;
    };
    var esc = this.escape;
    var cr = function() {
        if (lastOut !== '\n') {
            buffer += '\n';
            lastOut = '\n';
        }
    };

    var options = this.options;

    if (options.time) { console.time("rendering"); }

    while ((event = walker.next())) {
        entering = event.entering;
        node = event.node;

        attrs = [];
        if (options.sourcepos) {
            var pos = node.sourcepos;
            if (pos) {
                attrs.push(['data-sourcepos', String(pos[0][0]) + ':' +
                            String(pos[0][1]) + '-' + String(pos[1][0]) + ':' +
                            String(pos[1][1])]);
            }
        }

        switch (node.type) {
        case 'Text':
            out(esc(node.literal, false));
            break;

        case 'Softbreak':
            out(this.softbreak);
            break;

        case 'Hardbreak':
            out(tag('br', [], true));
            cr();
            break;

        case 'Emph':
            out(tag(entering ? 'em' : '/em'));
            break;

        case 'Strong':
            out(tag(entering ? 'strong' : '/strong'));
            break;

        case 'Html':
            out(node.literal);
            break;

        case 'Link':
            if (entering) {
                attrs.push(['href', esc(node.destination, true)]);
                if (node.title) {
                    attrs.push(['title', esc(node.title, true)]);
                }
                out(tag('a', attrs));
            } else {
                out(tag('/a'));
            }
            break;

        case 'Image':
            if (entering) {
                if (disableTags === 0) {
                    out('<img src="' + esc(node.destination, true) +
                        '" alt="');
                }
                disableTags += 1;
            } else {
                disableTags -= 1;
                if (disableTags === 0) {
                    if (node.title) {
                        out('" title="' + esc(node.title, true));
                    }
                    out('" />');
                }
            }
            break;

        case 'Code':
            out(tag('code') + esc(node.literal, false) + tag('/code'));
            break;

        case 'Document':
            break;

        case 'Paragraph':
            grandparent = node.parent.parent;
            if (grandparent !== null &&
                grandparent.type === 'List') {
                if (grandparent.listTight) {
                    break;
                }
            }
            if (entering) {
                cr();
                out(tag('p', attrs));
            } else {
                out(tag('/p'));
                cr();
            }
            break;

        case 'BlockQuote':
            if (entering) {
                cr();
                out(tag('blockquote', attrs));
                cr();
            } else {
                cr();
                out(tag('/blockquote'));
                cr();
            }
            break;

        case 'Item':
            if (entering) {
                out(tag('li', attrs));
            } else {
                out(tag('/li'));
                cr();
            }
            break;

        case 'List':
            tagname = node.listType === 'Bullet' ? 'ul' : 'ol';
            if (entering) {
                var start = node.listStart;
                if (start !== null && start !== 1) {
                    attrs.push(['start', start.toString()]);
                }
                cr();
                out(tag(tagname, attrs));
                cr();
            } else {
                cr();
                out(tag('/' + tagname));
                cr();
            }
            break;

        case 'Header':
            tagname = 'h' + node.level;
            if (entering) {
                cr();
                out(tag(tagname, attrs));
            } else {
                out(tag('/' + tagname));
                cr();
            }
            break;

        case 'CodeBlock':
            info_words = node.info ? node.info.split(/ +/) : [];
            if (info_words.length > 0 && info_words[0].length > 0) {
                attrs.push(['class', 'language-' + esc(info_words[0], true)]);
            }
            cr();
            out(tag('pre') + tag('code', attrs));
            out(esc(node.literal, false));
            out(tag('/code') + tag('/pre'));
            cr();
            break;

        case 'HtmlBlock':
            cr();
            out(node.literal);
            cr();
            break;

        case 'HorizontalRule':
            cr();
            out(tag('hr', attrs, true));
            cr();
            break;

        default:
            throw "Unknown node type " + node.type;
        }

    }
    if (options.time) { console.timeEnd("rendering"); }
    return buffer;
};

// The HtmlRenderer object.
function HtmlRenderer(options){
    return {
        // default options:
        softbreak: '\n', // by default, soft breaks are rendered as newlines in HTML
        // set to "<br />" to make them hard breaks
        // set to " " if you want to ignore line wrapping in source
        escape: escapeXml,
        options: options || {},
        render: renderNodes
    };
}

module.exports = HtmlRenderer;

},{"./common":115}],120:[function(require,module,exports){
"use strict";

var fromCodePoint = require('./from-code-point');

var entities = {
  AAacute: 193,
  aacute: 225,
  Abreve: 258,
  abreve: 259,
  ac: 8766,
  acd: 8767,
  acE: 8766,
  Acirc: 194,
  acirc: 226,
  acute: 180,
  Acy: 1040,
  acy: 1072,
  AElig: 198,
  aelig: 230,
  af: 8289,
  Afr: 55349,
  afr: 55349,
  Agrave: 192,
  agrave: 224,
  alefsym: 8501,
  aleph: 8501,
  Alpha: 913,
  alpha: 945,
  Amacr: 256,
  amacr: 257,
  amalg: 10815,
  amp: 38,
  AMP: 38,
  andand: 10837,
  And: 10835,
  and: 8743,
  andd: 10844,
  andslope: 10840,
  andv: 10842,
  ang: 8736,
  ange: 10660,
  angle: 8736,
  angmsdaa: 10664,
  angmsdab: 10665,
  angmsdac: 10666,
  angmsdad: 10667,
  angmsdae: 10668,
  angmsdaf: 10669,
  angmsdag: 10670,
  angmsdah: 10671,
  angmsd: 8737,
  angrt: 8735,
  angrtvb: 8894,
  angrtvbd: 10653,
  angsph: 8738,
  angst: 197,
  angzarr: 9084,
  Aogon: 260,
  aogon: 261,
  Aopf: 55349,
  aopf: 55349,
  apacir: 10863,
  ap: 8776,
  apE: 10864,
  ape: 8778,
  apid: 8779,
  apos: 39,
  ApplyFunction: 8289,
  approx: 8776,
  approxeq: 8778,
  Aring: 197,
  aring: 229,
  Ascr: 55349,
  ascr: 55349,
  Assign: 8788,
  ast: 42,
  asymp: 8776,
  asympeq: 8781,
  Atilde: 195,
  atilde: 227,
  Auml: 196,
  auml: 228,
  awconint: 8755,
  awint: 10769,
  backcong: 8780,
  backepsilon: 1014,
  backprime: 8245,
  backsim: 8765,
  backsimeq: 8909,
  Backslash: 8726,
  Barv: 10983,
  barvee: 8893,
  barwed: 8965,
  Barwed: 8966,
  barwedge: 8965,
  bbrk: 9141,
  bbrktbrk: 9142,
  bcong: 8780,
  Bcy: 1041,
  bcy: 1073,
  bdquo: 8222,
  becaus: 8757,
  because: 8757,
  Because: 8757,
  bemptyv: 10672,
  bepsi: 1014,
  bernou: 8492,
  Bernoullis: 8492,
  Beta: 914,
  beta: 946,
  beth: 8502,
  between: 8812,
  Bfr: 55349,
  bfr: 55349,
  bigcap: 8898,
  bigcirc: 9711,
  bigcup: 8899,
  bigodot: 10752,
  bigoplus: 10753,
  bigotimes: 10754,
  bigsqcup: 10758,
  bigstar: 9733,
  bigtriangledown: 9661,
  bigtriangleup: 9651,
  biguplus: 10756,
  bigvee: 8897,
  bigwedge: 8896,
  bkarow: 10509,
  blacklozenge: 10731,
  blacksquare: 9642,
  blacktriangle: 9652,
  blacktriangledown: 9662,
  blacktriangleleft: 9666,
  blacktriangleright: 9656,
  blank: 9251,
  blk12: 9618,
  blk14: 9617,
  blk34: 9619,
  block: 9608,
  bne: 61,
  bnequiv: 8801,
  bNot: 10989,
  bnot: 8976,
  Bopf: 55349,
  bopf: 55349,
  bot: 8869,
  bottom: 8869,
  bowtie: 8904,
  boxbox: 10697,
  boxdl: 9488,
  boxdL: 9557,
  boxDl: 9558,
  boxDL: 9559,
  boxdr: 9484,
  boxdR: 9554,
  boxDr: 9555,
  boxDR: 9556,
  boxh: 9472,
  boxH: 9552,
  boxhd: 9516,
  boxHd: 9572,
  boxhD: 9573,
  boxHD: 9574,
  boxhu: 9524,
  boxHu: 9575,
  boxhU: 9576,
  boxHU: 9577,
  boxminus: 8863,
  boxplus: 8862,
  boxtimes: 8864,
  boxul: 9496,
  boxuL: 9563,
  boxUl: 9564,
  boxUL: 9565,
  boxur: 9492,
  boxuR: 9560,
  boxUr: 9561,
  boxUR: 9562,
  boxv: 9474,
  boxV: 9553,
  boxvh: 9532,
  boxvH: 9578,
  boxVh: 9579,
  boxVH: 9580,
  boxvl: 9508,
  boxvL: 9569,
  boxVl: 9570,
  boxVL: 9571,
  boxvr: 9500,
  boxvR: 9566,
  boxVr: 9567,
  boxVR: 9568,
  bprime: 8245,
  breve: 728,
  Breve: 728,
  brvbar: 166,
  bscr: 55349,
  Bscr: 8492,
  bsemi: 8271,
  bsim: 8765,
  bsime: 8909,
  bsolb: 10693,
  bsol: 92,
  bsolhsub: 10184,
  bull: 8226,
  bullet: 8226,
  bump: 8782,
  bumpE: 10926,
  bumpe: 8783,
  Bumpeq: 8782,
  bumpeq: 8783,
  Cacute: 262,
  cacute: 263,
  capand: 10820,
  capbrcup: 10825,
  capcap: 10827,
  cap: 8745,
  Cap: 8914,
  capcup: 10823,
  capdot: 10816,
  CapitalDifferentialD: 8517,
  caps: 8745,
  caret: 8257,
  caron: 711,
  Cayleys: 8493,
  ccaps: 10829,
  Ccaron: 268,
  ccaron: 269,
  Ccedil: 199,
  ccedil: 231,
  Ccirc: 264,
  ccirc: 265,
  Cconint: 8752,
  ccups: 10828,
  ccupssm: 10832,
  Cdot: 266,
  cdot: 267,
  cedil: 184,
  Cedilla: 184,
  cemptyv: 10674,
  cent: 162,
  centerdot: 183,
  CenterDot: 183,
  cfr: 55349,
  Cfr: 8493,
  CHcy: 1063,
  chcy: 1095,
  check: 10003,
  checkmark: 10003,
  Chi: 935,
  chi: 967,
  circ: 710,
  circeq: 8791,
  circlearrowleft: 8634,
  circlearrowright: 8635,
  circledast: 8859,
  circledcirc: 8858,
  circleddash: 8861,
  CircleDot: 8857,
  circledR: 174,
  circledS: 9416,
  CircleMinus: 8854,
  CirclePlus: 8853,
  CircleTimes: 8855,
  cir: 9675,
  cirE: 10691,
  cire: 8791,
  cirfnint: 10768,
  cirmid: 10991,
  cirscir: 10690,
  ClockwiseContourIntegral: 8754,
  CloseCurlyDoubleQuote: 8221,
  CloseCurlyQuote: 8217,
  clubs: 9827,
  clubsuit: 9827,
  colon: 58,
  Colon: 8759,
  Colone: 10868,
  colone: 8788,
  coloneq: 8788,
  comma: 44,
  commat: 64,
  comp: 8705,
  compfn: 8728,
  complement: 8705,
  complexes: 8450,
  cong: 8773,
  congdot: 10861,
  Congruent: 8801,
  conint: 8750,
  Conint: 8751,
  ContourIntegral: 8750,
  copf: 55349,
  Copf: 8450,
  coprod: 8720,
  Coproduct: 8720,
  copy: 169,
  COPY: 169,
  copysr: 8471,
  CounterClockwiseContourIntegral: 8755,
  crarr: 8629,
  cross: 10007,
  Cross: 10799,
  Cscr: 55349,
  cscr: 55349,
  csub: 10959,
  csube: 10961,
  csup: 10960,
  csupe: 10962,
  ctdot: 8943,
  cudarrl: 10552,
  cudarrr: 10549,
  cuepr: 8926,
  cuesc: 8927,
  cularr: 8630,
  cularrp: 10557,
  cupbrcap: 10824,
  cupcap: 10822,
  CupCap: 8781,
  cup: 8746,
  Cup: 8915,
  cupcup: 10826,
  cupdot: 8845,
  cupor: 10821,
  cups: 8746,
  curarr: 8631,
  curarrm: 10556,
  curlyeqprec: 8926,
  curlyeqsucc: 8927,
  curlyvee: 8910,
  curlywedge: 8911,
  curren: 164,
  curvearrowleft: 8630,
  curvearrowright: 8631,
  cuvee: 8910,
  cuwed: 8911,
  cwconint: 8754,
  cwint: 8753,
  cylcty: 9005,
  dagger: 8224,
  Dagger: 8225,
  daleth: 8504,
  darr: 8595,
  Darr: 8609,
  dArr: 8659,
  dash: 8208,
  Dashv: 10980,
  dashv: 8867,
  dbkarow: 10511,
  dblac: 733,
  Dcaron: 270,
  dcaron: 271,
  Dcy: 1044,
  dcy: 1076,
  ddagger: 8225,
  ddarr: 8650,
  DD: 8517,
  dd: 8518,
  DDotrahd: 10513,
  ddotseq: 10871,
  deg: 176,
  Del: 8711,
  Delta: 916,
  delta: 948,
  demptyv: 10673,
  dfisht: 10623,
  Dfr: 55349,
  dfr: 55349,
  dHar: 10597,
  dharl: 8643,
  dharr: 8642,
  DiacriticalAcute: 180,
  DiacriticalDot: 729,
  DiacriticalDoubleAcute: 733,
  DiacriticalGrave: 96,
  DiacriticalTilde: 732,
  diam: 8900,
  diamond: 8900,
  Diamond: 8900,
  diamondsuit: 9830,
  diams: 9830,
  die: 168,
  DifferentialD: 8518,
  digamma: 989,
  disin: 8946,
  div: 247,
  divide: 247,
  divideontimes: 8903,
  divonx: 8903,
  DJcy: 1026,
  djcy: 1106,
  dlcorn: 8990,
  dlcrop: 8973,
  dollar: 36,
  Dopf: 55349,
  dopf: 55349,
  Dot: 168,
  dot: 729,
  DotDot: 8412,
  doteq: 8784,
  doteqdot: 8785,
  DotEqual: 8784,
  dotminus: 8760,
  dotplus: 8724,
  dotsquare: 8865,
  doublebarwedge: 8966,
  DoubleContourIntegral: 8751,
  DoubleDot: 168,
  DoubleDownArrow: 8659,
  DoubleLeftArrow: 8656,
  DoubleLeftRightArrow: 8660,
  DoubleLeftTee: 10980,
  DoubleLongLeftArrow: 10232,
  DoubleLongLeftRightArrow: 10234,
  DoubleLongRightArrow: 10233,
  DoubleRightArrow: 8658,
  DoubleRightTee: 8872,
  DoubleUpArrow: 8657,
  DoubleUpDownArrow: 8661,
  DoubleVerticalBar: 8741,
  DownArrowBar: 10515,
  downarrow: 8595,
  DownArrow: 8595,
  Downarrow: 8659,
  DownArrowUpArrow: 8693,
  DownBreve: 785,
  downdownarrows: 8650,
  downharpoonleft: 8643,
  downharpoonright: 8642,
  DownLeftRightVector: 10576,
  DownLeftTeeVector: 10590,
  DownLeftVectorBar: 10582,
  DownLeftVector: 8637,
  DownRightTeeVector: 10591,
  DownRightVectorBar: 10583,
  DownRightVector: 8641,
  DownTeeArrow: 8615,
  DownTee: 8868,
  drbkarow: 10512,
  drcorn: 8991,
  drcrop: 8972,
  Dscr: 55349,
  dscr: 55349,
  DScy: 1029,
  dscy: 1109,
  dsol: 10742,
  Dstrok: 272,
  dstrok: 273,
  dtdot: 8945,
  dtri: 9663,
  dtrif: 9662,
  duarr: 8693,
  duhar: 10607,
  dwangle: 10662,
  DZcy: 1039,
  dzcy: 1119,
  dzigrarr: 10239,
  Eacute: 201,
  eacute: 233,
  easter: 10862,
  Ecaron: 282,
  ecaron: 283,
  Ecirc: 202,
  ecirc: 234,
  ecir: 8790,
  ecolon: 8789,
  Ecy: 1069,
  ecy: 1101,
  eDDot: 10871,
  Edot: 278,
  edot: 279,
  eDot: 8785,
  ee: 8519,
  efDot: 8786,
  Efr: 55349,
  efr: 55349,
  eg: 10906,
  Egrave: 200,
  egrave: 232,
  egs: 10902,
  egsdot: 10904,
  el: 10905,
  Element: 8712,
  elinters: 9191,
  ell: 8467,
  els: 10901,
  elsdot: 10903,
  Emacr: 274,
  emacr: 275,
  empty: 8709,
  emptyset: 8709,
  EmptySmallSquare: 9723,
  emptyv: 8709,
  EmptyVerySmallSquare: 9643,
  emsp13: 8196,
  emsp14: 8197,
  emsp: 8195,
  ENG: 330,
  eng: 331,
  ensp: 8194,
  Eogon: 280,
  eogon: 281,
  Eopf: 55349,
  eopf: 55349,
  epar: 8917,
  eparsl: 10723,
  eplus: 10865,
  epsi: 949,
  Epsilon: 917,
  epsilon: 949,
  epsiv: 1013,
  eqcirc: 8790,
  eqcolon: 8789,
  eqsim: 8770,
  eqslantgtr: 10902,
  eqslantless: 10901,
  Equal: 10869,
  equals: 61,
  EqualTilde: 8770,
  equest: 8799,
  Equilibrium: 8652,
  equiv: 8801,
  equivDD: 10872,
  eqvparsl: 10725,
  erarr: 10609,
  erDot: 8787,
  escr: 8495,
  Escr: 8496,
  esdot: 8784,
  Esim: 10867,
  esim: 8770,
  Eta: 919,
  eta: 951,
  ETH: 208,
  eth: 240,
  Euml: 203,
  euml: 235,
  euro: 8364,
  excl: 33,
  exist: 8707,
  Exists: 8707,
  expectation: 8496,
  exponentiale: 8519,
  ExponentialE: 8519,
  fallingdotseq: 8786,
  Fcy: 1060,
  fcy: 1092,
  female: 9792,
  ffilig: 64259,
  fflig: 64256,
  ffllig: 64260,
  Ffr: 55349,
  ffr: 55349,
  filig: 64257,
  FilledSmallSquare: 9724,
  FilledVerySmallSquare: 9642,
  fjlig: 102,
  flat: 9837,
  fllig: 64258,
  fltns: 9649,
  fnof: 402,
  Fopf: 55349,
  fopf: 55349,
  forall: 8704,
  ForAll: 8704,
  fork: 8916,
  forkv: 10969,
  Fouriertrf: 8497,
  fpartint: 10765,
  frac12: 189,
  frac13: 8531,
  frac14: 188,
  frac15: 8533,
  frac16: 8537,
  frac18: 8539,
  frac23: 8532,
  frac25: 8534,
  frac34: 190,
  frac35: 8535,
  frac38: 8540,
  frac45: 8536,
  frac56: 8538,
  frac58: 8541,
  frac78: 8542,
  frasl: 8260,
  frown: 8994,
  fscr: 55349,
  Fscr: 8497,
  gacute: 501,
  Gamma: 915,
  gamma: 947,
  Gammad: 988,
  gammad: 989,
  gap: 10886,
  Gbreve: 286,
  gbreve: 287,
  Gcedil: 290,
  Gcirc: 284,
  gcirc: 285,
  Gcy: 1043,
  gcy: 1075,
  Gdot: 288,
  gdot: 289,
  ge: 8805,
  gE: 8807,
  gEl: 10892,
  gel: 8923,
  geq: 8805,
  geqq: 8807,
  geqslant: 10878,
  gescc: 10921,
  ges: 10878,
  gesdot: 10880,
  gesdoto: 10882,
  gesdotol: 10884,
  gesl: 8923,
  gesles: 10900,
  Gfr: 55349,
  gfr: 55349,
  gg: 8811,
  Gg: 8921,
  ggg: 8921,
  gimel: 8503,
  GJcy: 1027,
  gjcy: 1107,
  gla: 10917,
  gl: 8823,
  glE: 10898,
  glj: 10916,
  gnap: 10890,
  gnapprox: 10890,
  gne: 10888,
  gnE: 8809,
  gneq: 10888,
  gneqq: 8809,
  gnsim: 8935,
  Gopf: 55349,
  gopf: 55349,
  grave: 96,
  GreaterEqual: 8805,
  GreaterEqualLess: 8923,
  GreaterFullEqual: 8807,
  GreaterGreater: 10914,
  GreaterLess: 8823,
  GreaterSlantEqual: 10878,
  GreaterTilde: 8819,
  Gscr: 55349,
  gscr: 8458,
  gsim: 8819,
  gsime: 10894,
  gsiml: 10896,
  gtcc: 10919,
  gtcir: 10874,
  gt: 62,
  GT: 62,
  Gt: 8811,
  gtdot: 8919,
  gtlPar: 10645,
  gtquest: 10876,
  gtrapprox: 10886,
  gtrarr: 10616,
  gtrdot: 8919,
  gtreqless: 8923,
  gtreqqless: 10892,
  gtrless: 8823,
  gtrsim: 8819,
  gvertneqq: 8809,
  gvnE: 8809,
  Hacek: 711,
  hairsp: 8202,
  half: 189,
  hamilt: 8459,
  HARDcy: 1066,
  hardcy: 1098,
  harrcir: 10568,
  harr: 8596,
  hArr: 8660,
  harrw: 8621,
  Hat: 94,
  hbar: 8463,
  Hcirc: 292,
  hcirc: 293,
  hearts: 9829,
  heartsuit: 9829,
  hellip: 8230,
  hercon: 8889,
  hfr: 55349,
  Hfr: 8460,
  HilbertSpace: 8459,
  hksearow: 10533,
  hkswarow: 10534,
  hoarr: 8703,
  homtht: 8763,
  hookleftarrow: 8617,
  hookrightarrow: 8618,
  hopf: 55349,
  Hopf: 8461,
  horbar: 8213,
  HorizontalLine: 9472,
  hscr: 55349,
  Hscr: 8459,
  hslash: 8463,
  Hstrok: 294,
  hstrok: 295,
  HumpDownHump: 8782,
  HumpEqual: 8783,
  hybull: 8259,
  hyphen: 8208,
  Iacute: 205,
  iacute: 237,
  ic: 8291,
  Icirc: 206,
  icirc: 238,
  Icy: 1048,
  icy: 1080,
  Idot: 304,
  IEcy: 1045,
  iecy: 1077,
  iexcl: 161,
  iff: 8660,
  ifr: 55349,
  Ifr: 8465,
  Igrave: 204,
  igrave: 236,
  ii: 8520,
  iiiint: 10764,
  iiint: 8749,
  iinfin: 10716,
  iiota: 8489,
  IJlig: 306,
  ijlig: 307,
  Imacr: 298,
  imacr: 299,
  image: 8465,
  ImaginaryI: 8520,
  imagline: 8464,
  imagpart: 8465,
  imath: 305,
  Im: 8465,
  imof: 8887,
  imped: 437,
  Implies: 8658,
  incare: 8453,
  'in': 8712,
  infin: 8734,
  infintie: 10717,
  inodot: 305,
  intcal: 8890,
  int: 8747,
  Int: 8748,
  integers: 8484,
  Integral: 8747,
  intercal: 8890,
  Intersection: 8898,
  intlarhk: 10775,
  intprod: 10812,
  InvisibleComma: 8291,
  InvisibleTimes: 8290,
  IOcy: 1025,
  iocy: 1105,
  Iogon: 302,
  iogon: 303,
  Iopf: 55349,
  iopf: 55349,
  Iota: 921,
  iota: 953,
  iprod: 10812,
  iquest: 191,
  iscr: 55349,
  Iscr: 8464,
  isin: 8712,
  isindot: 8949,
  isinE: 8953,
  isins: 8948,
  isinsv: 8947,
  isinv: 8712,
  it: 8290,
  Itilde: 296,
  itilde: 297,
  Iukcy: 1030,
  iukcy: 1110,
  Iuml: 207,
  iuml: 239,
  Jcirc: 308,
  jcirc: 309,
  Jcy: 1049,
  jcy: 1081,
  Jfr: 55349,
  jfr: 55349,
  jmath: 567,
  Jopf: 55349,
  jopf: 55349,
  Jscr: 55349,
  jscr: 55349,
  Jsercy: 1032,
  jsercy: 1112,
  Jukcy: 1028,
  jukcy: 1108,
  Kappa: 922,
  kappa: 954,
  kappav: 1008,
  Kcedil: 310,
  kcedil: 311,
  Kcy: 1050,
  kcy: 1082,
  Kfr: 55349,
  kfr: 55349,
  kgreen: 312,
  KHcy: 1061,
  khcy: 1093,
  KJcy: 1036,
  kjcy: 1116,
  Kopf: 55349,
  kopf: 55349,
  Kscr: 55349,
  kscr: 55349,
  lAarr: 8666,
  Lacute: 313,
  lacute: 314,
  laemptyv: 10676,
  lagran: 8466,
  Lambda: 923,
  lambda: 955,
  lang: 10216,
  Lang: 10218,
  langd: 10641,
  langle: 10216,
  lap: 10885,
  Laplacetrf: 8466,
  laquo: 171,
  larrb: 8676,
  larrbfs: 10527,
  larr: 8592,
  Larr: 8606,
  lArr: 8656,
  larrfs: 10525,
  larrhk: 8617,
  larrlp: 8619,
  larrpl: 10553,
  larrsim: 10611,
  larrtl: 8610,
  latail: 10521,
  lAtail: 10523,
  lat: 10923,
  late: 10925,
  lates: 10925,
  lbarr: 10508,
  lBarr: 10510,
  lbbrk: 10098,
  lbrace: 123,
  lbrack: 91,
  lbrke: 10635,
  lbrksld: 10639,
  lbrkslu: 10637,
  Lcaron: 317,
  lcaron: 318,
  Lcedil: 315,
  lcedil: 316,
  lceil: 8968,
  lcub: 123,
  Lcy: 1051,
  lcy: 1083,
  ldca: 10550,
  ldquo: 8220,
  ldquor: 8222,
  ldrdhar: 10599,
  ldrushar: 10571,
  ldsh: 8626,
  le: 8804,
  lE: 8806,
  LeftAngleBracket: 10216,
  LeftArrowBar: 8676,
  leftarrow: 8592,
  LeftArrow: 8592,
  Leftarrow: 8656,
  LeftArrowRightArrow: 8646,
  leftarrowtail: 8610,
  LeftCeiling: 8968,
  LeftDoubleBracket: 10214,
  LeftDownTeeVector: 10593,
  LeftDownVectorBar: 10585,
  LeftDownVector: 8643,
  LeftFloor: 8970,
  leftharpoondown: 8637,
  leftharpoonup: 8636,
  leftleftarrows: 8647,
  leftrightarrow: 8596,
  LeftRightArrow: 8596,
  Leftrightarrow: 8660,
  leftrightarrows: 8646,
  leftrightharpoons: 8651,
  leftrightsquigarrow: 8621,
  LeftRightVector: 10574,
  LeftTeeArrow: 8612,
  LeftTee: 8867,
  LeftTeeVector: 10586,
  leftthreetimes: 8907,
  LeftTriangleBar: 10703,
  LeftTriangle: 8882,
  LeftTriangleEqual: 8884,
  LeftUpDownVector: 10577,
  LeftUpTeeVector: 10592,
  LeftUpVectorBar: 10584,
  LeftUpVector: 8639,
  LeftVectorBar: 10578,
  LeftVector: 8636,
  lEg: 10891,
  leg: 8922,
  leq: 8804,
  leqq: 8806,
  leqslant: 10877,
  lescc: 10920,
  les: 10877,
  lesdot: 10879,
  lesdoto: 10881,
  lesdotor: 10883,
  lesg: 8922,
  lesges: 10899,
  lessapprox: 10885,
  lessdot: 8918,
  lesseqgtr: 8922,
  lesseqqgtr: 10891,
  LessEqualGreater: 8922,
  LessFullEqual: 8806,
  LessGreater: 8822,
  lessgtr: 8822,
  LessLess: 10913,
  lesssim: 8818,
  LessSlantEqual: 10877,
  LessTilde: 8818,
  lfisht: 10620,
  lfloor: 8970,
  Lfr: 55349,
  lfr: 55349,
  lg: 8822,
  lgE: 10897,
  lHar: 10594,
  lhard: 8637,
  lharu: 8636,
  lharul: 10602,
  lhblk: 9604,
  LJcy: 1033,
  ljcy: 1113,
  llarr: 8647,
  ll: 8810,
  Ll: 8920,
  llcorner: 8990,
  Lleftarrow: 8666,
  llhard: 10603,
  lltri: 9722,
  Lmidot: 319,
  lmidot: 320,
  lmoustache: 9136,
  lmoust: 9136,
  lnap: 10889,
  lnapprox: 10889,
  lne: 10887,
  lnE: 8808,
  lneq: 10887,
  lneqq: 8808,
  lnsim: 8934,
  loang: 10220,
  loarr: 8701,
  lobrk: 10214,
  longleftarrow: 10229,
  LongLeftArrow: 10229,
  Longleftarrow: 10232,
  longleftrightarrow: 10231,
  LongLeftRightArrow: 10231,
  Longleftrightarrow: 10234,
  longmapsto: 10236,
  longrightarrow: 10230,
  LongRightArrow: 10230,
  Longrightarrow: 10233,
  looparrowleft: 8619,
  looparrowright: 8620,
  lopar: 10629,
  Lopf: 55349,
  lopf: 55349,
  loplus: 10797,
  lotimes: 10804,
  lowast: 8727,
  lowbar: 95,
  LowerLeftArrow: 8601,
  LowerRightArrow: 8600,
  loz: 9674,
  lozenge: 9674,
  lozf: 10731,
  lpar: 40,
  lparlt: 10643,
  lrarr: 8646,
  lrcorner: 8991,
  lrhar: 8651,
  lrhard: 10605,
  lrm: 8206,
  lrtri: 8895,
  lsaquo: 8249,
  lscr: 55349,
  Lscr: 8466,
  lsh: 8624,
  Lsh: 8624,
  lsim: 8818,
  lsime: 10893,
  lsimg: 10895,
  lsqb: 91,
  lsquo: 8216,
  lsquor: 8218,
  Lstrok: 321,
  lstrok: 322,
  ltcc: 10918,
  ltcir: 10873,
  lt: 60,
  LT: 60,
  Lt: 8810,
  ltdot: 8918,
  lthree: 8907,
  ltimes: 8905,
  ltlarr: 10614,
  ltquest: 10875,
  ltri: 9667,
  ltrie: 8884,
  ltrif: 9666,
  ltrPar: 10646,
  lurdshar: 10570,
  luruhar: 10598,
  lvertneqq: 8808,
  lvnE: 8808,
  macr: 175,
  male: 9794,
  malt: 10016,
  maltese: 10016,
  Map: 10501,
  map: 8614,
  mapsto: 8614,
  mapstodown: 8615,
  mapstoleft: 8612,
  mapstoup: 8613,
  marker: 9646,
  mcomma: 10793,
  Mcy: 1052,
  mcy: 1084,
  mdash: 8212,
  mDDot: 8762,
  measuredangle: 8737,
  MediumSpace: 8287,
  Mellintrf: 8499,
  Mfr: 55349,
  mfr: 55349,
  mho: 8487,
  micro: 181,
  midast: 42,
  midcir: 10992,
  mid: 8739,
  middot: 183,
  minusb: 8863,
  minus: 8722,
  minusd: 8760,
  minusdu: 10794,
  MinusPlus: 8723,
  mlcp: 10971,
  mldr: 8230,
  mnplus: 8723,
  models: 8871,
  Mopf: 55349,
  mopf: 55349,
  mp: 8723,
  mscr: 55349,
  Mscr: 8499,
  mstpos: 8766,
  Mu: 924,
  mu: 956,
  multimap: 8888,
  mumap: 8888,
  nabla: 8711,
  Nacute: 323,
  nacute: 324,
  nang: 8736,
  nap: 8777,
  napE: 10864,
  napid: 8779,
  napos: 329,
  napprox: 8777,
  natural: 9838,
  naturals: 8469,
  natur: 9838,
  nbsp: 160,
  nbump: 8782,
  nbumpe: 8783,
  ncap: 10819,
  Ncaron: 327,
  ncaron: 328,
  Ncedil: 325,
  ncedil: 326,
  ncong: 8775,
  ncongdot: 10861,
  ncup: 10818,
  Ncy: 1053,
  ncy: 1085,
  ndash: 8211,
  nearhk: 10532,
  nearr: 8599,
  neArr: 8663,
  nearrow: 8599,
  ne: 8800,
  nedot: 8784,
  NegativeMediumSpace: 8203,
  NegativeThickSpace: 8203,
  NegativeThinSpace: 8203,
  NegativeVeryThinSpace: 8203,
  nequiv: 8802,
  nesear: 10536,
  nesim: 8770,
  NestedGreaterGreater: 8811,
  NestedLessLess: 8810,
  NewLine: 10,
  nexist: 8708,
  nexists: 8708,
  Nfr: 55349,
  nfr: 55349,
  ngE: 8807,
  nge: 8817,
  ngeq: 8817,
  ngeqq: 8807,
  ngeqslant: 10878,
  nges: 10878,
  nGg: 8921,
  ngsim: 8821,
  nGt: 8811,
  ngt: 8815,
  ngtr: 8815,
  nGtv: 8811,
  nharr: 8622,
  nhArr: 8654,
  nhpar: 10994,
  ni: 8715,
  nis: 8956,
  nisd: 8954,
  niv: 8715,
  NJcy: 1034,
  njcy: 1114,
  nlarr: 8602,
  nlArr: 8653,
  nldr: 8229,
  nlE: 8806,
  nle: 8816,
  nleftarrow: 8602,
  nLeftarrow: 8653,
  nleftrightarrow: 8622,
  nLeftrightarrow: 8654,
  nleq: 8816,
  nleqq: 8806,
  nleqslant: 10877,
  nles: 10877,
  nless: 8814,
  nLl: 8920,
  nlsim: 8820,
  nLt: 8810,
  nlt: 8814,
  nltri: 8938,
  nltrie: 8940,
  nLtv: 8810,
  nmid: 8740,
  NoBreak: 8288,
  NonBreakingSpace: 160,
  nopf: 55349,
  Nopf: 8469,
  Not: 10988,
  not: 172,
  NotCongruent: 8802,
  NotCupCap: 8813,
  NotDoubleVerticalBar: 8742,
  NotElement: 8713,
  NotEqual: 8800,
  NotEqualTilde: 8770,
  NotExists: 8708,
  NotGreater: 8815,
  NotGreaterEqual: 8817,
  NotGreaterFullEqual: 8807,
  NotGreaterGreater: 8811,
  NotGreaterLess: 8825,
  NotGreaterSlantEqual: 10878,
  NotGreaterTilde: 8821,
  NotHumpDownHump: 8782,
  NotHumpEqual: 8783,
  notin: 8713,
  notindot: 8949,
  notinE: 8953,
  notinva: 8713,
  notinvb: 8951,
  notinvc: 8950,
  NotLeftTriangleBar: 10703,
  NotLeftTriangle: 8938,
  NotLeftTriangleEqual: 8940,
  NotLess: 8814,
  NotLessEqual: 8816,
  NotLessGreater: 8824,
  NotLessLess: 8810,
  NotLessSlantEqual: 10877,
  NotLessTilde: 8820,
  NotNestedGreaterGreater: 10914,
  NotNestedLessLess: 10913,
  notni: 8716,
  notniva: 8716,
  notnivb: 8958,
  notnivc: 8957,
  NotPrecedes: 8832,
  NotPrecedesEqual: 10927,
  NotPrecedesSlantEqual: 8928,
  NotReverseElement: 8716,
  NotRightTriangleBar: 10704,
  NotRightTriangle: 8939,
  NotRightTriangleEqual: 8941,
  NotSquareSubset: 8847,
  NotSquareSubsetEqual: 8930,
  NotSquareSuperset: 8848,
  NotSquareSupersetEqual: 8931,
  NotSubset: 8834,
  NotSubsetEqual: 8840,
  NotSucceeds: 8833,
  NotSucceedsEqual: 10928,
  NotSucceedsSlantEqual: 8929,
  NotSucceedsTilde: 8831,
  NotSuperset: 8835,
  NotSupersetEqual: 8841,
  NotTilde: 8769,
  NotTildeEqual: 8772,
  NotTildeFullEqual: 8775,
  NotTildeTilde: 8777,
  NotVerticalBar: 8740,
  nparallel: 8742,
  npar: 8742,
  nparsl: 11005,
  npart: 8706,
  npolint: 10772,
  npr: 8832,
  nprcue: 8928,
  nprec: 8832,
  npreceq: 10927,
  npre: 10927,
  nrarrc: 10547,
  nrarr: 8603,
  nrArr: 8655,
  nrarrw: 8605,
  nrightarrow: 8603,
  nRightarrow: 8655,
  nrtri: 8939,
  nrtrie: 8941,
  nsc: 8833,
  nsccue: 8929,
  nsce: 10928,
  Nscr: 55349,
  nscr: 55349,
  nshortmid: 8740,
  nshortparallel: 8742,
  nsim: 8769,
  nsime: 8772,
  nsimeq: 8772,
  nsmid: 8740,
  nspar: 8742,
  nsqsube: 8930,
  nsqsupe: 8931,
  nsub: 8836,
  nsubE: 10949,
  nsube: 8840,
  nsubset: 8834,
  nsubseteq: 8840,
  nsubseteqq: 10949,
  nsucc: 8833,
  nsucceq: 10928,
  nsup: 8837,
  nsupE: 10950,
  nsupe: 8841,
  nsupset: 8835,
  nsupseteq: 8841,
  nsupseteqq: 10950,
  ntgl: 8825,
  Ntilde: 209,
  ntilde: 241,
  ntlg: 8824,
  ntriangleleft: 8938,
  ntrianglelefteq: 8940,
  ntriangleright: 8939,
  ntrianglerighteq: 8941,
  Nu: 925,
  nu: 957,
  num: 35,
  numero: 8470,
  numsp: 8199,
  nvap: 8781,
  nvdash: 8876,
  nvDash: 8877,
  nVdash: 8878,
  nVDash: 8879,
  nvge: 8805,
  nvgt: 62,
  nvHarr: 10500,
  nvinfin: 10718,
  nvlArr: 10498,
  nvle: 8804,
  nvlt: 62,
  nvltrie: 8884,
  nvrArr: 10499,
  nvrtrie: 8885,
  nvsim: 8764,
  nwarhk: 10531,
  nwarr: 8598,
  nwArr: 8662,
  nwarrow: 8598,
  nwnear: 10535,
  Oacute: 211,
  oacute: 243,
  oast: 8859,
  Ocirc: 212,
  ocirc: 244,
  ocir: 8858,
  Ocy: 1054,
  ocy: 1086,
  odash: 8861,
  Odblac: 336,
  odblac: 337,
  odiv: 10808,
  odot: 8857,
  odsold: 10684,
  OElig: 338,
  oelig: 339,
  ofcir: 10687,
  Ofr: 55349,
  ofr: 55349,
  ogon: 731,
  Ograve: 210,
  ograve: 242,
  ogt: 10689,
  ohbar: 10677,
  ohm: 937,
  oint: 8750,
  olarr: 8634,
  olcir: 10686,
  olcross: 10683,
  oline: 8254,
  olt: 10688,
  Omacr: 332,
  omacr: 333,
  Omega: 937,
  omega: 969,
  Omicron: 927,
  omicron: 959,
  omid: 10678,
  ominus: 8854,
  Oopf: 55349,
  oopf: 55349,
  opar: 10679,
  OpenCurlyDoubleQuote: 8220,
  OpenCurlyQuote: 8216,
  operp: 10681,
  oplus: 8853,
  orarr: 8635,
  Or: 10836,
  or: 8744,
  ord: 10845,
  order: 8500,
  orderof: 8500,
  ordf: 170,
  ordm: 186,
  origof: 8886,
  oror: 10838,
  orslope: 10839,
  orv: 10843,
  oS: 9416,
  Oscr: 55349,
  oscr: 8500,
  Oslash: 216,
  oslash: 248,
  osol: 8856,
  Otilde: 213,
  otilde: 245,
  otimesas: 10806,
  Otimes: 10807,
  otimes: 8855,
  Ouml: 214,
  ouml: 246,
  ovbar: 9021,
  OverBar: 8254,
  OverBrace: 9182,
  OverBracket: 9140,
  OverParenthesis: 9180,
  para: 182,
  parallel: 8741,
  par: 8741,
  parsim: 10995,
  parsl: 11005,
  part: 8706,
  PartialD: 8706,
  Pcy: 1055,
  pcy: 1087,
  percnt: 37,
  period: 46,
  permil: 8240,
  perp: 8869,
  pertenk: 8241,
  Pfr: 55349,
  pfr: 55349,
  Phi: 934,
  phi: 966,
  phiv: 981,
  phmmat: 8499,
  phone: 9742,
  Pi: 928,
  pi: 960,
  pitchfork: 8916,
  piv: 982,
  planck: 8463,
  planckh: 8462,
  plankv: 8463,
  plusacir: 10787,
  plusb: 8862,
  pluscir: 10786,
  plus: 43,
  plusdo: 8724,
  plusdu: 10789,
  pluse: 10866,
  PlusMinus: 177,
  plusmn: 177,
  plussim: 10790,
  plustwo: 10791,
  pm: 177,
  Poincareplane: 8460,
  pointint: 10773,
  popf: 55349,
  Popf: 8473,
  pound: 163,
  prap: 10935,
  Pr: 10939,
  pr: 8826,
  prcue: 8828,
  precapprox: 10935,
  prec: 8826,
  preccurlyeq: 8828,
  Precedes: 8826,
  PrecedesEqual: 10927,
  PrecedesSlantEqual: 8828,
  PrecedesTilde: 8830,
  preceq: 10927,
  precnapprox: 10937,
  precneqq: 10933,
  precnsim: 8936,
  pre: 10927,
  prE: 10931,
  precsim: 8830,
  prime: 8242,
  Prime: 8243,
  primes: 8473,
  prnap: 10937,
  prnE: 10933,
  prnsim: 8936,
  prod: 8719,
  Product: 8719,
  profalar: 9006,
  profline: 8978,
  profsurf: 8979,
  prop: 8733,
  Proportional: 8733,
  Proportion: 8759,
  propto: 8733,
  prsim: 8830,
  prurel: 8880,
  Pscr: 55349,
  pscr: 55349,
  Psi: 936,
  psi: 968,
  puncsp: 8200,
  Qfr: 55349,
  qfr: 55349,
  qint: 10764,
  qopf: 55349,
  Qopf: 8474,
  qprime: 8279,
  Qscr: 55349,
  qscr: 55349,
  quaternions: 8461,
  quatint: 10774,
  quest: 63,
  questeq: 8799,
  quot: 34,
  QUOT: 34,
  rAarr: 8667,
  race: 8765,
  Racute: 340,
  racute: 341,
  radic: 8730,
  raemptyv: 10675,
  rang: 10217,
  Rang: 10219,
  rangd: 10642,
  range: 10661,
  rangle: 10217,
  raquo: 187,
  rarrap: 10613,
  rarrb: 8677,
  rarrbfs: 10528,
  rarrc: 10547,
  rarr: 8594,
  Rarr: 8608,
  rArr: 8658,
  rarrfs: 10526,
  rarrhk: 8618,
  rarrlp: 8620,
  rarrpl: 10565,
  rarrsim: 10612,
  Rarrtl: 10518,
  rarrtl: 8611,
  rarrw: 8605,
  ratail: 10522,
  rAtail: 10524,
  ratio: 8758,
  rationals: 8474,
  rbarr: 10509,
  rBarr: 10511,
  RBarr: 10512,
  rbbrk: 10099,
  rbrace: 125,
  rbrack: 93,
  rbrke: 10636,
  rbrksld: 10638,
  rbrkslu: 10640,
  Rcaron: 344,
  rcaron: 345,
  Rcedil: 342,
  rcedil: 343,
  rceil: 8969,
  rcub: 125,
  Rcy: 1056,
  rcy: 1088,
  rdca: 10551,
  rdldhar: 10601,
  rdquo: 8221,
  rdquor: 8221,
  rdsh: 8627,
  real: 8476,
  realine: 8475,
  realpart: 8476,
  reals: 8477,
  Re: 8476,
  rect: 9645,
  reg: 174,
  REG: 174,
  ReverseElement: 8715,
  ReverseEquilibrium: 8651,
  ReverseUpEquilibrium: 10607,
  rfisht: 10621,
  rfloor: 8971,
  rfr: 55349,
  Rfr: 8476,
  rHar: 10596,
  rhard: 8641,
  rharu: 8640,
  rharul: 10604,
  Rho: 929,
  rho: 961,
  rhov: 1009,
  RightAngleBracket: 10217,
  RightArrowBar: 8677,
  rightarrow: 8594,
  RightArrow: 8594,
  Rightarrow: 8658,
  RightArrowLeftArrow: 8644,
  rightarrowtail: 8611,
  RightCeiling: 8969,
  RightDoubleBracket: 10215,
  RightDownTeeVector: 10589,
  RightDownVectorBar: 10581,
  RightDownVector: 8642,
  RightFloor: 8971,
  rightharpoondown: 8641,
  rightharpoonup: 8640,
  rightleftarrows: 8644,
  rightleftharpoons: 8652,
  rightrightarrows: 8649,
  rightsquigarrow: 8605,
  RightTeeArrow: 8614,
  RightTee: 8866,
  RightTeeVector: 10587,
  rightthreetimes: 8908,
  RightTriangleBar: 10704,
  RightTriangle: 8883,
  RightTriangleEqual: 8885,
  RightUpDownVector: 10575,
  RightUpTeeVector: 10588,
  RightUpVectorBar: 10580,
  RightUpVector: 8638,
  RightVectorBar: 10579,
  RightVector: 8640,
  ring: 730,
  risingdotseq: 8787,
  rlarr: 8644,
  rlhar: 8652,
  rlm: 8207,
  rmoustache: 9137,
  rmoust: 9137,
  rnmid: 10990,
  roang: 10221,
  roarr: 8702,
  robrk: 10215,
  ropar: 10630,
  ropf: 55349,
  Ropf: 8477,
  roplus: 10798,
  rotimes: 10805,
  RoundImplies: 10608,
  rpar: 41,
  rpargt: 10644,
  rppolint: 10770,
  rrarr: 8649,
  Rrightarrow: 8667,
  rsaquo: 8250,
  rscr: 55349,
  Rscr: 8475,
  rsh: 8625,
  Rsh: 8625,
  rsqb: 93,
  rsquo: 8217,
  rsquor: 8217,
  rthree: 8908,
  rtimes: 8906,
  rtri: 9657,
  rtrie: 8885,
  rtrif: 9656,
  rtriltri: 10702,
  RuleDelayed: 10740,
  ruluhar: 10600,
  rx: 8478,
  Sacute: 346,
  sacute: 347,
  sbquo: 8218,
  scap: 10936,
  Scaron: 352,
  scaron: 353,
  Sc: 10940,
  sc: 8827,
  sccue: 8829,
  sce: 10928,
  scE: 10932,
  Scedil: 350,
  scedil: 351,
  Scirc: 348,
  scirc: 349,
  scnap: 10938,
  scnE: 10934,
  scnsim: 8937,
  scpolint: 10771,
  scsim: 8831,
  Scy: 1057,
  scy: 1089,
  sdotb: 8865,
  sdot: 8901,
  sdote: 10854,
  searhk: 10533,
  searr: 8600,
  seArr: 8664,
  searrow: 8600,
  sect: 167,
  semi: 59,
  seswar: 10537,
  setminus: 8726,
  setmn: 8726,
  sext: 10038,
  Sfr: 55349,
  sfr: 55349,
  sfrown: 8994,
  sharp: 9839,
  SHCHcy: 1065,
  shchcy: 1097,
  SHcy: 1064,
  shcy: 1096,
  ShortDownArrow: 8595,
  ShortLeftArrow: 8592,
  shortmid: 8739,
  shortparallel: 8741,
  ShortRightArrow: 8594,
  ShortUpArrow: 8593,
  shy: 173,
  Sigma: 931,
  sigma: 963,
  sigmaf: 962,
  sigmav: 962,
  sim: 8764,
  simdot: 10858,
  sime: 8771,
  simeq: 8771,
  simg: 10910,
  simgE: 10912,
  siml: 10909,
  simlE: 10911,
  simne: 8774,
  simplus: 10788,
  simrarr: 10610,
  slarr: 8592,
  SmallCircle: 8728,
  smallsetminus: 8726,
  smashp: 10803,
  smeparsl: 10724,
  smid: 8739,
  smile: 8995,
  smt: 10922,
  smte: 10924,
  smtes: 10924,
  SOFTcy: 1068,
  softcy: 1100,
  solbar: 9023,
  solb: 10692,
  sol: 47,
  Sopf: 55349,
  sopf: 55349,
  spades: 9824,
  spadesuit: 9824,
  spar: 8741,
  sqcap: 8851,
  sqcaps: 8851,
  sqcup: 8852,
  sqcups: 8852,
  Sqrt: 8730,
  sqsub: 8847,
  sqsube: 8849,
  sqsubset: 8847,
  sqsubseteq: 8849,
  sqsup: 8848,
  sqsupe: 8850,
  sqsupset: 8848,
  sqsupseteq: 8850,
  square: 9633,
  Square: 9633,
  SquareIntersection: 8851,
  SquareSubset: 8847,
  SquareSubsetEqual: 8849,
  SquareSuperset: 8848,
  SquareSupersetEqual: 8850,
  SquareUnion: 8852,
  squarf: 9642,
  squ: 9633,
  squf: 9642,
  srarr: 8594,
  Sscr: 55349,
  sscr: 55349,
  ssetmn: 8726,
  ssmile: 8995,
  sstarf: 8902,
  Star: 8902,
  star: 9734,
  starf: 9733,
  straightepsilon: 1013,
  straightphi: 981,
  strns: 175,
  sub: 8834,
  Sub: 8912,
  subdot: 10941,
  subE: 10949,
  sube: 8838,
  subedot: 10947,
  submult: 10945,
  subnE: 10955,
  subne: 8842,
  subplus: 10943,
  subrarr: 10617,
  subset: 8834,
  Subset: 8912,
  subseteq: 8838,
  subseteqq: 10949,
  SubsetEqual: 8838,
  subsetneq: 8842,
  subsetneqq: 10955,
  subsim: 10951,
  subsub: 10965,
  subsup: 10963,
  succapprox: 10936,
  succ: 8827,
  succcurlyeq: 8829,
  Succeeds: 8827,
  SucceedsEqual: 10928,
  SucceedsSlantEqual: 8829,
  SucceedsTilde: 8831,
  succeq: 10928,
  succnapprox: 10938,
  succneqq: 10934,
  succnsim: 8937,
  succsim: 8831,
  SuchThat: 8715,
  sum: 8721,
  Sum: 8721,
  sung: 9834,
  sup1: 185,
  sup2: 178,
  sup3: 179,
  sup: 8835,
  Sup: 8913,
  supdot: 10942,
  supdsub: 10968,
  supE: 10950,
  supe: 8839,
  supedot: 10948,
  Superset: 8835,
  SupersetEqual: 8839,
  suphsol: 10185,
  suphsub: 10967,
  suplarr: 10619,
  supmult: 10946,
  supnE: 10956,
  supne: 8843,
  supplus: 10944,
  supset: 8835,
  Supset: 8913,
  supseteq: 8839,
  supseteqq: 10950,
  supsetneq: 8843,
  supsetneqq: 10956,
  supsim: 10952,
  supsub: 10964,
  supsup: 10966,
  swarhk: 10534,
  swarr: 8601,
  swArr: 8665,
  swarrow: 8601,
  swnwar: 10538,
  szlig: 223,
  Tab: NaN,
  target: 8982,
  Tau: 932,
  tau: 964,
  tbrk: 9140,
  Tcaron: 356,
  tcaron: 357,
  Tcedil: 354,
  tcedil: 355,
  Tcy: 1058,
  tcy: 1090,
  tdot: 8411,
  telrec: 8981,
  Tfr: 55349,
  tfr: 55349,
  there4: 8756,
  therefore: 8756,
  Therefore: 8756,
  Theta: 920,
  theta: 952,
  thetasym: 977,
  thetav: 977,
  thickapprox: 8776,
  thicksim: 8764,
  ThickSpace: 8287,
  ThinSpace: 8201,
  thinsp: 8201,
  thkap: 8776,
  thksim: 8764,
  THORN: 222,
  thorn: 254,
  tilde: 732,
  Tilde: 8764,
  TildeEqual: 8771,
  TildeFullEqual: 8773,
  TildeTilde: 8776,
  timesbar: 10801,
  timesb: 8864,
  times: 215,
  timesd: 10800,
  tint: 8749,
  toea: 10536,
  topbot: 9014,
  topcir: 10993,
  top: 8868,
  Topf: 55349,
  topf: 55349,
  topfork: 10970,
  tosa: 10537,
  tprime: 8244,
  trade: 8482,
  TRADE: 8482,
  triangle: 9653,
  triangledown: 9663,
  triangleleft: 9667,
  trianglelefteq: 8884,
  triangleq: 8796,
  triangleright: 9657,
  trianglerighteq: 8885,
  tridot: 9708,
  trie: 8796,
  triminus: 10810,
  TripleDot: 8411,
  triplus: 10809,
  trisb: 10701,
  tritime: 10811,
  trpezium: 9186,
  Tscr: 55349,
  tscr: 55349,
  TScy: 1062,
  tscy: 1094,
  TSHcy: 1035,
  tshcy: 1115,
  Tstrok: 358,
  tstrok: 359,
  twixt: 8812,
  twoheadleftarrow: 8606,
  twoheadrightarrow: 8608,
  Uacute: 218,
  uacute: 250,
  uarr: 8593,
  Uarr: 8607,
  uArr: 8657,
  Uarrocir: 10569,
  Ubrcy: 1038,
  ubrcy: 1118,
  Ubreve: 364,
  ubreve: 365,
  Ucirc: 219,
  ucirc: 251,
  Ucy: 1059,
  ucy: 1091,
  udarr: 8645,
  Udblac: 368,
  udblac: 369,
  udhar: 10606,
  ufisht: 10622,
  Ufr: 55349,
  ufr: 55349,
  Ugrave: 217,
  ugrave: 249,
  uHar: 10595,
  uharl: 8639,
  uharr: 8638,
  uhblk: 9600,
  ulcorn: 8988,
  ulcorner: 8988,
  ulcrop: 8975,
  ultri: 9720,
  Umacr: 362,
  umacr: 363,
  uml: 168,
  UnderBar: 95,
  UnderBrace: 9183,
  UnderBracket: 9141,
  UnderParenthesis: 9181,
  Union: 8899,
  UnionPlus: 8846,
  Uogon: 370,
  uogon: 371,
  Uopf: 55349,
  uopf: 55349,
  UpArrowBar: 10514,
  uparrow: 8593,
  UpArrow: 8593,
  Uparrow: 8657,
  UpArrowDownArrow: 8645,
  updownarrow: 8597,
  UpDownArrow: 8597,
  Updownarrow: 8661,
  UpEquilibrium: 10606,
  upharpoonleft: 8639,
  upharpoonright: 8638,
  uplus: 8846,
  UpperLeftArrow: 8598,
  UpperRightArrow: 8599,
  upsi: 965,
  Upsi: 978,
  upsih: 978,
  Upsilon: 933,
  upsilon: 965,
  UpTeeArrow: 8613,
  UpTee: 8869,
  upuparrows: 8648,
  urcorn: 8989,
  urcorner: 8989,
  urcrop: 8974,
  Uring: 366,
  uring: 367,
  urtri: 9721,
  Uscr: 55349,
  uscr: 55349,
  utdot: 8944,
  Utilde: 360,
  utilde: 361,
  utri: 9653,
  utrif: 9652,
  uuarr: 8648,
  Uuml: 220,
  uuml: 252,
  uwangle: 10663,
  vangrt: 10652,
  varepsilon: 1013,
  varkappa: 1008,
  varnothing: 8709,
  varphi: 981,
  varpi: 982,
  varpropto: 8733,
  varr: 8597,
  vArr: 8661,
  varrho: 1009,
  varsigma: 962,
  varsubsetneq: 8842,
  varsubsetneqq: 10955,
  varsupsetneq: 8843,
  varsupsetneqq: 10956,
  vartheta: 977,
  vartriangleleft: 8882,
  vartriangleright: 8883,
  vBar: 10984,
  Vbar: 10987,
  vBarv: 10985,
  Vcy: 1042,
  vcy: 1074,
  vdash: 8866,
  vDash: 8872,
  Vdash: 8873,
  VDash: 8875,
  Vdashl: 10982,
  veebar: 8891,
  vee: 8744,
  Vee: 8897,
  veeeq: 8794,
  vellip: 8942,
  verbar: 124,
  Verbar: 8214,
  vert: 124,
  Vert: 8214,
  VerticalBar: 8739,
  VerticalLine: 124,
  VerticalSeparator: 10072,
  VerticalTilde: 8768,
  VeryThinSpace: 8202,
  Vfr: 55349,
  vfr: 55349,
  vltri: 8882,
  vnsub: 8834,
  vnsup: 8835,
  Vopf: 55349,
  vopf: 55349,
  vprop: 8733,
  vrtri: 8883,
  Vscr: 55349,
  vscr: 55349,
  vsubnE: 10955,
  vsubne: 8842,
  vsupnE: 10956,
  vsupne: 8843,
  Vvdash: 8874,
  vzigzag: 10650,
  Wcirc: 372,
  wcirc: 373,
  wedbar: 10847,
  wedge: 8743,
  Wedge: 8896,
  wedgeq: 8793,
  weierp: 8472,
  Wfr: 55349,
  wfr: 55349,
  Wopf: 55349,
  wopf: 55349,
  wp: 8472,
  wr: 8768,
  wreath: 8768,
  Wscr: 55349,
  wscr: 55349,
  xcap: 8898,
  xcirc: 9711,
  xcup: 8899,
  xdtri: 9661,
  Xfr: 55349,
  xfr: 55349,
  xharr: 10231,
  xhArr: 10234,
  Xi: 926,
  xi: 958,
  xlarr: 10229,
  xlArr: 10232,
  xmap: 10236,
  xnis: 8955,
  xodot: 10752,
  Xopf: 55349,
  xopf: 55349,
  xoplus: 10753,
  xotime: 10754,
  xrarr: 10230,
  xrArr: 10233,
  Xscr: 55349,
  xscr: 55349,
  xsqcup: 10758,
  xuplus: 10756,
  xutri: 9651,
  xvee: 8897,
  xwedge: 8896,
  Yacute: 221,
  yacute: 253,
  YAcy: 1071,
  yacy: 1103,
  Ycirc: 374,
  ycirc: 375,
  Ycy: 1067,
  ycy: 1099,
  yen: 165,
  Yfr: 55349,
  yfr: 55349,
  YIcy: 1031,
  yicy: 1111,
  Yopf: 55349,
  yopf: 55349,
  Yscr: 55349,
  yscr: 55349,
  YUcy: 1070,
  yucy: 1102,
  yuml: 255,
  Yuml: 376,
  Zacute: 377,
  zacute: 378,
  Zcaron: 381,
  zcaron: 382,
  Zcy: 1047,
  zcy: 1079,
  Zdot: 379,
  zdot: 380,
  zeetrf: 8488,
  ZeroWidthSpace: 8203,
  Zeta: 918,
  zeta: 950,
  zfr: 55349,
  Zfr: 8488,
  ZHcy: 1046,
  zhcy: 1078,
  zigrarr: 8669,
  zopf: 55349,
  Zopf: 8484,
  Zscr: 55349,
  zscr: 55349,
  zwj: 8205,
  zwnj: 8204 };

var entityToChar = function(m) {
    var isNumeric = m.slice(0, 2) === "&#";
    var c;
    var isHex = isNumeric && (c = m.slice(2, 3)) && (c === 'X' || c === 'x');
    var uchar;
    var ucode;
    if (isNumeric) {
        var num;
        if (isHex) {
            num = parseInt(m.slice(3, m.length - 1), 16);
        } else {
            num = parseInt(m.slice(2, m.length - 1), 10);
        }
        if (num === 0) {
            uchar = '\uFFFD';
        } else {
            uchar = fromCodePoint(num);
        }
    } else {
        ucode = entities[m.slice(1, m.length - 1)];
        if (ucode) {
            uchar = fromCodePoint(entities[m.slice(1, m.length - 1)]);
        }
    }
    return (uchar || m);
};

module.exports.entityToChar = entityToChar;

},{"./from-code-point":118}],121:[function(require,module,exports){
"use strict";

// commonmark.js - CommomMark in JavaScript
// Copyright (C) 2014 John MacFarlane
// License: BSD3.

// Basic usage:
//
// var commonmark = require('commonmark');
// var parser = new commonmark.Parser();
// var renderer = new commonmark.HtmlRenderer();
// console.log(renderer.render(parser.parse('Hello *world*')));

module.exports.Node = require('./node');
module.exports.Parser = require('./blocks');
module.exports.HtmlRenderer = require('./html');
module.exports.XmlRenderer = require('./xml');

},{"./blocks":114,"./html":119,"./node":123,"./xml":125}],122:[function(require,module,exports){
"use strict";

var Node = require('./node');
var common = require('./common');
var normalizeReference = require('./normalize-reference');

var normalizeURI = common.normalizeURI;
var unescapeString = common.unescapeString;
var fromCodePoint = require('./from-code-point.js');
var entityToChar = require('./html5-entities.js').entityToChar;

// Constants for character codes:

var C_NEWLINE = 10;
var C_ASTERISK = 42;
var C_UNDERSCORE = 95;
var C_BACKTICK = 96;
var C_OPEN_BRACKET = 91;
var C_CLOSE_BRACKET = 93;
var C_LESSTHAN = 60;
var C_BANG = 33;
var C_BACKSLASH = 92;
var C_AMPERSAND = 38;
var C_OPEN_PAREN = 40;
var C_CLOSE_PAREN = 41;
var C_COLON = 58;
var C_SINGLEQUOTE = 39;
var C_DOUBLEQUOTE = 34;

// Some regexps used in inline parser:

var ESCAPABLE = common.ESCAPABLE;
var ESCAPED_CHAR = '\\\\' + ESCAPABLE;
var REG_CHAR = '[^\\\\()\\x00-\\x20]';
var IN_PARENS_NOSP = '\\((' + REG_CHAR + '|' + ESCAPED_CHAR + ')*\\)';
var TAGNAME = '[A-Za-z][A-Za-z0-9]*';
var ATTRIBUTENAME = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
var UNQUOTEDVALUE = "[^\"'=<>`\\x00-\\x20]+";
var SINGLEQUOTEDVALUE = "'[^']*'";
var DOUBLEQUOTEDVALUE = '"[^"]*"';
var ATTRIBUTEVALUE = "(?:" + UNQUOTEDVALUE + "|" + SINGLEQUOTEDVALUE + "|" + DOUBLEQUOTEDVALUE + ")";
var ATTRIBUTEVALUESPEC = "(?:" + "\\s*=" + "\\s*" + ATTRIBUTEVALUE + ")";
var ATTRIBUTE = "(?:" + "\\s+" + ATTRIBUTENAME + ATTRIBUTEVALUESPEC + "?)";
var OPENTAG = "<" + TAGNAME + ATTRIBUTE + "*" + "\\s*/?>";
var CLOSETAG = "</" + TAGNAME + "\\s*[>]";
var HTMLCOMMENT = "<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->";
var PROCESSINGINSTRUCTION = "[<][?].*?[?][>]";
var DECLARATION = "<![A-Z]+" + "\\s+[^>]*>";
var CDATA = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>";
var HTMLTAG = "(?:" + OPENTAG + "|" + CLOSETAG + "|" + HTMLCOMMENT + "|" +
        PROCESSINGINSTRUCTION + "|" + DECLARATION + "|" + CDATA + ")";
var ENTITY = common.ENTITY;

var rePunctuation = new RegExp(/^[\u2000-\u206F\u2E00-\u2E7F\\'!"#\$%&\(\)\*\+,\-\.\/:;<=>\?@\[\]\^_`\{\|\}~]/);

var reHtmlTag = new RegExp('^' + HTMLTAG, 'i');

var reLinkTitle = new RegExp(
    '^(?:"(' + ESCAPED_CHAR + '|[^"\\x00])*"' +
        '|' +
        '\'(' + ESCAPED_CHAR + '|[^\'\\x00])*\'' +
        '|' +
        '\\((' + ESCAPED_CHAR + '|[^)\\x00])*\\))');

var reLinkDestinationBraces = new RegExp(
    '^(?:[<](?:[^<>\\n\\\\\\x00]' + '|' + ESCAPED_CHAR + '|' + '\\\\)*[>])');

var reLinkDestination = new RegExp(
    '^(?:' + REG_CHAR + '+|' + ESCAPED_CHAR + '|' + IN_PARENS_NOSP + ')*');

var reEscapable = new RegExp('^' + ESCAPABLE);

var reEntityHere = new RegExp('^' + ENTITY, 'i');

var reTicks = /`+/;

var reTicksHere = /^`+/;

var reEllipses = /\.\.\./g;

var reDash = /---?/g;

var reEmailAutolink = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;

var reAutolink = /^<(?:coap|doi|javascript|aaa|aaas|about|acap|cap|cid|crid|data|dav|dict|dns|file|ftp|geo|go|gopher|h323|http|https|iax|icap|im|imap|info|ipp|iris|iris.beep|iris.xpc|iris.xpcs|iris.lwz|ldap|mailto|mid|msrp|msrps|mtqp|mupdate|news|nfs|ni|nih|nntp|opaquelocktoken|pop|pres|rtsp|service|session|shttp|sieve|sip|sips|sms|snmp|soap.beep|soap.beeps|tag|tel|telnet|tftp|thismessage|tn3270|tip|tv|urn|vemmi|ws|wss|xcon|xcon-userid|xmlrpc.beep|xmlrpc.beeps|xmpp|z39.50r|z39.50s|adiumxtra|afp|afs|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|chrome|chrome-extension|com-eventbrite-attendee|content|cvs|dlna-playsingle|dlna-playcontainer|dtn|dvb|ed2k|facetime|feed|finger|fish|gg|git|gizmoproject|gtalk|hcp|icon|ipn|irc|irc6|ircs|itms|jar|jms|keyparc|lastfm|ldaps|magnet|maps|market|message|mms|ms-help|msnim|mumble|mvn|notes|oid|palm|paparazzi|platform|proxy|psyc|query|res|resource|rmi|rsync|rtmp|secondlife|sftp|sgn|skype|smb|soldat|spotify|ssh|steam|svn|teamspeak|things|udp|unreal|ut2004|ventrilo|view-source|webcal|wtai|wyciwyg|xfire|xri|ymsgr):[^<>\x00-\x20]*>/i;

var reSpnl = /^ *(?:\n *)?/;

var reWhitespaceChar = /^\s/;

var reWhitespace = /\s+/g;

var reFinalSpace = / *$/;

var reInitialSpace = /^ */;

var reSpaceAtEndOfLine = /^ *(?:\n|$)/;

var reLinkLabel = /^\[(?:[^\\\[\]]|\\[\[\]]){0,1000}\]/;

// Matches a string of non-special characters.
var reMain = /^[^\n`\[\]\\!<&*_'"]+/m;

var text = function(s) {
    var node = new Node('Text');
    node._literal = s;
    return node;
};

// INLINE PARSER

// These are methods of an InlineParser object, defined below.
// An InlineParser keeps track of a subject (a string to be
// parsed) and a position in that subject.

// If re matches at current position in the subject, advance
// position in subject and return the match; otherwise return null.
var match = function(re) {
    var m = re.exec(this.subject.slice(this.pos));
    if (m === null) {
        return null;
    } else {
        this.pos += m.index + m[0].length;
        return m[0];
    }
};

// Returns the code for the character at the current subject position, or -1
// there are no more characters.
var peek = function() {
    if (this.pos < this.subject.length) {
        return this.subject.charCodeAt(this.pos);
    } else {
        return -1;
    }
};

// Parse zero or more space characters, including at most one newline
var spnl = function() {
    this.match(reSpnl);
    return true;
};

// All of the parsers below try to match something at the current position
// in the subject.  If they succeed in matching anything, they
// return the inline matched, advancing the subject.

// Attempt to parse backticks, adding either a backtick code span or a
// literal sequence of backticks.
var parseBackticks = function(block) {
    var ticks = this.match(reTicksHere);
    if (ticks === null) {
        return false;
    }
    var afterOpenTicks = this.pos;
    var matched;
    var node;
    while ((matched = this.match(reTicks)) !== null) {
        if (matched === ticks) {
            node = new Node('Code');
            node._literal = this.subject.slice(afterOpenTicks,
                                        this.pos - ticks.length)
                          .trim().replace(reWhitespace, ' ');
            block.appendChild(node);
            return true;
        }
    }
    // If we got here, we didn't match a closing backtick sequence.
    this.pos = afterOpenTicks;
    block.appendChild(text(ticks));
    return true;
};

// Parse a backslash-escaped special character, adding either the escaped
// character, a hard line break (if the backslash is followed by a newline),
// or a literal backslash to the block's children.  Assumes current character
// is a backslash.
var parseBackslash = function(block) {
    var subj = this.subject;
    var node;
    this.pos += 1;
    if (this.peek() === C_NEWLINE) {
        this.pos += 1;
        node = new Node('Hardbreak');
        block.appendChild(node);
    } else if (reEscapable.test(subj.charAt(this.pos))) {
        block.appendChild(text(subj.charAt(this.pos)));
        this.pos += 1;
    } else {
        block.appendChild(text('\\'));
    }
    return true;
};

// Attempt to parse an autolink (URL or email in pointy brackets).
var parseAutolink = function(block) {
    var m;
    var dest;
    var node;
    if ((m = this.match(reEmailAutolink))) {
        dest = m.slice(1, m.length - 1);
        node = new Node('Link');
        node._destination = normalizeURI('mailto:' + dest);
        node._title = '';
        node.appendChild(text(dest));
        block.appendChild(node);
        return true;
    } else if ((m = this.match(reAutolink))) {
        dest = m.slice(1, m.length - 1);
        node = new Node('Link');
        node._destination = normalizeURI(dest);
        node._title = '';
        node.appendChild(text(dest));
        block.appendChild(node);
        return true;
    } else {
        return false;
    }
};

// Attempt to parse a raw HTML tag.
var parseHtmlTag = function(block) {
    var m = this.match(reHtmlTag);
    if (m === null) {
        return false;
    } else {
        var node = new Node('Html');
        node._literal = m;
        block.appendChild(node);
        return true;
    }
};

// Scan a sequence of characters with code cc, and return information about
// the number of delimiters and whether they are positioned such that
// they can open and/or close emphasis or strong emphasis.  A utility
// function for strong/emph parsing.
var scanDelims = function(cc) {
    var numdelims = 0;
    var char_before, char_after, cc_after;
    var startpos = this.pos;
    var left_flanking, right_flanking, can_open, can_close;
    var after_is_whitespace, after_is_punctuation, before_is_whitespace, before_is_punctuation;

    if (cc === C_SINGLEQUOTE || cc === C_DOUBLEQUOTE) {
        numdelims++;
        this.pos++;
    } else {
        while (this.peek() === cc) {
            numdelims++;
            this.pos++;
        }
    }

    if (numdelims === 0) {
        return null;
    }

    char_before = startpos === 0 ? '\n' : this.subject.charAt(startpos - 1);

    cc_after = this.peek();
    if (cc_after === -1) {
        char_after = '\n';
    } else {
        char_after = fromCodePoint(cc_after);
    }

    after_is_whitespace = reWhitespaceChar.test(char_after);
    after_is_punctuation = rePunctuation.test(char_after);
    before_is_whitespace = reWhitespaceChar.test(char_before);
    before_is_punctuation = rePunctuation.test(char_before);

    left_flanking = !after_is_whitespace &&
            !(after_is_punctuation && !before_is_whitespace && !before_is_punctuation);
    right_flanking = !before_is_whitespace &&
            !(before_is_punctuation && !after_is_whitespace && !after_is_punctuation);
    if (cc === C_UNDERSCORE) {
        can_open = left_flanking &&
            (!right_flanking || before_is_punctuation);
        can_close = right_flanking &&
            (!left_flanking || after_is_punctuation);
    } else {
        can_open = left_flanking;
        can_close = right_flanking;
    }
    this.pos = startpos;
    return { numdelims: numdelims,
             can_open: can_open,
             can_close: can_close };
};

// Handle a delimiter marker for emphasis or a quote.
var handleDelim = function(cc, block) {
    var res = this.scanDelims(cc);
    if (!res) {
        return false;
    }
    var numdelims = res.numdelims;
    var startpos = this.pos;
    var contents;

    this.pos += numdelims;
    if (cc === C_SINGLEQUOTE) {
        contents = "\u2019";
    } else if (cc === C_DOUBLEQUOTE) {
        contents = "\u201C";
    } else {
        contents = this.subject.slice(startpos, this.pos);
    }
    var node = text(contents);
    block.appendChild(node);

    // Add entry to stack for this opener
    this.delimiters = { cc: cc,
                        numdelims: numdelims,
                        node: node,
                        previous: this.delimiters,
                        next: null,
                        can_open: res.can_open,
                        can_close: res.can_close,
                        active: true };
    if (this.delimiters.previous !== null) {
        this.delimiters.previous.next = this.delimiters;
    }

    return true;

};

var removeDelimiter = function(delim) {
    if (delim.previous !== null) {
        delim.previous.next = delim.next;
    }
    if (delim.next === null) {
        // top of stack
        this.delimiters = delim.previous;
    } else {
        delim.next.previous = delim.previous;
    }
};

var removeDelimitersBetween = function(bottom, top) {
    if (bottom.next !== top) {
        bottom.next = top;
        top.previous = bottom;
    }
};

var processEmphasis = function(stack_bottom) {
    var opener, closer;
    var opener_inl, closer_inl;
    var tempstack;
    var use_delims;
    var tmp, next;

    // find first closer above stack_bottom:
    closer = this.delimiters;
    while (closer !== null && closer.previous !== stack_bottom) {
        closer = closer.previous;
    }
    // move forward, looking for closers, and handling each
    while (closer !== null) {
        var closercc = closer.cc;
        if (!(closer.can_close && (closercc === C_UNDERSCORE ||
                                   closercc === C_ASTERISK ||
                                   closercc === C_SINGLEQUOTE ||
                                   closercc === C_DOUBLEQUOTE))) {
            closer = closer.next;
        } else {
            // found emphasis closer. now look back for first matching opener:
            opener = closer.previous;
            while (opener !== null && opener !== stack_bottom) {
                if (opener.cc === closer.cc && opener.can_open) {
                    break;
                }
                opener = opener.previous;
            }
            if (closercc === C_ASTERISK || closercc === C_UNDERSCORE) {
                if (opener === null || opener === stack_bottom) {
                    closer = closer.next;
                } else {
                    // calculate actual number of delimiters used from closer
                    if (closer.numdelims < 3 || opener.numdelims < 3) {
                        use_delims = closer.numdelims <= opener.numdelims ?
                            closer.numdelims : opener.numdelims;
                    } else {
                        use_delims = closer.numdelims % 2 === 0 ? 2 : 1;
                    }

                    opener_inl = opener.node;
                    closer_inl = closer.node;

                    // remove used delimiters from stack elts and inlines
                    opener.numdelims -= use_delims;
                    closer.numdelims -= use_delims;
                    opener_inl._literal =
                        opener_inl._literal.slice(0,
                                                  opener_inl._literal.length - use_delims);
                    closer_inl._literal =
                        closer_inl._literal.slice(0,
                                                  closer_inl._literal.length - use_delims);

                    // build contents for new emph element
                    var emph = new Node(use_delims === 1 ? 'Emph' : 'Strong');

                    tmp = opener_inl._next;
                    while (tmp && tmp !== closer_inl) {
                        next = tmp._next;
                        tmp.unlink();
                        emph.appendChild(tmp);
                        tmp = next;
                    }

                    opener_inl.insertAfter(emph);

                    // remove elts between opener and closer in delimiters stack
                    removeDelimitersBetween(opener, closer);

                    // if opener has 0 delims, remove it and the inline
                    if (opener.numdelims === 0) {
                        opener_inl.unlink();
                        this.removeDelimiter(opener);
                    }

                    if (closer.numdelims === 0) {
                        closer_inl.unlink();
                        tempstack = closer.next;
                        this.removeDelimiter(closer);
                        closer = tempstack;
                    }

                }

            } else if (closercc === C_SINGLEQUOTE) {
                closer.node._literal = "\u2019";
                if (opener !== null && opener !== stack_bottom) {
                    opener.node._literal = "\u2018";
                }
                closer = closer.next;

            } else if (closercc === C_DOUBLEQUOTE) {
                closer.node._literal = "\u201D";
                if (opener !== null && opener !== stack_bottom) {
                    opener.node.literal = "\u201C";
                }
                closer = closer.next;

            }

        }

    }

    // remove all delimiters
    while (this.delimiters !== stack_bottom) {
        this.removeDelimiter(this.delimiters);
    }
};

// Attempt to parse link title (sans quotes), returning the string
// or null if no match.
var parseLinkTitle = function() {
    var title = this.match(reLinkTitle);
    if (title === null) {
        return null;
    } else {
        // chop off quotes from title and unescape:
        return unescapeString(title.substr(1, title.length - 2));
    }
};

// Attempt to parse link destination, returning the string or
// null if no match.
var parseLinkDestination = function() {
    var res = this.match(reLinkDestinationBraces);
    if (res === null) {
        res = this.match(reLinkDestination);
        if (res === null) {
            return null;
        } else {
            return normalizeURI(unescapeString(res));
        }
    } else {  // chop off surrounding <..>:
        return normalizeURI(unescapeString(res.substr(1, res.length - 2)));
    }
};

// Attempt to parse a link label, returning number of characters parsed.
var parseLinkLabel = function() {
    var m = this.match(reLinkLabel);
    return m === null ? 0 : m.length;
};

// Add open bracket to delimiter stack and add a text node to block's children.
var parseOpenBracket = function(block) {
    var startpos = this.pos;
    this.pos += 1;

    var node = text('[');
    block.appendChild(node);

    // Add entry to stack for this opener
    this.delimiters = { cc: C_OPEN_BRACKET,
                        numdelims: 1,
                        node: node,
                        previous: this.delimiters,
                        next: null,
                        can_open: true,
                        can_close: false,
                        index: startpos,
                        active: true };
    if (this.delimiters.previous !== null) {
        this.delimiters.previous.next = this.delimiters;
    }

    return true;

};

// IF next character is [, and ! delimiter to delimiter stack and
// add a text node to block's children.  Otherwise just add a text node.
var parseBang = function(block) {
    var startpos = this.pos;
    this.pos += 1;
    if (this.peek() === C_OPEN_BRACKET) {
        this.pos += 1;

        var node = text('![');
        block.appendChild(node);

        // Add entry to stack for this opener
        this.delimiters = { cc: C_BANG,
                            numdelims: 1,
                            node: node,
                            previous: this.delimiters,
                            next: null,
                            can_open: true,
                            can_close: false,
                            index: startpos + 1,
                            active: true };
        if (this.delimiters.previous !== null) {
            this.delimiters.previous.next = this.delimiters;
        }
    } else {
        block.appendChild(text('!'));
    }
    return true;
};

// Try to match close bracket against an opening in the delimiter
// stack.  Add either a link or image, or a plain [ character,
// to block's children.  If there is a matching delimiter,
// remove it from the delimiter stack.
var parseCloseBracket = function(block) {
    var startpos;
    var is_image;
    var dest;
    var title;
    var matched = false;
    var reflabel;
    var opener;

    this.pos += 1;
    startpos = this.pos;

    // look through stack of delimiters for a [ or ![
    opener = this.delimiters;

    while (opener !== null) {
        if (opener.cc === C_OPEN_BRACKET || opener.cc === C_BANG) {
            break;
        }
        opener = opener.previous;
    }

    if (opener === null) {
        // no matched opener, just return a literal
        block.appendChild(text(']'));
        return true;
    }

    if (!opener.active) {
        // no matched opener, just return a literal
        block.appendChild(text(']'));
        // take opener off emphasis stack
        this.removeDelimiter(opener);
        return true;
    }

    // If we got here, open is a potential opener
    is_image = opener.cc === C_BANG;

    // Check to see if we have a link/image

    // Inline link?
    if (this.peek() === C_OPEN_PAREN) {
        this.pos++;
        if (this.spnl() &&
            ((dest = this.parseLinkDestination()) !== null) &&
            this.spnl() &&
            // make sure there's a space before the title:
            (reWhitespaceChar.test(this.subject.charAt(this.pos - 1)) &&
             (title = this.parseLinkTitle()) || true) &&
            this.spnl() &&
            this.peek() === C_CLOSE_PAREN) {
            this.pos += 1;
            matched = true;
        }
    } else {

        // Next, see if there's a link label
        var savepos = this.pos;
        this.spnl();
        var beforelabel = this.pos;
        var n = this.parseLinkLabel();
        if (n === 0 || n === 2) {
            // empty or missing second label
            reflabel = this.subject.slice(opener.index, startpos);
        } else {
            reflabel = this.subject.slice(beforelabel, beforelabel + n);
        }
        if (n === 0) {
            // If shortcut reference link, rewind before spaces we skipped.
            this.pos = savepos;
        }

        // lookup rawlabel in refmap
        var link = this.refmap[normalizeReference(reflabel)];
        if (link) {
            dest = link.destination;
            title = link.title;
            matched = true;
        }
    }

    if (matched) {
        var node = new Node(is_image ? 'Image' : 'Link');
        node._destination = dest;
        node._title = title || '';

        var tmp, next;
        tmp = opener.node._next;
        while (tmp) {
            next = tmp._next;
            tmp.unlink();
            node.appendChild(tmp);
            tmp = next;
        }
        block.appendChild(node);
        this.processEmphasis(opener.previous);

        opener.node.unlink();

        // processEmphasis will remove this and later delimiters.
        // Now, for a link, we also deactivate earlier link openers.
        // (no links in links)
        if (!is_image) {
          opener = this.delimiters;
          while (opener !== null) {
            if (opener.cc === C_OPEN_BRACKET) {
                opener.active = false; // deactivate this opener
            }
            opener = opener.previous;
          }
        }

        return true;

    } else { // no match

        this.removeDelimiter(opener);  // remove this opener from stack
        this.pos = startpos;
        block.appendChild(text(']'));
        return true;
    }

};

// Attempt to parse an entity.
var parseEntity = function(block) {
    var m;
    if ((m = this.match(reEntityHere))) {
        block.appendChild(text(entityToChar(m)));
        return true;
    } else {
        return false;
    }
};

// Parse a run of ordinary characters, or a single character with
// a special meaning in markdown, as a plain string.
var parseString = function(block) {
    var m;
    if ((m = this.match(reMain))) {
        if (this.options.smart) {
            block.appendChild(text(
                m.replace(reEllipses, "\u2026")
                    .replace(reDash, function(chars) {
                        return (chars.length === 3) ? "\u2014" : "\u2013";
                    })));
        } else {
            block.appendChild(text(m));
        }
        return true;
    } else {
        return false;
    }
};

// Parse a newline.  If it was preceded by two spaces, return a hard
// line break; otherwise a soft line break.
var parseNewline = function(block) {
    this.pos += 1; // assume we're at a \n
    // check previous node for trailing spaces
    var lastc = block._lastChild;
    if (lastc && lastc.type === 'Text' && lastc._literal[lastc._literal.length - 1] === ' ') {
        var hardbreak = lastc._literal[lastc._literal.length - 2] === ' ';
        lastc._literal = lastc._literal.replace(reFinalSpace, '');
        block.appendChild(new Node(hardbreak ? 'Hardbreak' : 'Softbreak'));
    } else {
        block.appendChild(new Node('Softbreak'));
    }
    this.match(reInitialSpace); // gobble leading spaces in next line
    return true;
};

// Attempt to parse a link reference, modifying refmap.
var parseReference = function(s, refmap) {
    this.subject = s;
    this.pos = 0;
    var rawlabel;
    var dest;
    var title;
    var matchChars;
    var startpos = this.pos;

    // label:
    matchChars = this.parseLinkLabel();
    if (matchChars === 0) {
        return 0;
    } else {
        rawlabel = this.subject.substr(0, matchChars);
    }

    // colon:
    if (this.peek() === C_COLON) {
        this.pos++;
    } else {
        this.pos = startpos;
        return 0;
    }

    //  link url
    this.spnl();

    dest = this.parseLinkDestination();
    if (dest === null || dest.length === 0) {
        this.pos = startpos;
        return 0;
    }

    var beforetitle = this.pos;
    this.spnl();
    title = this.parseLinkTitle();
    if (title === null) {
        title = '';
        // rewind before spaces
        this.pos = beforetitle;
    }

    // make sure we're at line end:
    if (this.match(reSpaceAtEndOfLine) === null) {
        this.pos = startpos;
        return 0;
    }

    var normlabel = normalizeReference(rawlabel);
    if (normlabel === '') {
        // label must contain non-whitespace characters
        this.pos = startpos;
        return 0;
    }

    if (!refmap[normlabel]) {
        refmap[normlabel] = { destination: dest, title: title };
    }
    return this.pos - startpos;
};

// Parse the next inline element in subject, advancing subject position.
// On success, add the result to block's children and return true.
// On failure, return false.
var parseInline = function(block) {
    var res = false;
    var c = this.peek();
    if (c === -1) {
        return false;
    }
    switch(c) {
    case C_NEWLINE:
        res = this.parseNewline(block);
        break;
    case C_BACKSLASH:
        res = this.parseBackslash(block);
        break;
    case C_BACKTICK:
        res = this.parseBackticks(block);
        break;
    case C_ASTERISK:
    case C_UNDERSCORE:
        res = this.handleDelim(c, block);
        break;
    case C_SINGLEQUOTE:
    case C_DOUBLEQUOTE:
        res = this.options.smart && this.handleDelim(c, block);
        break;
    case C_OPEN_BRACKET:
        res = this.parseOpenBracket(block);
        break;
    case C_BANG:
        res = this.parseBang(block);
        break;
    case C_CLOSE_BRACKET:
        res = this.parseCloseBracket(block);
        break;
    case C_LESSTHAN:
        res = this.parseAutolink(block) || this.parseHtmlTag(block);
        break;
    case C_AMPERSAND:
        res = this.parseEntity(block);
        break;
    default:
        res = this.parseString(block);
        break;
    }
    if (!res) {
        this.pos += 1;
        block.appendChild(text(fromCodePoint(c)));
    }

    return true;
};

// Parse string content in block into inline children,
// using refmap to resolve references.
var parseInlines = function(block) {
    this.subject = block._string_content.trim();
    this.pos = 0;
    this.delimiters = null;
    while (this.parseInline(block)) {
    }
    block._string_content = null; // allow raw string to be garbage collected
    this.processEmphasis(null);
};

// The InlineParser object.
function InlineParser(options){
    return {
        subject: '',
        delimiters: null,  // used by handleDelim method
        pos: 0,
        refmap: {},
        match: match,
        peek: peek,
        spnl: spnl,
        parseBackticks: parseBackticks,
        parseBackslash: parseBackslash,
        parseAutolink: parseAutolink,
        parseHtmlTag: parseHtmlTag,
        scanDelims: scanDelims,
        handleDelim: handleDelim,
        parseLinkTitle: parseLinkTitle,
        parseLinkDestination: parseLinkDestination,
        parseLinkLabel: parseLinkLabel,
        parseOpenBracket: parseOpenBracket,
        parseCloseBracket: parseCloseBracket,
        parseBang: parseBang,
        parseEntity: parseEntity,
        parseString: parseString,
        parseNewline: parseNewline,
        parseReference: parseReference,
        parseInline: parseInline,
        processEmphasis: processEmphasis,
        removeDelimiter: removeDelimiter,
        options: options || {},
        parse: parseInlines
    };
}

module.exports = InlineParser;

},{"./common":115,"./from-code-point.js":118,"./html5-entities.js":120,"./node":123,"./normalize-reference":124}],123:[function(require,module,exports){
"use strict";

function isContainer(node) {
    switch (node._type) {
    case 'Document':
    case 'BlockQuote':
    case 'List':
    case 'Item':
    case 'Paragraph':
    case 'Header':
    case 'Emph':
    case 'Strong':
    case 'Link':
    case 'Image':
        return true;
    default:
        return false;
    }
}

var resumeAt = function(node, entering) {
    this.current = node;
    this.entering = (entering === true);
};

var next = function(){
    var cur = this.current;
    var entering = this.entering;

    if (cur === null) {
        return null;
    }

    var container = isContainer(cur);

    if (entering && container) {
        if (cur._firstChild) {
            this.current = cur._firstChild;
            this.entering = true;
        } else {
            // stay on node but exit
            this.entering = false;
        }

    } else if (cur === this.root) {
        this.current = null;

    } else if (cur._next === null) {
        this.current = cur._parent;
        this.entering = false;

    } else {
        this.current = cur._next;
        this.entering = true;
    }

    return {entering: entering, node: cur};
};

var NodeWalker = function(root) {
    return { current: root,
             root: root,
             entering: true,
             next: next,
             resumeAt: resumeAt };
};

var Node = function(nodeType, sourcepos) {
    this._type = nodeType;
    this._parent = null;
    this._firstChild = null;
    this._lastChild = null;
    this._prev = null;
    this._next = null;
    this._sourcepos = sourcepos;
    this._lastLineBlank = false;
    this._open = true;
    this._string_content = null;
    this._literal = null;
    this._listData = null;
    this._info = null;
    this._destination = null;
    this._title = null;
    this._isFenced = false;
    this._fenceChar = null;
    this._fenceLength = 0;
    this._fenceOffset = null;
    this._level = null;
};

var proto = Node.prototype;

Object.defineProperty(proto, 'isContainer', {
    get: function () { return isContainer(this); }
});

Object.defineProperty(proto, 'type', {
    get: function() { return this._type; }
});

Object.defineProperty(proto, 'firstChild', {
    get: function() { return this._firstChild; }
});

Object.defineProperty(proto, 'lastChild', {
    get: function() { return this._lastChild; }
});

Object.defineProperty(proto, 'next', {
    get: function() { return this._next; }
});

Object.defineProperty(proto, 'prev', {
    get: function() { return this._prev; }
});

Object.defineProperty(proto, 'parent', {
    get: function() { return this._parent; }
});

Object.defineProperty(proto, 'sourcepos', {
    get: function() { return this._sourcepos; }
});

Object.defineProperty(proto, 'literal', {
    get: function() { return this._literal; },
    set: function(s) { this._literal = s; }
});

Object.defineProperty(proto, 'destination', {
    get: function() { return this._destination; },
    set: function(s) { this._destination = s; }
});

Object.defineProperty(proto, 'title', {
    get: function() { return this._title; },
    set: function(s) { this._title = s; }
});

Object.defineProperty(proto, 'info', {
    get: function() { return this._info; },
    set: function(s) { this._info = s; }
});

Object.defineProperty(proto, 'level', {
    get: function() { return this._level; },
    set: function(s) { this._level = s; }
});

Object.defineProperty(proto, 'listType', {
    get: function() { return this._listData.type; },
    set: function(t) { this._listData.type = t; }
});

Object.defineProperty(proto, 'listTight', {
    get: function() { return this._listData.tight; },
    set: function(t) { this._listData.tight = t; }
});

Object.defineProperty(proto, 'listStart', {
    get: function() { return this._listData.start; },
    set: function(n) { this._listData.start = n; }
});

Object.defineProperty(proto, 'listDelimiter', {
    get: function() { return this._listData.delimiter; },
    set: function(delim) { this._listData.delimiter = delim; }
});

Node.prototype.appendChild = function(child) {
    child.unlink();
    child._parent = this;
    if (this._lastChild) {
        this._lastChild._next = child;
        child._prev = this._lastChild;
        this._lastChild = child;
    } else {
        this._firstChild = child;
        this._lastChild = child;
    }
};

Node.prototype.prependChild = function(child) {
    child.unlink();
    child._parent = this;
    if (this._firstChild) {
        this._firstChild._prev = child;
        child._next = this._firstChild;
        this._firstChild = child;
    } else {
        this._firstChild = child;
        this._lastChild = child;
    }
};

Node.prototype.unlink = function() {
    if (this._prev) {
        this._prev._next = this._next;
    } else if (this._parent) {
        this._parent._firstChild = this._next;
    }
    if (this._next) {
        this._next._prev = this._prev;
    } else if (this._parent) {
        this._parent._lastChild = this._prev;
    }
    this._parent = null;
    this._next = null;
    this._prev = null;
};

Node.prototype.insertAfter = function(sibling) {
    sibling.unlink();
    sibling._next = this._next;
    if (sibling._next) {
        sibling._next._prev = sibling;
    }
    sibling._prev = this;
    this._next = sibling;
    sibling._parent = this._parent;
    if (!sibling._next) {
        sibling._parent._lastChild = sibling;
    }
};

Node.prototype.insertBefore = function(sibling) {
    sibling.unlink();
    sibling._prev = this._prev;
    if (sibling._prev) {
        sibling._prev._next = sibling;
    }
    sibling._next = this;
    this._prev = sibling;
    sibling._parent = this._parent;
    if (!sibling._prev) {
        sibling._parent._firstChild = sibling;
    }
};

Node.prototype.walker = function() {
    var walker = new NodeWalker(this);
    return walker;
};

module.exports = Node;


/* Example of use of walker:

 var walker = w.walker();
 var event;

 while (event = walker.next()) {
 console.log(event.entering, event.node.type);
 }

 */

},{}],124:[function(require,module,exports){
"use strict";

/* The bulk of this code derives from https://github.com/dmoscrop/fold-case
But in addition to case-folding, we also normalize whitespace.

fold-case is Copyright Mathias Bynens <https://mathiasbynens.be/>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*eslint-disable  key-spacing, comma-spacing */

var regex = /[ \t\r\n]+|[A-Z\xB5\xC0-\xD6\xD8-\xDF\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u0149\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u017F\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C5\u01C7\u01C8\u01CA\u01CB\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F0-\u01F2\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0345\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03AB\u03B0\u03C2\u03CF-\u03D1\u03D5\u03D6\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F0\u03F1\u03F4\u03F5\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u0587\u10A0-\u10C5\u10C7\u10CD\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E96-\u1E9B\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F50\u1F52\u1F54\u1F56\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1F80-\u1FAF\u1FB2-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD2\u1FD3\u1FD6-\u1FDB\u1FE2-\u1FE4\u1FE6-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A\u212B\u2132\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0\uA7B1\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A]|\uD801[\uDC00-\uDC27]|\uD806[\uDCA0-\uDCBF]/g;

var map = {'A':'a','B':'b','C':'c','D':'d','E':'e','F':'f','G':'g','H':'h','I':'i','J':'j','K':'k','L':'l','M':'m','N':'n','O':'o','P':'p','Q':'q','R':'r','S':'s','T':'t','U':'u','V':'v','W':'w','X':'x','Y':'y','Z':'z','\xB5':'\u03BC','\xC0':'\xE0','\xC1':'\xE1','\xC2':'\xE2','\xC3':'\xE3','\xC4':'\xE4','\xC5':'\xE5','\xC6':'\xE6','\xC7':'\xE7','\xC8':'\xE8','\xC9':'\xE9','\xCA':'\xEA','\xCB':'\xEB','\xCC':'\xEC','\xCD':'\xED','\xCE':'\xEE','\xCF':'\xEF','\xD0':'\xF0','\xD1':'\xF1','\xD2':'\xF2','\xD3':'\xF3','\xD4':'\xF4','\xD5':'\xF5','\xD6':'\xF6','\xD8':'\xF8','\xD9':'\xF9','\xDA':'\xFA','\xDB':'\xFB','\xDC':'\xFC','\xDD':'\xFD','\xDE':'\xFE','\u0100':'\u0101','\u0102':'\u0103','\u0104':'\u0105','\u0106':'\u0107','\u0108':'\u0109','\u010A':'\u010B','\u010C':'\u010D','\u010E':'\u010F','\u0110':'\u0111','\u0112':'\u0113','\u0114':'\u0115','\u0116':'\u0117','\u0118':'\u0119','\u011A':'\u011B','\u011C':'\u011D','\u011E':'\u011F','\u0120':'\u0121','\u0122':'\u0123','\u0124':'\u0125','\u0126':'\u0127','\u0128':'\u0129','\u012A':'\u012B','\u012C':'\u012D','\u012E':'\u012F','\u0132':'\u0133','\u0134':'\u0135','\u0136':'\u0137','\u0139':'\u013A','\u013B':'\u013C','\u013D':'\u013E','\u013F':'\u0140','\u0141':'\u0142','\u0143':'\u0144','\u0145':'\u0146','\u0147':'\u0148','\u014A':'\u014B','\u014C':'\u014D','\u014E':'\u014F','\u0150':'\u0151','\u0152':'\u0153','\u0154':'\u0155','\u0156':'\u0157','\u0158':'\u0159','\u015A':'\u015B','\u015C':'\u015D','\u015E':'\u015F','\u0160':'\u0161','\u0162':'\u0163','\u0164':'\u0165','\u0166':'\u0167','\u0168':'\u0169','\u016A':'\u016B','\u016C':'\u016D','\u016E':'\u016F','\u0170':'\u0171','\u0172':'\u0173','\u0174':'\u0175','\u0176':'\u0177','\u0178':'\xFF','\u0179':'\u017A','\u017B':'\u017C','\u017D':'\u017E','\u017F':'s','\u0181':'\u0253','\u0182':'\u0183','\u0184':'\u0185','\u0186':'\u0254','\u0187':'\u0188','\u0189':'\u0256','\u018A':'\u0257','\u018B':'\u018C','\u018E':'\u01DD','\u018F':'\u0259','\u0190':'\u025B','\u0191':'\u0192','\u0193':'\u0260','\u0194':'\u0263','\u0196':'\u0269','\u0197':'\u0268','\u0198':'\u0199','\u019C':'\u026F','\u019D':'\u0272','\u019F':'\u0275','\u01A0':'\u01A1','\u01A2':'\u01A3','\u01A4':'\u01A5','\u01A6':'\u0280','\u01A7':'\u01A8','\u01A9':'\u0283','\u01AC':'\u01AD','\u01AE':'\u0288','\u01AF':'\u01B0','\u01B1':'\u028A','\u01B2':'\u028B','\u01B3':'\u01B4','\u01B5':'\u01B6','\u01B7':'\u0292','\u01B8':'\u01B9','\u01BC':'\u01BD','\u01C4':'\u01C6','\u01C5':'\u01C6','\u01C7':'\u01C9','\u01C8':'\u01C9','\u01CA':'\u01CC','\u01CB':'\u01CC','\u01CD':'\u01CE','\u01CF':'\u01D0','\u01D1':'\u01D2','\u01D3':'\u01D4','\u01D5':'\u01D6','\u01D7':'\u01D8','\u01D9':'\u01DA','\u01DB':'\u01DC','\u01DE':'\u01DF','\u01E0':'\u01E1','\u01E2':'\u01E3','\u01E4':'\u01E5','\u01E6':'\u01E7','\u01E8':'\u01E9','\u01EA':'\u01EB','\u01EC':'\u01ED','\u01EE':'\u01EF','\u01F1':'\u01F3','\u01F2':'\u01F3','\u01F4':'\u01F5','\u01F6':'\u0195','\u01F7':'\u01BF','\u01F8':'\u01F9','\u01FA':'\u01FB','\u01FC':'\u01FD','\u01FE':'\u01FF','\u0200':'\u0201','\u0202':'\u0203','\u0204':'\u0205','\u0206':'\u0207','\u0208':'\u0209','\u020A':'\u020B','\u020C':'\u020D','\u020E':'\u020F','\u0210':'\u0211','\u0212':'\u0213','\u0214':'\u0215','\u0216':'\u0217','\u0218':'\u0219','\u021A':'\u021B','\u021C':'\u021D','\u021E':'\u021F','\u0220':'\u019E','\u0222':'\u0223','\u0224':'\u0225','\u0226':'\u0227','\u0228':'\u0229','\u022A':'\u022B','\u022C':'\u022D','\u022E':'\u022F','\u0230':'\u0231','\u0232':'\u0233','\u023A':'\u2C65','\u023B':'\u023C','\u023D':'\u019A','\u023E':'\u2C66','\u0241':'\u0242','\u0243':'\u0180','\u0244':'\u0289','\u0245':'\u028C','\u0246':'\u0247','\u0248':'\u0249','\u024A':'\u024B','\u024C':'\u024D','\u024E':'\u024F','\u0345':'\u03B9','\u0370':'\u0371','\u0372':'\u0373','\u0376':'\u0377','\u037F':'\u03F3','\u0386':'\u03AC','\u0388':'\u03AD','\u0389':'\u03AE','\u038A':'\u03AF','\u038C':'\u03CC','\u038E':'\u03CD','\u038F':'\u03CE','\u0391':'\u03B1','\u0392':'\u03B2','\u0393':'\u03B3','\u0394':'\u03B4','\u0395':'\u03B5','\u0396':'\u03B6','\u0397':'\u03B7','\u0398':'\u03B8','\u0399':'\u03B9','\u039A':'\u03BA','\u039B':'\u03BB','\u039C':'\u03BC','\u039D':'\u03BD','\u039E':'\u03BE','\u039F':'\u03BF','\u03A0':'\u03C0','\u03A1':'\u03C1','\u03A3':'\u03C3','\u03A4':'\u03C4','\u03A5':'\u03C5','\u03A6':'\u03C6','\u03A7':'\u03C7','\u03A8':'\u03C8','\u03A9':'\u03C9','\u03AA':'\u03CA','\u03AB':'\u03CB','\u03C2':'\u03C3','\u03CF':'\u03D7','\u03D0':'\u03B2','\u03D1':'\u03B8','\u03D5':'\u03C6','\u03D6':'\u03C0','\u03D8':'\u03D9','\u03DA':'\u03DB','\u03DC':'\u03DD','\u03DE':'\u03DF','\u03E0':'\u03E1','\u03E2':'\u03E3','\u03E4':'\u03E5','\u03E6':'\u03E7','\u03E8':'\u03E9','\u03EA':'\u03EB','\u03EC':'\u03ED','\u03EE':'\u03EF','\u03F0':'\u03BA','\u03F1':'\u03C1','\u03F4':'\u03B8','\u03F5':'\u03B5','\u03F7':'\u03F8','\u03F9':'\u03F2','\u03FA':'\u03FB','\u03FD':'\u037B','\u03FE':'\u037C','\u03FF':'\u037D','\u0400':'\u0450','\u0401':'\u0451','\u0402':'\u0452','\u0403':'\u0453','\u0404':'\u0454','\u0405':'\u0455','\u0406':'\u0456','\u0407':'\u0457','\u0408':'\u0458','\u0409':'\u0459','\u040A':'\u045A','\u040B':'\u045B','\u040C':'\u045C','\u040D':'\u045D','\u040E':'\u045E','\u040F':'\u045F','\u0410':'\u0430','\u0411':'\u0431','\u0412':'\u0432','\u0413':'\u0433','\u0414':'\u0434','\u0415':'\u0435','\u0416':'\u0436','\u0417':'\u0437','\u0418':'\u0438','\u0419':'\u0439','\u041A':'\u043A','\u041B':'\u043B','\u041C':'\u043C','\u041D':'\u043D','\u041E':'\u043E','\u041F':'\u043F','\u0420':'\u0440','\u0421':'\u0441','\u0422':'\u0442','\u0423':'\u0443','\u0424':'\u0444','\u0425':'\u0445','\u0426':'\u0446','\u0427':'\u0447','\u0428':'\u0448','\u0429':'\u0449','\u042A':'\u044A','\u042B':'\u044B','\u042C':'\u044C','\u042D':'\u044D','\u042E':'\u044E','\u042F':'\u044F','\u0460':'\u0461','\u0462':'\u0463','\u0464':'\u0465','\u0466':'\u0467','\u0468':'\u0469','\u046A':'\u046B','\u046C':'\u046D','\u046E':'\u046F','\u0470':'\u0471','\u0472':'\u0473','\u0474':'\u0475','\u0476':'\u0477','\u0478':'\u0479','\u047A':'\u047B','\u047C':'\u047D','\u047E':'\u047F','\u0480':'\u0481','\u048A':'\u048B','\u048C':'\u048D','\u048E':'\u048F','\u0490':'\u0491','\u0492':'\u0493','\u0494':'\u0495','\u0496':'\u0497','\u0498':'\u0499','\u049A':'\u049B','\u049C':'\u049D','\u049E':'\u049F','\u04A0':'\u04A1','\u04A2':'\u04A3','\u04A4':'\u04A5','\u04A6':'\u04A7','\u04A8':'\u04A9','\u04AA':'\u04AB','\u04AC':'\u04AD','\u04AE':'\u04AF','\u04B0':'\u04B1','\u04B2':'\u04B3','\u04B4':'\u04B5','\u04B6':'\u04B7','\u04B8':'\u04B9','\u04BA':'\u04BB','\u04BC':'\u04BD','\u04BE':'\u04BF','\u04C0':'\u04CF','\u04C1':'\u04C2','\u04C3':'\u04C4','\u04C5':'\u04C6','\u04C7':'\u04C8','\u04C9':'\u04CA','\u04CB':'\u04CC','\u04CD':'\u04CE','\u04D0':'\u04D1','\u04D2':'\u04D3','\u04D4':'\u04D5','\u04D6':'\u04D7','\u04D8':'\u04D9','\u04DA':'\u04DB','\u04DC':'\u04DD','\u04DE':'\u04DF','\u04E0':'\u04E1','\u04E2':'\u04E3','\u04E4':'\u04E5','\u04E6':'\u04E7','\u04E8':'\u04E9','\u04EA':'\u04EB','\u04EC':'\u04ED','\u04EE':'\u04EF','\u04F0':'\u04F1','\u04F2':'\u04F3','\u04F4':'\u04F5','\u04F6':'\u04F7','\u04F8':'\u04F9','\u04FA':'\u04FB','\u04FC':'\u04FD','\u04FE':'\u04FF','\u0500':'\u0501','\u0502':'\u0503','\u0504':'\u0505','\u0506':'\u0507','\u0508':'\u0509','\u050A':'\u050B','\u050C':'\u050D','\u050E':'\u050F','\u0510':'\u0511','\u0512':'\u0513','\u0514':'\u0515','\u0516':'\u0517','\u0518':'\u0519','\u051A':'\u051B','\u051C':'\u051D','\u051E':'\u051F','\u0520':'\u0521','\u0522':'\u0523','\u0524':'\u0525','\u0526':'\u0527','\u0528':'\u0529','\u052A':'\u052B','\u052C':'\u052D','\u052E':'\u052F','\u0531':'\u0561','\u0532':'\u0562','\u0533':'\u0563','\u0534':'\u0564','\u0535':'\u0565','\u0536':'\u0566','\u0537':'\u0567','\u0538':'\u0568','\u0539':'\u0569','\u053A':'\u056A','\u053B':'\u056B','\u053C':'\u056C','\u053D':'\u056D','\u053E':'\u056E','\u053F':'\u056F','\u0540':'\u0570','\u0541':'\u0571','\u0542':'\u0572','\u0543':'\u0573','\u0544':'\u0574','\u0545':'\u0575','\u0546':'\u0576','\u0547':'\u0577','\u0548':'\u0578','\u0549':'\u0579','\u054A':'\u057A','\u054B':'\u057B','\u054C':'\u057C','\u054D':'\u057D','\u054E':'\u057E','\u054F':'\u057F','\u0550':'\u0580','\u0551':'\u0581','\u0552':'\u0582','\u0553':'\u0583','\u0554':'\u0584','\u0555':'\u0585','\u0556':'\u0586','\u10A0':'\u2D00','\u10A1':'\u2D01','\u10A2':'\u2D02','\u10A3':'\u2D03','\u10A4':'\u2D04','\u10A5':'\u2D05','\u10A6':'\u2D06','\u10A7':'\u2D07','\u10A8':'\u2D08','\u10A9':'\u2D09','\u10AA':'\u2D0A','\u10AB':'\u2D0B','\u10AC':'\u2D0C','\u10AD':'\u2D0D','\u10AE':'\u2D0E','\u10AF':'\u2D0F','\u10B0':'\u2D10','\u10B1':'\u2D11','\u10B2':'\u2D12','\u10B3':'\u2D13','\u10B4':'\u2D14','\u10B5':'\u2D15','\u10B6':'\u2D16','\u10B7':'\u2D17','\u10B8':'\u2D18','\u10B9':'\u2D19','\u10BA':'\u2D1A','\u10BB':'\u2D1B','\u10BC':'\u2D1C','\u10BD':'\u2D1D','\u10BE':'\u2D1E','\u10BF':'\u2D1F','\u10C0':'\u2D20','\u10C1':'\u2D21','\u10C2':'\u2D22','\u10C3':'\u2D23','\u10C4':'\u2D24','\u10C5':'\u2D25','\u10C7':'\u2D27','\u10CD':'\u2D2D','\u1E00':'\u1E01','\u1E02':'\u1E03','\u1E04':'\u1E05','\u1E06':'\u1E07','\u1E08':'\u1E09','\u1E0A':'\u1E0B','\u1E0C':'\u1E0D','\u1E0E':'\u1E0F','\u1E10':'\u1E11','\u1E12':'\u1E13','\u1E14':'\u1E15','\u1E16':'\u1E17','\u1E18':'\u1E19','\u1E1A':'\u1E1B','\u1E1C':'\u1E1D','\u1E1E':'\u1E1F','\u1E20':'\u1E21','\u1E22':'\u1E23','\u1E24':'\u1E25','\u1E26':'\u1E27','\u1E28':'\u1E29','\u1E2A':'\u1E2B','\u1E2C':'\u1E2D','\u1E2E':'\u1E2F','\u1E30':'\u1E31','\u1E32':'\u1E33','\u1E34':'\u1E35','\u1E36':'\u1E37','\u1E38':'\u1E39','\u1E3A':'\u1E3B','\u1E3C':'\u1E3D','\u1E3E':'\u1E3F','\u1E40':'\u1E41','\u1E42':'\u1E43','\u1E44':'\u1E45','\u1E46':'\u1E47','\u1E48':'\u1E49','\u1E4A':'\u1E4B','\u1E4C':'\u1E4D','\u1E4E':'\u1E4F','\u1E50':'\u1E51','\u1E52':'\u1E53','\u1E54':'\u1E55','\u1E56':'\u1E57','\u1E58':'\u1E59','\u1E5A':'\u1E5B','\u1E5C':'\u1E5D','\u1E5E':'\u1E5F','\u1E60':'\u1E61','\u1E62':'\u1E63','\u1E64':'\u1E65','\u1E66':'\u1E67','\u1E68':'\u1E69','\u1E6A':'\u1E6B','\u1E6C':'\u1E6D','\u1E6E':'\u1E6F','\u1E70':'\u1E71','\u1E72':'\u1E73','\u1E74':'\u1E75','\u1E76':'\u1E77','\u1E78':'\u1E79','\u1E7A':'\u1E7B','\u1E7C':'\u1E7D','\u1E7E':'\u1E7F','\u1E80':'\u1E81','\u1E82':'\u1E83','\u1E84':'\u1E85','\u1E86':'\u1E87','\u1E88':'\u1E89','\u1E8A':'\u1E8B','\u1E8C':'\u1E8D','\u1E8E':'\u1E8F','\u1E90':'\u1E91','\u1E92':'\u1E93','\u1E94':'\u1E95','\u1E9B':'\u1E61','\u1EA0':'\u1EA1','\u1EA2':'\u1EA3','\u1EA4':'\u1EA5','\u1EA6':'\u1EA7','\u1EA8':'\u1EA9','\u1EAA':'\u1EAB','\u1EAC':'\u1EAD','\u1EAE':'\u1EAF','\u1EB0':'\u1EB1','\u1EB2':'\u1EB3','\u1EB4':'\u1EB5','\u1EB6':'\u1EB7','\u1EB8':'\u1EB9','\u1EBA':'\u1EBB','\u1EBC':'\u1EBD','\u1EBE':'\u1EBF','\u1EC0':'\u1EC1','\u1EC2':'\u1EC3','\u1EC4':'\u1EC5','\u1EC6':'\u1EC7','\u1EC8':'\u1EC9','\u1ECA':'\u1ECB','\u1ECC':'\u1ECD','\u1ECE':'\u1ECF','\u1ED0':'\u1ED1','\u1ED2':'\u1ED3','\u1ED4':'\u1ED5','\u1ED6':'\u1ED7','\u1ED8':'\u1ED9','\u1EDA':'\u1EDB','\u1EDC':'\u1EDD','\u1EDE':'\u1EDF','\u1EE0':'\u1EE1','\u1EE2':'\u1EE3','\u1EE4':'\u1EE5','\u1EE6':'\u1EE7','\u1EE8':'\u1EE9','\u1EEA':'\u1EEB','\u1EEC':'\u1EED','\u1EEE':'\u1EEF','\u1EF0':'\u1EF1','\u1EF2':'\u1EF3','\u1EF4':'\u1EF5','\u1EF6':'\u1EF7','\u1EF8':'\u1EF9','\u1EFA':'\u1EFB','\u1EFC':'\u1EFD','\u1EFE':'\u1EFF','\u1F08':'\u1F00','\u1F09':'\u1F01','\u1F0A':'\u1F02','\u1F0B':'\u1F03','\u1F0C':'\u1F04','\u1F0D':'\u1F05','\u1F0E':'\u1F06','\u1F0F':'\u1F07','\u1F18':'\u1F10','\u1F19':'\u1F11','\u1F1A':'\u1F12','\u1F1B':'\u1F13','\u1F1C':'\u1F14','\u1F1D':'\u1F15','\u1F28':'\u1F20','\u1F29':'\u1F21','\u1F2A':'\u1F22','\u1F2B':'\u1F23','\u1F2C':'\u1F24','\u1F2D':'\u1F25','\u1F2E':'\u1F26','\u1F2F':'\u1F27','\u1F38':'\u1F30','\u1F39':'\u1F31','\u1F3A':'\u1F32','\u1F3B':'\u1F33','\u1F3C':'\u1F34','\u1F3D':'\u1F35','\u1F3E':'\u1F36','\u1F3F':'\u1F37','\u1F48':'\u1F40','\u1F49':'\u1F41','\u1F4A':'\u1F42','\u1F4B':'\u1F43','\u1F4C':'\u1F44','\u1F4D':'\u1F45','\u1F59':'\u1F51','\u1F5B':'\u1F53','\u1F5D':'\u1F55','\u1F5F':'\u1F57','\u1F68':'\u1F60','\u1F69':'\u1F61','\u1F6A':'\u1F62','\u1F6B':'\u1F63','\u1F6C':'\u1F64','\u1F6D':'\u1F65','\u1F6E':'\u1F66','\u1F6F':'\u1F67','\u1FB8':'\u1FB0','\u1FB9':'\u1FB1','\u1FBA':'\u1F70','\u1FBB':'\u1F71','\u1FBE':'\u03B9','\u1FC8':'\u1F72','\u1FC9':'\u1F73','\u1FCA':'\u1F74','\u1FCB':'\u1F75','\u1FD8':'\u1FD0','\u1FD9':'\u1FD1','\u1FDA':'\u1F76','\u1FDB':'\u1F77','\u1FE8':'\u1FE0','\u1FE9':'\u1FE1','\u1FEA':'\u1F7A','\u1FEB':'\u1F7B','\u1FEC':'\u1FE5','\u1FF8':'\u1F78','\u1FF9':'\u1F79','\u1FFA':'\u1F7C','\u1FFB':'\u1F7D','\u2126':'\u03C9','\u212A':'k','\u212B':'\xE5','\u2132':'\u214E','\u2160':'\u2170','\u2161':'\u2171','\u2162':'\u2172','\u2163':'\u2173','\u2164':'\u2174','\u2165':'\u2175','\u2166':'\u2176','\u2167':'\u2177','\u2168':'\u2178','\u2169':'\u2179','\u216A':'\u217A','\u216B':'\u217B','\u216C':'\u217C','\u216D':'\u217D','\u216E':'\u217E','\u216F':'\u217F','\u2183':'\u2184','\u24B6':'\u24D0','\u24B7':'\u24D1','\u24B8':'\u24D2','\u24B9':'\u24D3','\u24BA':'\u24D4','\u24BB':'\u24D5','\u24BC':'\u24D6','\u24BD':'\u24D7','\u24BE':'\u24D8','\u24BF':'\u24D9','\u24C0':'\u24DA','\u24C1':'\u24DB','\u24C2':'\u24DC','\u24C3':'\u24DD','\u24C4':'\u24DE','\u24C5':'\u24DF','\u24C6':'\u24E0','\u24C7':'\u24E1','\u24C8':'\u24E2','\u24C9':'\u24E3','\u24CA':'\u24E4','\u24CB':'\u24E5','\u24CC':'\u24E6','\u24CD':'\u24E7','\u24CE':'\u24E8','\u24CF':'\u24E9','\u2C00':'\u2C30','\u2C01':'\u2C31','\u2C02':'\u2C32','\u2C03':'\u2C33','\u2C04':'\u2C34','\u2C05':'\u2C35','\u2C06':'\u2C36','\u2C07':'\u2C37','\u2C08':'\u2C38','\u2C09':'\u2C39','\u2C0A':'\u2C3A','\u2C0B':'\u2C3B','\u2C0C':'\u2C3C','\u2C0D':'\u2C3D','\u2C0E':'\u2C3E','\u2C0F':'\u2C3F','\u2C10':'\u2C40','\u2C11':'\u2C41','\u2C12':'\u2C42','\u2C13':'\u2C43','\u2C14':'\u2C44','\u2C15':'\u2C45','\u2C16':'\u2C46','\u2C17':'\u2C47','\u2C18':'\u2C48','\u2C19':'\u2C49','\u2C1A':'\u2C4A','\u2C1B':'\u2C4B','\u2C1C':'\u2C4C','\u2C1D':'\u2C4D','\u2C1E':'\u2C4E','\u2C1F':'\u2C4F','\u2C20':'\u2C50','\u2C21':'\u2C51','\u2C22':'\u2C52','\u2C23':'\u2C53','\u2C24':'\u2C54','\u2C25':'\u2C55','\u2C26':'\u2C56','\u2C27':'\u2C57','\u2C28':'\u2C58','\u2C29':'\u2C59','\u2C2A':'\u2C5A','\u2C2B':'\u2C5B','\u2C2C':'\u2C5C','\u2C2D':'\u2C5D','\u2C2E':'\u2C5E','\u2C60':'\u2C61','\u2C62':'\u026B','\u2C63':'\u1D7D','\u2C64':'\u027D','\u2C67':'\u2C68','\u2C69':'\u2C6A','\u2C6B':'\u2C6C','\u2C6D':'\u0251','\u2C6E':'\u0271','\u2C6F':'\u0250','\u2C70':'\u0252','\u2C72':'\u2C73','\u2C75':'\u2C76','\u2C7E':'\u023F','\u2C7F':'\u0240','\u2C80':'\u2C81','\u2C82':'\u2C83','\u2C84':'\u2C85','\u2C86':'\u2C87','\u2C88':'\u2C89','\u2C8A':'\u2C8B','\u2C8C':'\u2C8D','\u2C8E':'\u2C8F','\u2C90':'\u2C91','\u2C92':'\u2C93','\u2C94':'\u2C95','\u2C96':'\u2C97','\u2C98':'\u2C99','\u2C9A':'\u2C9B','\u2C9C':'\u2C9D','\u2C9E':'\u2C9F','\u2CA0':'\u2CA1','\u2CA2':'\u2CA3','\u2CA4':'\u2CA5','\u2CA6':'\u2CA7','\u2CA8':'\u2CA9','\u2CAA':'\u2CAB','\u2CAC':'\u2CAD','\u2CAE':'\u2CAF','\u2CB0':'\u2CB1','\u2CB2':'\u2CB3','\u2CB4':'\u2CB5','\u2CB6':'\u2CB7','\u2CB8':'\u2CB9','\u2CBA':'\u2CBB','\u2CBC':'\u2CBD','\u2CBE':'\u2CBF','\u2CC0':'\u2CC1','\u2CC2':'\u2CC3','\u2CC4':'\u2CC5','\u2CC6':'\u2CC7','\u2CC8':'\u2CC9','\u2CCA':'\u2CCB','\u2CCC':'\u2CCD','\u2CCE':'\u2CCF','\u2CD0':'\u2CD1','\u2CD2':'\u2CD3','\u2CD4':'\u2CD5','\u2CD6':'\u2CD7','\u2CD8':'\u2CD9','\u2CDA':'\u2CDB','\u2CDC':'\u2CDD','\u2CDE':'\u2CDF','\u2CE0':'\u2CE1','\u2CE2':'\u2CE3','\u2CEB':'\u2CEC','\u2CED':'\u2CEE','\u2CF2':'\u2CF3','\uA640':'\uA641','\uA642':'\uA643','\uA644':'\uA645','\uA646':'\uA647','\uA648':'\uA649','\uA64A':'\uA64B','\uA64C':'\uA64D','\uA64E':'\uA64F','\uA650':'\uA651','\uA652':'\uA653','\uA654':'\uA655','\uA656':'\uA657','\uA658':'\uA659','\uA65A':'\uA65B','\uA65C':'\uA65D','\uA65E':'\uA65F','\uA660':'\uA661','\uA662':'\uA663','\uA664':'\uA665','\uA666':'\uA667','\uA668':'\uA669','\uA66A':'\uA66B','\uA66C':'\uA66D','\uA680':'\uA681','\uA682':'\uA683','\uA684':'\uA685','\uA686':'\uA687','\uA688':'\uA689','\uA68A':'\uA68B','\uA68C':'\uA68D','\uA68E':'\uA68F','\uA690':'\uA691','\uA692':'\uA693','\uA694':'\uA695','\uA696':'\uA697','\uA698':'\uA699','\uA69A':'\uA69B','\uA722':'\uA723','\uA724':'\uA725','\uA726':'\uA727','\uA728':'\uA729','\uA72A':'\uA72B','\uA72C':'\uA72D','\uA72E':'\uA72F','\uA732':'\uA733','\uA734':'\uA735','\uA736':'\uA737','\uA738':'\uA739','\uA73A':'\uA73B','\uA73C':'\uA73D','\uA73E':'\uA73F','\uA740':'\uA741','\uA742':'\uA743','\uA744':'\uA745','\uA746':'\uA747','\uA748':'\uA749','\uA74A':'\uA74B','\uA74C':'\uA74D','\uA74E':'\uA74F','\uA750':'\uA751','\uA752':'\uA753','\uA754':'\uA755','\uA756':'\uA757','\uA758':'\uA759','\uA75A':'\uA75B','\uA75C':'\uA75D','\uA75E':'\uA75F','\uA760':'\uA761','\uA762':'\uA763','\uA764':'\uA765','\uA766':'\uA767','\uA768':'\uA769','\uA76A':'\uA76B','\uA76C':'\uA76D','\uA76E':'\uA76F','\uA779':'\uA77A','\uA77B':'\uA77C','\uA77D':'\u1D79','\uA77E':'\uA77F','\uA780':'\uA781','\uA782':'\uA783','\uA784':'\uA785','\uA786':'\uA787','\uA78B':'\uA78C','\uA78D':'\u0265','\uA790':'\uA791','\uA792':'\uA793','\uA796':'\uA797','\uA798':'\uA799','\uA79A':'\uA79B','\uA79C':'\uA79D','\uA79E':'\uA79F','\uA7A0':'\uA7A1','\uA7A2':'\uA7A3','\uA7A4':'\uA7A5','\uA7A6':'\uA7A7','\uA7A8':'\uA7A9','\uA7AA':'\u0266','\uA7AB':'\u025C','\uA7AC':'\u0261','\uA7AD':'\u026C','\uA7B0':'\u029E','\uA7B1':'\u0287','\uFF21':'\uFF41','\uFF22':'\uFF42','\uFF23':'\uFF43','\uFF24':'\uFF44','\uFF25':'\uFF45','\uFF26':'\uFF46','\uFF27':'\uFF47','\uFF28':'\uFF48','\uFF29':'\uFF49','\uFF2A':'\uFF4A','\uFF2B':'\uFF4B','\uFF2C':'\uFF4C','\uFF2D':'\uFF4D','\uFF2E':'\uFF4E','\uFF2F':'\uFF4F','\uFF30':'\uFF50','\uFF31':'\uFF51','\uFF32':'\uFF52','\uFF33':'\uFF53','\uFF34':'\uFF54','\uFF35':'\uFF55','\uFF36':'\uFF56','\uFF37':'\uFF57','\uFF38':'\uFF58','\uFF39':'\uFF59','\uFF3A':'\uFF5A','\uD801\uDC00':'\uD801\uDC28','\uD801\uDC01':'\uD801\uDC29','\uD801\uDC02':'\uD801\uDC2A','\uD801\uDC03':'\uD801\uDC2B','\uD801\uDC04':'\uD801\uDC2C','\uD801\uDC05':'\uD801\uDC2D','\uD801\uDC06':'\uD801\uDC2E','\uD801\uDC07':'\uD801\uDC2F','\uD801\uDC08':'\uD801\uDC30','\uD801\uDC09':'\uD801\uDC31','\uD801\uDC0A':'\uD801\uDC32','\uD801\uDC0B':'\uD801\uDC33','\uD801\uDC0C':'\uD801\uDC34','\uD801\uDC0D':'\uD801\uDC35','\uD801\uDC0E':'\uD801\uDC36','\uD801\uDC0F':'\uD801\uDC37','\uD801\uDC10':'\uD801\uDC38','\uD801\uDC11':'\uD801\uDC39','\uD801\uDC12':'\uD801\uDC3A','\uD801\uDC13':'\uD801\uDC3B','\uD801\uDC14':'\uD801\uDC3C','\uD801\uDC15':'\uD801\uDC3D','\uD801\uDC16':'\uD801\uDC3E','\uD801\uDC17':'\uD801\uDC3F','\uD801\uDC18':'\uD801\uDC40','\uD801\uDC19':'\uD801\uDC41','\uD801\uDC1A':'\uD801\uDC42','\uD801\uDC1B':'\uD801\uDC43','\uD801\uDC1C':'\uD801\uDC44','\uD801\uDC1D':'\uD801\uDC45','\uD801\uDC1E':'\uD801\uDC46','\uD801\uDC1F':'\uD801\uDC47','\uD801\uDC20':'\uD801\uDC48','\uD801\uDC21':'\uD801\uDC49','\uD801\uDC22':'\uD801\uDC4A','\uD801\uDC23':'\uD801\uDC4B','\uD801\uDC24':'\uD801\uDC4C','\uD801\uDC25':'\uD801\uDC4D','\uD801\uDC26':'\uD801\uDC4E','\uD801\uDC27':'\uD801\uDC4F','\uD806\uDCA0':'\uD806\uDCC0','\uD806\uDCA1':'\uD806\uDCC1','\uD806\uDCA2':'\uD806\uDCC2','\uD806\uDCA3':'\uD806\uDCC3','\uD806\uDCA4':'\uD806\uDCC4','\uD806\uDCA5':'\uD806\uDCC5','\uD806\uDCA6':'\uD806\uDCC6','\uD806\uDCA7':'\uD806\uDCC7','\uD806\uDCA8':'\uD806\uDCC8','\uD806\uDCA9':'\uD806\uDCC9','\uD806\uDCAA':'\uD806\uDCCA','\uD806\uDCAB':'\uD806\uDCCB','\uD806\uDCAC':'\uD806\uDCCC','\uD806\uDCAD':'\uD806\uDCCD','\uD806\uDCAE':'\uD806\uDCCE','\uD806\uDCAF':'\uD806\uDCCF','\uD806\uDCB0':'\uD806\uDCD0','\uD806\uDCB1':'\uD806\uDCD1','\uD806\uDCB2':'\uD806\uDCD2','\uD806\uDCB3':'\uD806\uDCD3','\uD806\uDCB4':'\uD806\uDCD4','\uD806\uDCB5':'\uD806\uDCD5','\uD806\uDCB6':'\uD806\uDCD6','\uD806\uDCB7':'\uD806\uDCD7','\uD806\uDCB8':'\uD806\uDCD8','\uD806\uDCB9':'\uD806\uDCD9','\uD806\uDCBA':'\uD806\uDCDA','\uD806\uDCBB':'\uD806\uDCDB','\uD806\uDCBC':'\uD806\uDCDC','\uD806\uDCBD':'\uD806\uDCDD','\uD806\uDCBE':'\uD806\uDCDE','\uD806\uDCBF':'\uD806\uDCDF','\xDF':'ss','\u0130':'i\u0307','\u0149':'\u02BCn','\u01F0':'j\u030C','\u0390':'\u03B9\u0308\u0301','\u03B0':'\u03C5\u0308\u0301','\u0587':'\u0565\u0582','\u1E96':'h\u0331','\u1E97':'t\u0308','\u1E98':'w\u030A','\u1E99':'y\u030A','\u1E9A':'a\u02BE','\u1E9E':'ss','\u1F50':'\u03C5\u0313','\u1F52':'\u03C5\u0313\u0300','\u1F54':'\u03C5\u0313\u0301','\u1F56':'\u03C5\u0313\u0342','\u1F80':'\u1F00\u03B9','\u1F81':'\u1F01\u03B9','\u1F82':'\u1F02\u03B9','\u1F83':'\u1F03\u03B9','\u1F84':'\u1F04\u03B9','\u1F85':'\u1F05\u03B9','\u1F86':'\u1F06\u03B9','\u1F87':'\u1F07\u03B9','\u1F88':'\u1F00\u03B9','\u1F89':'\u1F01\u03B9','\u1F8A':'\u1F02\u03B9','\u1F8B':'\u1F03\u03B9','\u1F8C':'\u1F04\u03B9','\u1F8D':'\u1F05\u03B9','\u1F8E':'\u1F06\u03B9','\u1F8F':'\u1F07\u03B9','\u1F90':'\u1F20\u03B9','\u1F91':'\u1F21\u03B9','\u1F92':'\u1F22\u03B9','\u1F93':'\u1F23\u03B9','\u1F94':'\u1F24\u03B9','\u1F95':'\u1F25\u03B9','\u1F96':'\u1F26\u03B9','\u1F97':'\u1F27\u03B9','\u1F98':'\u1F20\u03B9','\u1F99':'\u1F21\u03B9','\u1F9A':'\u1F22\u03B9','\u1F9B':'\u1F23\u03B9','\u1F9C':'\u1F24\u03B9','\u1F9D':'\u1F25\u03B9','\u1F9E':'\u1F26\u03B9','\u1F9F':'\u1F27\u03B9','\u1FA0':'\u1F60\u03B9','\u1FA1':'\u1F61\u03B9','\u1FA2':'\u1F62\u03B9','\u1FA3':'\u1F63\u03B9','\u1FA4':'\u1F64\u03B9','\u1FA5':'\u1F65\u03B9','\u1FA6':'\u1F66\u03B9','\u1FA7':'\u1F67\u03B9','\u1FA8':'\u1F60\u03B9','\u1FA9':'\u1F61\u03B9','\u1FAA':'\u1F62\u03B9','\u1FAB':'\u1F63\u03B9','\u1FAC':'\u1F64\u03B9','\u1FAD':'\u1F65\u03B9','\u1FAE':'\u1F66\u03B9','\u1FAF':'\u1F67\u03B9','\u1FB2':'\u1F70\u03B9','\u1FB3':'\u03B1\u03B9','\u1FB4':'\u03AC\u03B9','\u1FB6':'\u03B1\u0342','\u1FB7':'\u03B1\u0342\u03B9','\u1FBC':'\u03B1\u03B9','\u1FC2':'\u1F74\u03B9','\u1FC3':'\u03B7\u03B9','\u1FC4':'\u03AE\u03B9','\u1FC6':'\u03B7\u0342','\u1FC7':'\u03B7\u0342\u03B9','\u1FCC':'\u03B7\u03B9','\u1FD2':'\u03B9\u0308\u0300','\u1FD3':'\u03B9\u0308\u0301','\u1FD6':'\u03B9\u0342','\u1FD7':'\u03B9\u0308\u0342','\u1FE2':'\u03C5\u0308\u0300','\u1FE3':'\u03C5\u0308\u0301','\u1FE4':'\u03C1\u0313','\u1FE6':'\u03C5\u0342','\u1FE7':'\u03C5\u0308\u0342','\u1FF2':'\u1F7C\u03B9','\u1FF3':'\u03C9\u03B9','\u1FF4':'\u03CE\u03B9','\u1FF6':'\u03C9\u0342','\u1FF7':'\u03C9\u0342\u03B9','\u1FFC':'\u03C9\u03B9','\uFB00':'ff','\uFB01':'fi','\uFB02':'fl','\uFB03':'ffi','\uFB04':'ffl','\uFB05':'st','\uFB06':'st','\uFB13':'\u0574\u0576','\uFB14':'\u0574\u0565','\uFB15':'\u0574\u056B','\uFB16':'\u057E\u0576','\uFB17':'\u0574\u056D'};

// Normalize reference label: collapse internal whitespace
// to single space, remove leading/trailing whitespace, case fold.
module.exports = function(string) {
    return string.slice(1, string.length - 1).trim().replace(regex, function($0) {
        // Note: there is no need to check `hasOwnProperty($0)` here.
        // If character not found in lookup table, it must be whitespace.
        return map[$0] || ' ';
    });
};

},{}],125:[function(require,module,exports){
"use strict";

var escapeXml = require('./common').escapeXml;

// Helper function to produce an XML tag.
var tag = function(name, attrs, selfclosing) {
    var result = '<' + name;
    if (attrs && attrs.length > 0) {
        var i = 0;
        var attrib;
        while ((attrib = attrs[i]) !== undefined) {
            result += ' ' + attrib[0] + '="' + attrib[1] + '"';
            i++;
        }
    }
    if (selfclosing) {
        result += ' /';
    }

    result += '>';
    return result;
};

var reXMLTag = /\<[^>]*\>/;

var toTagName = function(s) {
    return s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
};

var renderNodes = function(block) {

    var attrs;
    var tagname;
    var walker = block.walker();
    var event, node, entering;
    var buffer = "";
    var lastOut = "\n";
    var disableTags = 0;
    var indentLevel = 0;
    var indent = '  ';
    var unescapedContents;
    var container;
    var selfClosing;
    var nodetype;

    var out = function(s) {
        if (disableTags > 0) {
            buffer += s.replace(reXMLTag, '');
        } else {
            buffer += s;
        }
        lastOut = s;
    };
    var esc = this.escape;
    var cr = function() {
        if (lastOut !== '\n') {
            buffer += '\n';
            lastOut = '\n';
            for (var i = indentLevel; i--;) {
                buffer += indent;
            }
        }
    };

    var options = this.options;

    if (options.time) { console.time("rendering"); }

    buffer += '<?xml version="1.0" encoding="UTF-8"?>\n';
    buffer += '<!DOCTYPE CommonMark SYSTEM "CommonMark.dtd">\n';

    while ((event = walker.next())) {
        entering = event.entering;
        node = event.node;
        nodetype = node.type;

        container = node.isContainer;
        selfClosing = nodetype === 'HorizontalRule' || nodetype === 'Hardbreak' ||
            nodetype === 'Softbreak' || nodetype === 'Image';
        unescapedContents = nodetype === 'Html' || nodetype === 'HtmlInline';
        tagname = toTagName(nodetype);

        if (entering) {

            attrs = [];

            switch (nodetype) {
            case 'List':
                if (node.listType !== null) {
                    attrs.push(['type', node.listType.toLowerCase()]);
                }
                if (node.listStart !== null) {
                    attrs.push(['start', String(node.listStart)]);
                }
                if (node.listTight !== null) {
                    attrs.push(['tight', (node.listTight ? 'true' : 'false')]);
                }
                var delim = node.listDelimiter;
                if (delim !== null) {
                    var delimword = '';
                    if (delim === '.') {
                        delimword = 'period';
                    } else {
                        delimword = 'paren';
                    }
                    attrs.push(['delimiter', delimword]);
                }
                break;
            case 'CodeBlock':
                if (node.info) {
                    attrs.push(['info', node.info]);
                }
                break;
            case 'Header':
                attrs.push(['level', String(node.level)]);
                break;
            case 'Link':
            case 'Image':
                attrs.push(['destination', node.destination]);
                attrs.push(['title', node.title]);
                break;
            default:
                break;
            }
            if (options.sourcepos) {
                var pos = node.sourcepos;
                if (pos) {
                    attrs.push(['sourcepos', String(pos[0][0]) + ':' +
                                String(pos[0][1]) + '-' + String(pos[1][0]) + ':' +
                                String(pos[1][1])]);
                }
            }

            cr();
            out(tag(tagname, attrs, selfClosing));
            if (container) {
                indentLevel += 1;
            } else if (!container && !selfClosing) {
                var lit = node.literal;
                if (lit) {
                    out(unescapedContents ? lit : esc(lit));
                }
                out(tag('/' + tagname));
            }
        } else {
            indentLevel -= 1;
            cr();
            out(tag('/' + tagname));
        }


    }
    if (options.time) { console.timeEnd("rendering"); }
    buffer += '\n';
    return buffer;
};

// The XmlRenderer object.
function XmlRenderer(options){
    return {
        // default options:
        softbreak: '\n', // by default, soft breaks are rendered as newlines in HTML
        // set to "<br />" to make them hard breaks
        // set to " " if you want to ignore line wrapping in source
        escape: escapeXml,
        options: options || {},
        render: renderNodes
    };
}

module.exports = XmlRenderer;

},{"./common":115}],126:[function(require,module,exports){
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
 *
 * parameter     = token "=" ( token / quoted-string )
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
 * obs-text      = %x80-FF
 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
 */
var paramRegExp = /; *([!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) */g
var textRegExp = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/
var tokenRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

/**
 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
 *
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * obs-text    = %x80-FF
 */
var qescRegExp = /\\([\u000b\u0020-\u00ff])/g

/**
 * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
 */
var quoteRegExp = /([\\"])/g

/**
 * RegExp to match type in RFC 6838
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */
var typeRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+\/[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

/**
 * Module exports.
 * @public
 */

exports.format = format
exports.parse = parse

/**
 * Format object to media type.
 *
 * @param {object} obj
 * @return {string}
 * @public
 */

function format(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('argument obj is required')
  }

  var parameters = obj.parameters
  var type = obj.type

  if (!type || !typeRegExp.test(type)) {
    throw new TypeError('invalid type')
  }

  var string = type

  // append parameters
  if (parameters && typeof parameters === 'object') {
    var param
    var params = Object.keys(parameters).sort()

    for (var i = 0; i < params.length; i++) {
      param = params[i]

      if (!tokenRegExp.test(param)) {
        throw new TypeError('invalid parameter name')
      }

      string += '; ' + param + '=' + qstring(parameters[param])
    }
  }

  return string
}

/**
 * Parse media type to object.
 *
 * @param {string|object} string
 * @return {Object}
 * @public
 */

function parse(string) {
  if (!string) {
    throw new TypeError('argument string is required')
  }

  if (typeof string === 'object') {
    // support req/res-like objects as argument
    string = getcontenttype(string)

    if (typeof string !== 'string') {
      throw new TypeError('content-type header is missing from object');
    }
  }

  if (typeof string !== 'string') {
    throw new TypeError('argument string is required to be a string')
  }

  var index = string.indexOf(';')
  var type = index !== -1
    ? string.substr(0, index).trim()
    : string.trim()

  if (!typeRegExp.test(type)) {
    throw new TypeError('invalid media type')
  }

  var key
  var match
  var obj = new ContentType(type.toLowerCase())
  var value

  paramRegExp.lastIndex = index

  while (match = paramRegExp.exec(string)) {
    if (match.index !== index) {
      throw new TypeError('invalid parameter format')
    }

    index += match[0].length
    key = match[1].toLowerCase()
    value = match[2]

    if (value[0] === '"') {
      // remove quotes and escapes
      value = value
        .substr(1, value.length - 2)
        .replace(qescRegExp, '$1')
    }

    obj.parameters[key] = value
  }

  if (index !== -1 && index !== string.length) {
    throw new TypeError('invalid parameter format')
  }

  return obj
}

/**
 * Get content-type from req/res objects.
 *
 * @param {object}
 * @return {Object}
 * @private
 */

function getcontenttype(obj) {
  if (typeof obj.getHeader === 'function') {
    // res-like
    return obj.getHeader('content-type')
  }

  if (typeof obj.headers === 'object') {
    // req-like
    return obj.headers && obj.headers['content-type']
  }
}

/**
 * Quote a string if necessary.
 *
 * @param {string} val
 * @return {string}
 * @private
 */

function qstring(val) {
  var str = String(val)

  // no need to quote tokens
  if (tokenRegExp.test(str)) {
    return str
  }

  if (str.length > 0 && !textRegExp.test(str)) {
    throw new TypeError('invalid parameter value')
  }

  return '"' + str.replace(quoteRegExp, '\\$1') + '"'
}

/**
 * Class to represent a content type.
 * @private
 */
function ContentType(type) {
  this.parameters = Object.create(null)
  this.type = type
}

},{}],127:[function(require,module,exports){
exports.parse = require("./parse");
exports.stringify = require("./stringify");
exports.parseValues = require("./parseValues");
exports.stringifyValues = require("./stringifyValues");

},{"./parse":128,"./parseValues":129,"./stringify":130,"./stringifyValues":131}],128:[function(require,module,exports){
"use strict";

var Parser = require("fastparse");

function unescape(str) {
	return str.replace(/\\(.)/g, "$1");
}

function commentMatch(match, content) {
	this.selector.nodes.push({
		type: "comment",
		content: content
	});
}

function typeMatch(type) {
	return function(match, name) {
		this.selector.nodes.push({
			type: type,
			name: unescape(name)
		});
	};
}

function pseudoClassStartMatch(match, name) {
	var newToken = {
		type: "pseudo-class",
		name: unescape(name),
		content: ""
	};
	this.selector.nodes.push(newToken);
	this.token = newToken;
	this.brackets = 1;
	return "inBrackets";
}

function nestedPseudoClassStartMatch(match, name, after) {
	var newSelector = {
		type: "selector",
		nodes: []
	};
	var newToken = {
		type: "nested-pseudo-class",
		name: unescape(name),
		nodes: [newSelector]
	};
	if(after) {
		newSelector.before = after;
	}
	this.selector.nodes.push(newToken);
	this.stack.push(this.root);
	this.root = newToken;
	this.selector = newSelector;
}

function nestedEnd(match, before) {
	if(this.stack.length > 0) {
		if(before) {
			this.selector.after = before;
		}
		this.root = this.stack.pop();
		this.selector = this.root.nodes[this.root.nodes.length - 1];
	} else {
		this.selector.nodes.push({
			type: "invalid",
			value: match
		});
	}
}

function operatorMatch(match, before, operator, after) {
	var token = {
		type: "operator",
		operator: operator
	};
	if(before) {
		token.before = before;
	}
	if(after) {
		token.after = after;
	}
	this.selector.nodes.push(token);
}

function spacingMatch(match) {
	this.selector.nodes.push({
		type: "spacing",
		value: match
	});
}

function elementMatch(match, namespace, name) {
	var newToken = {
		type: "element",
		name: unescape(name)
	};

	if(namespace) {
		newToken.namespace = unescape(namespace.substr(0, namespace.length - 1));
	}
	this.selector.nodes.push(newToken);
}

function universalMatch(match, namespace) {
	var newToken = {
		type: "universal"
	};
	if(namespace) {
		newToken.namespace = unescape(namespace.substr(0, namespace.length - 1));
	}
	this.selector.nodes.push(newToken);
}

function attributeMatch(match, content) {
	this.selector.nodes.push({
		type: "attribute",
		content: content
	});
}

function invalidMatch(match) {
	this.selector.nodes.push({
		type: "invalid",
		value: match
	});
}

function irrelevantSpacingStartMatch(match) {
	this.selector.before = match;
}

function irrelevantSpacingEndMatch(match) {
	this.selector.after = match;
}

function nextSelectorMatch(match, before, after) {
	var newSelector = {
		type: "selector",
		nodes: []
	};
	if(before) {
		this.selector.after = before;
	}
	if(after) {
		newSelector.before = after;
	}
	this.root.nodes.push(newSelector);
	this.selector = newSelector;
}

function addToCurrent(match) {
	this.token.content += match;
}

function bracketStart(match) {
	this.token.content += match;
	this.brackets++;
}

function bracketEnd(match) {
	if(--this.brackets === 0) {
		return "selector";
	}
	this.token.content += match;
}

var parser = new Parser({
	selector: {
		"/\\*([\\s\\S]*?)\\*/": commentMatch,
		"\\.((?:\\\\.|[A-Za-z_\\-])(?:\\\\.|[A-Za-z_\\-0-9])*)": typeMatch("class"),
		"#((?:\\\\.|[A-Za-z_\\-])(?:\\\\.|[A-Za-z_\\-0-9])*)": typeMatch("id"),
		":(not|matches|has|local|global)\\((\\s*)": nestedPseudoClassStartMatch,
		":((?:\\\\.|[A-Za-z_\\-0-9])+)\\(": pseudoClassStartMatch,
		":((?:\\\\.|[A-Za-z_\\-0-9])+)": typeMatch("pseudo-class"),
		"::((?:\\\\.|[A-Za-z_\\-0-9])+)": typeMatch("pseudo-element"),
		"(\\*\\|)((?:\\\\.|[A-Za-z_\\-0-9])+)": elementMatch,
		"(\\*\\|)\\*": universalMatch,
		"((?:\\\\.|[A-Za-z_\\-0-9])*\\|)?\\*": universalMatch,
		"((?:\\\\.|[A-Za-z_\\-0-9])*\\|)?((?:\\\\.|[A-Za-z_\\-])(?:\\\\.|[A-Za-z_\\-0-9])*)": elementMatch,
		"\\[([^\\]]+)\\]": attributeMatch,
		"(\\s*)\\)": nestedEnd,
		"(\\s*)((?:\\|\\|)|(?:>>)|[>+~])(\\s*)": operatorMatch,
		"(\\s*),(\\s*)": nextSelectorMatch,
		"\\s+$": irrelevantSpacingEndMatch,
		"^\\s+": irrelevantSpacingStartMatch,
		"\\s+": spacingMatch,
		".": invalidMatch
	},
	inBrackets: {
		"/\\*[\\s\\S]*?\\*/": addToCurrent,
		"\"([^\\\\\"]|\\\\.)*\"": addToCurrent,
		"'([^\\\\']|\\\\.)*'": addToCurrent,
		"[^()'\"/]+": addToCurrent,
		"\\(": bracketStart,
		"\\)": bracketEnd,
		".": addToCurrent
	}
});

function parse(str) {
	var selectorNode = {
		type: "selector",
		nodes: []
	};
	var rootNode = {
		type: "selectors",
		nodes: [
			selectorNode
		]
	};
	parser.parse("selector", str, {
		stack: [],
		root: rootNode,
		selector: selectorNode
	});
	return rootNode;
}

module.exports = parse;

},{"fastparse":133}],129:[function(require,module,exports){
"use strict";

var Parser = require("fastparse");

function commentMatch(match, content) {
	this.value.nodes.push({
		type: "comment",
		content: content
	});
}

function spacingMatch(match) {
	var item = this.value.nodes[this.value.nodes.length - 1];
	item.after = (item.after || "") + match;
}

function initialSpacingMatch(match) {
	this.value.before = match;
}

function endSpacingMatch(match) {
	this.value.after = match;
}

function unescapeString(content) {
	return content.replace(/\\([a-fA-F0-9]{2,5}|.)/g, function(escaped) {
		if(escaped.length > 2) {
			var C = parseInt(escaped.substr(1), 16);
			if(C < 0x10000) {
				return String.fromCharCode(C);
			} else {
				return String.fromCharCode(Math.floor((C - 0x10000) / 0x400) + 0xD800) +
					String.fromCharCode((C - 0x10000) % 0x400 + 0xDC00);
			}
		} else {
			return escaped.substr(1);
		}
	});
}

function stringMatch(match, content) {
	var value = unescapeString(content);
	this.value.nodes.push({
		type: "string",
		value: value,
		stringType: match[0]
	});
}

function commaMatch(match, spacing) {
	var newValue = {
		type: "value",
		nodes: []
	};
	if(spacing) {
		newValue.before = spacing;
	}
	this.root.nodes.push(newValue);
	this.value = newValue;
}

function itemMatch(match) {
	this.value.nodes.push({
		type: "item",
		name: match
	});
}

function nestedItemMatch(match, name, spacing) {
	this.stack.push(this.root);
	this.root = {
		type: "nested-item",
		name: name,
		nodes: [
			{ type: "value", nodes: [] }
		]
	};
	if(spacing) {
		this.root.nodes[0].before = spacing;
	}
	this.value.nodes.push(this.root);
	this.value = this.root.nodes[0];
}

function nestedItemEndMatch(match, spacing, remaining) {
	if(this.stack.length === 0) {
		if(spacing) {
			var item = this.value.nodes[this.value.nodes.length - 1];
			item.after = (item.after || "") + spacing;
		}
		this.value.nodes.push({
			type: "invalid",
			value: remaining
		});
	} else {
		if(spacing) {
			this.value.after = spacing;
		}
		this.root = this.stack.pop();
		this.value = this.root.nodes[this.root.nodes.length - 1];
	}
}

function urlMatch(match, innerSpacingBefore, content, innerSpacingAfter) {
	var item = {
		type: "url"
	};
	if(innerSpacingBefore) {
		item.innerSpacingBefore = innerSpacingBefore;
	}
	if(innerSpacingAfter) {
		item.innerSpacingAfter = innerSpacingAfter;
	}
	switch(content[0]) {
		case "\"":
			item.stringType = "\"";
			item.url = unescapeString(content.substr(1, content.length - 2));
			break;
		case "'":
			item.stringType = "'";
			item.url = unescapeString(content.substr(1, content.length - 2));
			break;
		default:
			item.url = unescapeString(content);
			break;
	}
	this.value.nodes.push(item);
}

var parser = new Parser({
	decl: {
		"^\\s+": initialSpacingMatch,
		"/\\*([\\s\\S]*?)\\*/": commentMatch,
		"\"((?:[^\\\\\"]|\\\\.)*)\"": stringMatch,
		"'((?:[^\\\\']|\\\\.)*)'": stringMatch,
		"url\\((\\s*)(\"(?:[^\\\\\"]|\\\\.)*\")(\\s*)\\)": urlMatch,
		"url\\((\\s*)('(?:[^\\\\']|\\\\.)*')(\\s*)\\)": urlMatch,
		"url\\((\\s*)((?:[^\\\\)'\"]|\\\\.)*)(\\s*)\\)": urlMatch,
		"([\\w\-]+)\\((\\s*)": nestedItemMatch,
		"(\\s*)(\\))": nestedItemEndMatch,
		",(\\s*)": commaMatch,
		"\\s+$": endSpacingMatch,
		"\\s+": spacingMatch,
		"[^\\s,\)]+": itemMatch
	}
});

function parseValues(str) {
	var valueNode = {
		type: "value",
		nodes: []
	};
	var rootNode = {
		type: "values",
		nodes: [
			valueNode
		]
	};
	parser.parse("decl", str, {
		stack: [],
		root: rootNode,
		value: valueNode
	});
	return rootNode;
}

module.exports = parseValues;

},{"fastparse":133}],130:[function(require,module,exports){
"use strict";

var stringify;

function escape(str) {
	if(str === "*") {
		return "*";
	}
	return str.replace(/(^[^A-Za-z_\\-]|^\-\-|[^A-Za-z_0-9\\-])/g, "\\$1");
}

function stringifyWithoutBeforeAfter(tree) {
	switch(tree.type) {
	case "selectors":
		return tree.nodes.map(stringify).join(",");
	case "selector":
		return tree.nodes.map(stringify).join("");
	case "element":
		return (typeof tree.namespace === "string" ? escape(tree.namespace) + "|" : "") + escape(tree.name);
	case "class":
		return "." + escape(tree.name);
	case "id":
		return "#" + escape(tree.name);
	case "attribute":
		return "[" + tree.content + "]";
	case "spacing":
		return tree.value;
	case "pseudo-class":
		return ":" + escape(tree.name) + (typeof tree.content === "string" ? "(" + tree.content + ")" : "");
	case "nested-pseudo-class":
		return ":" + escape(tree.name) + "(" + tree.nodes.map(stringify).join(",") + ")";
	case "pseudo-element":
		return "::" + escape(tree.name);
	case "universal":
		return (typeof tree.namespace === "string" ? escape(tree.namespace) + "|" : "") + "*";
	case "operator":
		return tree.operator;
	case "comment":
		return "/*" + tree.content + "*/";
	case "invalid":
		return tree.value;
	}
}


stringify = function stringify(tree) {
	var str = stringifyWithoutBeforeAfter(tree);
	if(tree.before) {
		str = tree.before + str;
	}
	if(tree.after) {
		str = str + tree.after;
	}
	return str;
};

module.exports = stringify;

},{}],131:[function(require,module,exports){
"use strict";

var cssesc = require("cssesc");

var stringify;

function escape(str, stringType) {
	return cssesc(str, {
		quotes: stringType === "\"" ? "double" : "single"
	});
}

function stringifyWithoutBeforeAfter(tree) {
	switch(tree.type) {
	case "values":
		return tree.nodes.map(stringify).join(",");
	case "value":
		return tree.nodes.map(stringify).join("");
	case "item":
		return tree.name;
	case "nested-item":
		return tree.name + "(" + tree.nodes.map(stringify).join(",") + ")";
	case "invalid":
		return tree.value;
	case "comment":
		return "/*" + tree.content + "*/";
	case "string":
		switch(tree.stringType) {
		case "'":
			return "'" + escape(tree.value, "'") + "'";
		case "\"":
			return "\"" + escape(tree.value, "\"") + "\"";
		}
		/* istanbul ignore next */
		throw new Error("Invalid stringType");
	case "url":
		var start = "url(" + (tree.innerSpacingBefore || "");
		var end = (tree.innerSpacingAfter || "") + ")";
		switch(tree.stringType) {
		case "'":
			return start + "'" + tree.url.replace(/'/g, "\\'") + "'" + end;
		case "\"":
			return start + "\"" + tree.url.replace(/"/g, "\\\"") + "\"" + end;
		default:
			return start + tree.url.replace(/("|'|\))/g, "\\$1") + end;
		}
	}
}


stringify = function stringify(tree) {
	var str = stringifyWithoutBeforeAfter(tree);
	if(tree.before) {
		str = tree.before + str;
	}
	if(tree.after) {
		str = str + tree.after;
	}
	return str;
};

module.exports = stringify;

},{"cssesc":132}],132:[function(require,module,exports){
(function (global){
/*! http://mths.be/cssesc v0.1.0 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var merge = function(options, defaults) {
		if (!options) {
			return defaults;
		}
		var key;
		var result = {};
		for (key in defaults) {
			// `if (defaults.hasOwnProperty(key) { … }` is not needed here, since
			// only recognized option names are used
			result[key] = hasOwnProperty.call(options, key)
				? options[key]
				: defaults[key];
		}
		return result;
	};

	/*--------------------------------------------------------------------------*/

	var regexAnySingleEscape = /[\x20-\x2C\x2E\x2F\x3B-\x40\x5B-\x5E\x60\x7B-\x7E]/;
	var regexSingleEscape = /[\x20\x21\x23-\x26\x28-\x2C\x2E\x2F\x3B-\x40\x5B\x5D\x5E\x60\x7B-\x7E]/;
	var regexAlwaysEscape = /['"\\]/;
	var regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;

	// http://mathiasbynens.be/notes/css-escapes#css
	var cssesc = function(string, options) {

		// Handle options
		options = merge(options, cssesc.options);
		if (options.quotes != 'single' && options.quotes != 'double') {
			options.quotes = 'single';
		}
		var quote = options.quotes == 'double' ? '"' : '\'';
		var isIdentifier = options.isIdentifier;

		var firstChar = string.charAt(0);
		var output = '';
		var counter = 0;
		var length = string.length;
		var value;
		var character;
		var codePoint;
		var extra; // used for potential low surrogates

		while (counter < length) {
			character = string.charAt(counter++);
			codePoint = character.charCodeAt();
			// if it’s not a printable ASCII character
			if (codePoint < 0x20 || codePoint > 0x7E) {
				if (codePoint >= 0xD800 && codePoint <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // next character is low surrogate
						codePoint = ((codePoint & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						counter--;
					}
				}
				value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
			} else {
				if (options.escapeEverything) {
					if (regexAnySingleEscape.test(character)) {
						value = '\\' + character;
					} else {
						value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
					}
				// `:` can be escaped as `\:`, but that fails in IE < 8
				} else if (/[\t\n\f\r\x0B:]/.test(character)) {
					if (!isIdentifier && character == ':') {
						value = character;
					} else {
						value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
					}
				} else if (
					character == '\\' ||
					(
						!isIdentifier &&
						(
							(character == '"' && quote == character) ||
							(character == '\'' && quote == character)
						)
					) ||
					(isIdentifier && regexSingleEscape.test(character))
				) {
					value = '\\' + character;
				} else {
					value = character;
				}
			}
			output += value;
		}

		if (isIdentifier) {
			if (/^_/.test(output)) {
				// Prevent IE6 from ignoring the rule altogether (in case this is for an
				// identifier used as a selector)
				output = '\\_' + output.slice(1);
			} else if (/^-[-\d]/.test(output)) {
				output = '\\-' + output.slice(1);
			} else if (/\d/.test(firstChar)) {
				output = '\\3' + firstChar + ' ' + output.slice(1);
			}
		}

		// Remove spaces after `\HEX` escapes that are not followed by a hex digit,
		// since they’re redundant. Note that this is only possible if the escape
		// sequence isn’t preceded by an odd number of backslashes.
		output = output.replace(regexExcessiveSpaces, function($0, $1, $2) {
			if ($1 && $1.length % 2) {
				// it’s not safe to remove the space, so don’t
				return $0;
			}
			// strip the space
			return ($1 || '') + $2;
		});

		if (!isIdentifier && options.wrap) {
			return quote + output + quote;
		}
		return output;
	};

	// Expose default options (so they can be overridden globally)
	cssesc.options = {
		'escapeEverything': false,
		'isIdentifier': false,
		'quotes': 'single',
		'wrap': false
	};

	cssesc.version = '0.1.0';

	/*--------------------------------------------------------------------------*/

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return cssesc;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = cssesc;
		} else { // in Narwhal or RingoJS v0.7.0-
			freeExports.cssesc = cssesc;
		}
	} else { // in Rhino or a web browser
		root.cssesc = cssesc;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],133:[function(require,module,exports){
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

function ignoreFunction() {}

function createReturningFunction(value) {
	return function() {
		return value;
	};
}

function Parser(states) {
	this.states = this.compileStates(states);
}

Parser.prototype.compileStates = function(states) {
	var result = {};
	Object.keys(states).forEach(function(name) {
		result[name] = this.compileState(states[name], states);
	}, this);
	return result;
};

Parser.prototype.compileState = function(state, states) {
	var regExps = [];
	function iterator(str, value) {
		regExps.push({
			groups: Parser.getGroupCount(str),
			regExp: str,
			value: value
		});
	}
	function processState(statePart) {
		if(Array.isArray(statePart)) {
			statePart.forEach(processState);
		} else if(typeof statePart === "object") {
			Object.keys(statePart).forEach(function(key) {
				iterator(key, statePart[key]);
			});
		} else if(typeof statePart === "string") {
			processState(states[statePart]);
		} else {
			throw new Error("Unexpected 'state' format");
		}
	}
	processState(state);
	var total = regExps.map(function(r) {
		return "(" + r.regExp + ")";
	}).join("|");
	var actions = [];
	var pos = 1;
	regExps.forEach(function(r) {
		var fn;
		if(typeof r.value === "function") {
			fn = r.value;
		} else if(typeof r.value === "string") {
			fn = createReturningFunction(r.value);
		} else {
			fn = ignoreFunction;
		}
		actions.push({
			name: r.regExp,
			fn: fn,
			pos: pos,
			pos2: pos + r.groups + 1
		});
		pos += r.groups + 1;
	});
	return {
		regExp: new RegExp(total, "g"),
		actions: actions
	};
};

Parser.getGroupCount = function(regExpStr) {
	return new RegExp("(" + regExpStr + ")|^$").exec("").length - 2;
};

Parser.prototype.parse = function(initialState, string, context) {
	context = context || {};
	var currentState = initialState;
	var currentIndex = 0;
	for(;;) {
		var state = this.states[currentState];
		var regExp = state.regExp;
		regExp.lastIndex = currentIndex;
		var match = regExp.exec(string);
		if(!match) return context;
		var actions = state.actions;
		currentIndex = state.regExp.lastIndex;
		for(var i = 0; i < actions.length; i++) {
			var action = actions[i];
			if(match[action.pos]) {
				var ret = action.fn.apply(context, Array.prototype.slice.call(match, action.pos, action.pos2).concat([state.regExp.lastIndex - match[0].length, match[0].length]));
				if(ret) {
					if(!(ret in this.states))
						throw new Error("State '" + ret + "' doesn't exist");
					currentState = ret;
				}
				break;
			}
		}
	}
};

module.exports = Parser;

},{}],134:[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require('_process'))
},{"_process":93}],135:[function(require,module,exports){
'use strict';

var Stringify = require('./stringify');
var Parse = require('./parse');

module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":136,"./stringify":137}],136:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false,
    allowDots: false
};

internals.parseValues = function (str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[Utils.decode(part)] = '';

            if (options.strictNullHandling) {
                obj[Utils.decode(part)] = null;
            }
        } else {
            var key = Utils.decode(part.slice(0, pos));
            var val = Utils.decode(part.slice(pos + 1));

            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = [].concat(obj[key]).concat(val);
            } else {
                obj[key] = val;
            }
        }
    }

    return obj;
};

internals.parseObject = function (chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(internals.parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = internals.parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = internals.parseObject(chain, val, options);
        }
    }

    return obj;
};

internals.parseKeys = function (givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return internals.parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};
    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : internals.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

    if (
        str === '' ||
        str === null ||
        typeof str === 'undefined'
    ) {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = internals.parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":138}],137:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    arrayPrefixGenerators: {
        brackets: function (prefix) {
            return prefix + '[]';
        },
        indices: function (prefix, key) {
            return prefix + '[' + key + ']';
        },
        repeat: function (prefix) {
            return prefix;
        }
    },
    strictNullHandling: false,
    skipNulls: false,
    encode: true
};

internals.stringify = function (object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (Utils.isBuffer(obj)) {
        obj = String(obj);
    } else if (obj instanceof Date) {
        obj = obj.toISOString();
    } else if (obj === null) {
        if (strictNullHandling) {
            return encode ? Utils.encode(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        if (encode) {
            return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
        }
        return [prefix + '=' + obj];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        } else {
            values = values.concat(internals.stringify(obj[key], prefix + (allowDots ? '.' + key : '[' + key + ']'), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : internals.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : internals.encode;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var objKeys;
    var filter;
    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in internals.arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
    }

    return keys.join(delimiter);
};

},{"./utils":138}],138:[function(require,module,exports){
'use strict';

var hexTable = (function () {
    var array = new Array(256);
    for (var i = 0; i < 256; ++i) {
        array[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

	return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
		return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += (hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; ++j) {
        var key = keys[j];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}],139:[function(require,module,exports){
/*!
 * URI.js - Mutating URLs
 * IPv6 Support
 *
 * Version: 1.16.1
 *
 * Author: Rodney Rehm
 * Web: http://medialize.github.io/URI.js/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *   GPL v3 http://opensource.org/licenses/GPL-3.0
 *
 */

(function (root, factory) {
  'use strict';
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  if (typeof exports === 'object') {
    // Node
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else {
    // Browser globals (root is window)
    root.IPv6 = factory(root);
  }
}(this, function (root) {
  'use strict';

  /*
  var _in = "fe80:0000:0000:0000:0204:61ff:fe9d:f156";
  var _out = IPv6.best(_in);
  var _expected = "fe80::204:61ff:fe9d:f156";

  console.log(_in, _out, _expected, _out === _expected);
  */

  // save current IPv6 variable, if any
  var _IPv6 = root && root.IPv6;

  function bestPresentation(address) {
    // based on:
    // Javascript to test an IPv6 address for proper format, and to
    // present the "best text representation" according to IETF Draft RFC at
    // http://tools.ietf.org/html/draft-ietf-6man-text-addr-representation-04
    // 8 Feb 2010 Rich Brown, Dartware, LLC
    // Please feel free to use this code as long as you provide a link to
    // http://www.intermapper.com
    // http://intermapper.com/support/tools/IPV6-Validator.aspx
    // http://download.dartware.com/thirdparty/ipv6validator.js

    var _address = address.toLowerCase();
    var segments = _address.split(':');
    var length = segments.length;
    var total = 8;

    // trim colons (:: or ::a:b:c… or …a:b:c::)
    if (segments[0] === '' && segments[1] === '' && segments[2] === '') {
      // must have been ::
      // remove first two items
      segments.shift();
      segments.shift();
    } else if (segments[0] === '' && segments[1] === '') {
      // must have been ::xxxx
      // remove the first item
      segments.shift();
    } else if (segments[length - 1] === '' && segments[length - 2] === '') {
      // must have been xxxx::
      segments.pop();
    }

    length = segments.length;

    // adjust total segments for IPv4 trailer
    if (segments[length - 1].indexOf('.') !== -1) {
      // found a "." which means IPv4
      total = 7;
    }

    // fill empty segments them with "0000"
    var pos;
    for (pos = 0; pos < length; pos++) {
      if (segments[pos] === '') {
        break;
      }
    }

    if (pos < total) {
      segments.splice(pos, 1, '0000');
      while (segments.length < total) {
        segments.splice(pos, 0, '0000');
      }

      length = segments.length;
    }

    // strip leading zeros
    var _segments;
    for (var i = 0; i < total; i++) {
      _segments = segments[i].split('');
      for (var j = 0; j < 3 ; j++) {
        if (_segments[0] === '0' && _segments.length > 1) {
          _segments.splice(0,1);
        } else {
          break;
        }
      }

      segments[i] = _segments.join('');
    }

    // find longest sequence of zeroes and coalesce them into one segment
    var best = -1;
    var _best = 0;
    var _current = 0;
    var current = -1;
    var inzeroes = false;
    // i; already declared

    for (i = 0; i < total; i++) {
      if (inzeroes) {
        if (segments[i] === '0') {
          _current += 1;
        } else {
          inzeroes = false;
          if (_current > _best) {
            best = current;
            _best = _current;
          }
        }
      } else {
        if (segments[i] === '0') {
          inzeroes = true;
          current = i;
          _current = 1;
        }
      }
    }

    if (_current > _best) {
      best = current;
      _best = _current;
    }

    if (_best > 1) {
      segments.splice(best, _best, '');
    }

    length = segments.length;

    // assemble remaining segments
    var result = '';
    if (segments[0] === '')  {
      result = ':';
    }

    for (i = 0; i < length; i++) {
      result += segments[i];
      if (i === length - 1) {
        break;
      }

      result += ':';
    }

    if (segments[length - 1] === '') {
      result += ':';
    }

    return result;
  }

  function noConflict() {
    /*jshint validthis: true */
    if (root.IPv6 === this) {
      root.IPv6 = _IPv6;
    }
  
    return this;
  }

  return {
    best: bestPresentation,
    noConflict: noConflict
  };
}));

},{}],140:[function(require,module,exports){
/*!
 * URI.js - Mutating URLs
 * Second Level Domain (SLD) Support
 *
 * Version: 1.16.1
 *
 * Author: Rodney Rehm
 * Web: http://medialize.github.io/URI.js/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *   GPL v3 http://opensource.org/licenses/GPL-3.0
 *
 */

(function (root, factory) {
  'use strict';
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  if (typeof exports === 'object') {
    // Node
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else {
    // Browser globals (root is window)
    root.SecondLevelDomains = factory(root);
  }
}(this, function (root) {
  'use strict';

  // save current SecondLevelDomains variable, if any
  var _SecondLevelDomains = root && root.SecondLevelDomains;

  var SLD = {
    // list of known Second Level Domains
    // converted list of SLDs from https://github.com/gavingmiller/second-level-domains
    // ----
    // publicsuffix.org is more current and actually used by a couple of browsers internally.
    // downside is it also contains domains like "dyndns.org" - which is fine for the security
    // issues browser have to deal with (SOP for cookies, etc) - but is way overboard for URI.js
    // ----
    list: {
      'ac':' com gov mil net org ',
      'ae':' ac co gov mil name net org pro sch ',
      'af':' com edu gov net org ',
      'al':' com edu gov mil net org ',
      'ao':' co ed gv it og pb ',
      'ar':' com edu gob gov int mil net org tur ',
      'at':' ac co gv or ',
      'au':' asn com csiro edu gov id net org ',
      'ba':' co com edu gov mil net org rs unbi unmo unsa untz unze ',
      'bb':' biz co com edu gov info net org store tv ',
      'bh':' biz cc com edu gov info net org ',
      'bn':' com edu gov net org ',
      'bo':' com edu gob gov int mil net org tv ',
      'br':' adm adv agr am arq art ato b bio blog bmd cim cng cnt com coop ecn edu eng esp etc eti far flog fm fnd fot fst g12 ggf gov imb ind inf jor jus lel mat med mil mus net nom not ntr odo org ppg pro psc psi qsl rec slg srv tmp trd tur tv vet vlog wiki zlg ',
      'bs':' com edu gov net org ',
      'bz':' du et om ov rg ',
      'ca':' ab bc mb nb nf nl ns nt nu on pe qc sk yk ',
      'ck':' biz co edu gen gov info net org ',
      'cn':' ac ah bj com cq edu fj gd gov gs gx gz ha hb he hi hl hn jl js jx ln mil net nm nx org qh sc sd sh sn sx tj tw xj xz yn zj ',
      'co':' com edu gov mil net nom org ',
      'cr':' ac c co ed fi go or sa ',
      'cy':' ac biz com ekloges gov ltd name net org parliament press pro tm ',
      'do':' art com edu gob gov mil net org sld web ',
      'dz':' art asso com edu gov net org pol ',
      'ec':' com edu fin gov info med mil net org pro ',
      'eg':' com edu eun gov mil name net org sci ',
      'er':' com edu gov ind mil net org rochest w ',
      'es':' com edu gob nom org ',
      'et':' biz com edu gov info name net org ',
      'fj':' ac biz com info mil name net org pro ',
      'fk':' ac co gov net nom org ',
      'fr':' asso com f gouv nom prd presse tm ',
      'gg':' co net org ',
      'gh':' com edu gov mil org ',
      'gn':' ac com gov net org ',
      'gr':' com edu gov mil net org ',
      'gt':' com edu gob ind mil net org ',
      'gu':' com edu gov net org ',
      'hk':' com edu gov idv net org ',
      'hu':' 2000 agrar bolt casino city co erotica erotika film forum games hotel info ingatlan jogasz konyvelo lakas media news org priv reklam sex shop sport suli szex tm tozsde utazas video ',
      'id':' ac co go mil net or sch web ',
      'il':' ac co gov idf k12 muni net org ',
      'in':' ac co edu ernet firm gen gov i ind mil net nic org res ',
      'iq':' com edu gov i mil net org ',
      'ir':' ac co dnssec gov i id net org sch ',
      'it':' edu gov ',
      'je':' co net org ',
      'jo':' com edu gov mil name net org sch ',
      'jp':' ac ad co ed go gr lg ne or ',
      'ke':' ac co go info me mobi ne or sc ',
      'kh':' com edu gov mil net org per ',
      'ki':' biz com de edu gov info mob net org tel ',
      'km':' asso com coop edu gouv k medecin mil nom notaires pharmaciens presse tm veterinaire ',
      'kn':' edu gov net org ',
      'kr':' ac busan chungbuk chungnam co daegu daejeon es gangwon go gwangju gyeongbuk gyeonggi gyeongnam hs incheon jeju jeonbuk jeonnam k kg mil ms ne or pe re sc seoul ulsan ',
      'kw':' com edu gov net org ',
      'ky':' com edu gov net org ',
      'kz':' com edu gov mil net org ',
      'lb':' com edu gov net org ',
      'lk':' assn com edu gov grp hotel int ltd net ngo org sch soc web ',
      'lr':' com edu gov net org ',
      'lv':' asn com conf edu gov id mil net org ',
      'ly':' com edu gov id med net org plc sch ',
      'ma':' ac co gov m net org press ',
      'mc':' asso tm ',
      'me':' ac co edu gov its net org priv ',
      'mg':' com edu gov mil nom org prd tm ',
      'mk':' com edu gov inf name net org pro ',
      'ml':' com edu gov net org presse ',
      'mn':' edu gov org ',
      'mo':' com edu gov net org ',
      'mt':' com edu gov net org ',
      'mv':' aero biz com coop edu gov info int mil museum name net org pro ',
      'mw':' ac co com coop edu gov int museum net org ',
      'mx':' com edu gob net org ',
      'my':' com edu gov mil name net org sch ',
      'nf':' arts com firm info net other per rec store web ',
      'ng':' biz com edu gov mil mobi name net org sch ',
      'ni':' ac co com edu gob mil net nom org ',
      'np':' com edu gov mil net org ',
      'nr':' biz com edu gov info net org ',
      'om':' ac biz co com edu gov med mil museum net org pro sch ',
      'pe':' com edu gob mil net nom org sld ',
      'ph':' com edu gov i mil net ngo org ',
      'pk':' biz com edu fam gob gok gon gop gos gov net org web ',
      'pl':' art bialystok biz com edu gda gdansk gorzow gov info katowice krakow lodz lublin mil net ngo olsztyn org poznan pwr radom slupsk szczecin torun warszawa waw wroc wroclaw zgora ',
      'pr':' ac biz com edu est gov info isla name net org pro prof ',
      'ps':' com edu gov net org plo sec ',
      'pw':' belau co ed go ne or ',
      'ro':' arts com firm info nom nt org rec store tm www ',
      'rs':' ac co edu gov in org ',
      'sb':' com edu gov net org ',
      'sc':' com edu gov net org ',
      'sh':' co com edu gov net nom org ',
      'sl':' com edu gov net org ',
      'st':' co com consulado edu embaixada gov mil net org principe saotome store ',
      'sv':' com edu gob org red ',
      'sz':' ac co org ',
      'tr':' av bbs bel biz com dr edu gen gov info k12 name net org pol tel tsk tv web ',
      'tt':' aero biz cat co com coop edu gov info int jobs mil mobi museum name net org pro tel travel ',
      'tw':' club com ebiz edu game gov idv mil net org ',
      'mu':' ac co com gov net or org ',
      'mz':' ac co edu gov org ',
      'na':' co com ',
      'nz':' ac co cri geek gen govt health iwi maori mil net org parliament school ',
      'pa':' abo ac com edu gob ing med net nom org sld ',
      'pt':' com edu gov int net nome org publ ',
      'py':' com edu gov mil net org ',
      'qa':' com edu gov mil net org ',
      're':' asso com nom ',
      'ru':' ac adygeya altai amur arkhangelsk astrakhan bashkiria belgorod bir bryansk buryatia cbg chel chelyabinsk chita chukotka chuvashia com dagestan e-burg edu gov grozny int irkutsk ivanovo izhevsk jar joshkar-ola kalmykia kaluga kamchatka karelia kazan kchr kemerovo khabarovsk khakassia khv kirov koenig komi kostroma kranoyarsk kuban kurgan kursk lipetsk magadan mari mari-el marine mil mordovia mosreg msk murmansk nalchik net nnov nov novosibirsk nsk omsk orenburg org oryol penza perm pp pskov ptz rnd ryazan sakhalin samara saratov simbirsk smolensk spb stavropol stv surgut tambov tatarstan tom tomsk tsaritsyn tsk tula tuva tver tyumen udm udmurtia ulan-ude vladikavkaz vladimir vladivostok volgograd vologda voronezh vrn vyatka yakutia yamal yekaterinburg yuzhno-sakhalinsk ',
      'rw':' ac co com edu gouv gov int mil net ',
      'sa':' com edu gov med net org pub sch ',
      'sd':' com edu gov info med net org tv ',
      'se':' a ac b bd c d e f g h i k l m n o org p parti pp press r s t tm u w x y z ',
      'sg':' com edu gov idn net org per ',
      'sn':' art com edu gouv org perso univ ',
      'sy':' com edu gov mil net news org ',
      'th':' ac co go in mi net or ',
      'tj':' ac biz co com edu go gov info int mil name net nic org test web ',
      'tn':' agrinet com defense edunet ens fin gov ind info intl mincom nat net org perso rnrt rns rnu tourism ',
      'tz':' ac co go ne or ',
      'ua':' biz cherkassy chernigov chernovtsy ck cn co com crimea cv dn dnepropetrovsk donetsk dp edu gov if in ivano-frankivsk kh kharkov kherson khmelnitskiy kiev kirovograd km kr ks kv lg lugansk lutsk lviv me mk net nikolaev od odessa org pl poltava pp rovno rv sebastopol sumy te ternopil uzhgorod vinnica vn zaporizhzhe zhitomir zp zt ',
      'ug':' ac co go ne or org sc ',
      'uk':' ac bl british-library co cym gov govt icnet jet lea ltd me mil mod national-library-scotland nel net nhs nic nls org orgn parliament plc police sch scot soc ',
      'us':' dni fed isa kids nsn ',
      'uy':' com edu gub mil net org ',
      've':' co com edu gob info mil net org web ',
      'vi':' co com k12 net org ',
      'vn':' ac biz com edu gov health info int name net org pro ',
      'ye':' co com gov ltd me net org plc ',
      'yu':' ac co edu gov org ',
      'za':' ac agric alt bourse city co cybernet db edu gov grondar iaccess imt inca landesign law mil net ngo nis nom olivetti org pix school tm web ',
      'zm':' ac co com edu gov net org sch '
    },
    // gorhill 2013-10-25: Using indexOf() instead Regexp(). Significant boost
    // in both performance and memory footprint. No initialization required.
    // http://jsperf.com/uri-js-sld-regex-vs-binary-search/4
    // Following methods use lastIndexOf() rather than array.split() in order
    // to avoid any memory allocations.
    has: function(domain) {
      var tldOffset = domain.lastIndexOf('.');
      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
        return false;
      }
      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
      if (sldOffset <= 0 || sldOffset >= (tldOffset-1)) {
        return false;
      }
      var sldList = SLD.list[domain.slice(tldOffset+1)];
      if (!sldList) {
        return false;
      }
      return sldList.indexOf(' ' + domain.slice(sldOffset+1, tldOffset) + ' ') >= 0;
    },
    is: function(domain) {
      var tldOffset = domain.lastIndexOf('.');
      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
        return false;
      }
      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
      if (sldOffset >= 0) {
        return false;
      }
      var sldList = SLD.list[domain.slice(tldOffset+1)];
      if (!sldList) {
        return false;
      }
      return sldList.indexOf(' ' + domain.slice(0, tldOffset) + ' ') >= 0;
    },
    get: function(domain) {
      var tldOffset = domain.lastIndexOf('.');
      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
        return null;
      }
      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
      if (sldOffset <= 0 || sldOffset >= (tldOffset-1)) {
        return null;
      }
      var sldList = SLD.list[domain.slice(tldOffset+1)];
      if (!sldList) {
        return null;
      }
      if (sldList.indexOf(' ' + domain.slice(sldOffset+1, tldOffset) + ' ') < 0) {
        return null;
      }
      return domain.slice(sldOffset+1);
    },
    noConflict: function(){
      if (root.SecondLevelDomains === this) {
        root.SecondLevelDomains = _SecondLevelDomains;
      }
      return this;
    }
  };

  return SLD;
}));

},{}],141:[function(require,module,exports){
/*!
 * URI.js - Mutating URLs
 *
 * Version: 1.16.1
 *
 * Author: Rodney Rehm
 * Web: http://medialize.github.io/URI.js/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *   GPL v3 http://opensource.org/licenses/GPL-3.0
 *
 */
(function (root, factory) {
  'use strict';
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  if (typeof exports === 'object') {
    // Node
    module.exports = factory(require('./punycode'), require('./IPv6'), require('./SecondLevelDomains'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./punycode', './IPv6', './SecondLevelDomains'], factory);
  } else {
    // Browser globals (root is window)
    root.URI = factory(root.punycode, root.IPv6, root.SecondLevelDomains, root);
  }
}(this, function (punycode, IPv6, SLD, root) {
  'use strict';
  /*global location, escape, unescape */
  // FIXME: v2.0.0 renamce non-camelCase properties to uppercase
  /*jshint camelcase: false */

  // save current URI variable, if any
  var _URI = root && root.URI;

  function URI(url, base) {
    var _urlSupplied = arguments.length >= 1;
    var _baseSupplied = arguments.length >= 2;

    // Allow instantiation without the 'new' keyword
    if (!(this instanceof URI)) {
      if (_urlSupplied) {
        if (_baseSupplied) {
          return new URI(url, base);
        }

        return new URI(url);
      }

      return new URI();
    }

    if (url === undefined) {
      if (_urlSupplied) {
        throw new TypeError('undefined is not a valid argument for URI');
      }

      if (typeof location !== 'undefined') {
        url = location.href + '';
      } else {
        url = '';
      }
    }

    this.href(url);

    // resolve to base according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#constructor
    if (base !== undefined) {
      return this.absoluteTo(base);
    }

    return this;
  }

  URI.version = '1.16.1';

  var p = URI.prototype;
  var hasOwn = Object.prototype.hasOwnProperty;

  function escapeRegEx(string) {
    // https://github.com/medialize/URI.js/commit/85ac21783c11f8ccab06106dba9735a31a86924d#commitcomment-821963
    return string.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
  }

  function getType(value) {
    // IE8 doesn't return [Object Undefined] but [Object Object] for undefined value
    if (value === undefined) {
      return 'Undefined';
    }

    return String(Object.prototype.toString.call(value)).slice(8, -1);
  }

  function isArray(obj) {
    return getType(obj) === 'Array';
  }

  function filterArrayValues(data, value) {
    var lookup = {};
    var i, length;

    if (getType(value) === 'RegExp') {
      lookup = null;
    } else if (isArray(value)) {
      for (i = 0, length = value.length; i < length; i++) {
        lookup[value[i]] = true;
      }
    } else {
      lookup[value] = true;
    }

    for (i = 0, length = data.length; i < length; i++) {
      /*jshint laxbreak: true */
      var _match = lookup && lookup[data[i]] !== undefined
        || !lookup && value.test(data[i]);
      /*jshint laxbreak: false */
      if (_match) {
        data.splice(i, 1);
        length--;
        i--;
      }
    }

    return data;
  }

  function arrayContains(list, value) {
    var i, length;

    // value may be string, number, array, regexp
    if (isArray(value)) {
      // Note: this can be optimized to O(n) (instead of current O(m * n))
      for (i = 0, length = value.length; i < length; i++) {
        if (!arrayContains(list, value[i])) {
          return false;
        }
      }

      return true;
    }

    var _type = getType(value);
    for (i = 0, length = list.length; i < length; i++) {
      if (_type === 'RegExp') {
        if (typeof list[i] === 'string' && list[i].match(value)) {
          return true;
        }
      } else if (list[i] === value) {
        return true;
      }
    }

    return false;
  }

  function arraysEqual(one, two) {
    if (!isArray(one) || !isArray(two)) {
      return false;
    }

    // arrays can't be equal if they have different amount of content
    if (one.length !== two.length) {
      return false;
    }

    one.sort();
    two.sort();

    for (var i = 0, l = one.length; i < l; i++) {
      if (one[i] !== two[i]) {
        return false;
      }
    }

    return true;
  }

  URI._parts = function() {
    return {
      protocol: null,
      username: null,
      password: null,
      hostname: null,
      urn: null,
      port: null,
      path: null,
      query: null,
      fragment: null,
      // state
      duplicateQueryParameters: URI.duplicateQueryParameters,
      escapeQuerySpace: URI.escapeQuerySpace
    };
  };
  // state: allow duplicate query parameters (a=1&a=1)
  URI.duplicateQueryParameters = false;
  // state: replaces + with %20 (space in query strings)
  URI.escapeQuerySpace = true;
  // static properties
  URI.protocol_expression = /^[a-z][a-z0-9.+-]*$/i;
  URI.idn_expression = /[^a-z0-9\.-]/i;
  URI.punycode_expression = /(xn--)/i;
  // well, 333.444.555.666 matches, but it sure ain't no IPv4 - do we care?
  URI.ip4_expression = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  // credits to Rich Brown
  // source: http://forums.intermapper.com/viewtopic.php?p=1096#1096
  // specification: http://www.ietf.org/rfc/rfc4291.txt
  URI.ip6_expression = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
  // expression used is "gruber revised" (@gruber v2) determined to be the
  // best solution in a regex-golf we did a couple of ages ago at
  // * http://mathiasbynens.be/demo/url-regex
  // * http://rodneyrehm.de/t/url-regex.html
  URI.find_uri_expression = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
  URI.findUri = {
    // valid "scheme://" or "www."
    start: /\b(?:([a-z][a-z0-9.+-]*:\/\/)|www\.)/gi,
    // everything up to the next whitespace
    end: /[\s\r\n]|$/,
    // trim trailing punctuation captured by end RegExp
    trim: /[`!()\[\]{};:'".,<>?«»“”„‘’]+$/
  };
  // http://www.iana.org/assignments/uri-schemes.html
  // http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports
  URI.defaultPorts = {
    http: '80',
    https: '443',
    ftp: '21',
    gopher: '70',
    ws: '80',
    wss: '443'
  };
  // allowed hostname characters according to RFC 3986
  // ALPHA DIGIT "-" "." "_" "~" "!" "$" "&" "'" "(" ")" "*" "+" "," ";" "=" %encoded
  // I've never seen a (non-IDN) hostname other than: ALPHA DIGIT . -
  URI.invalid_hostname_characters = /[^a-zA-Z0-9\.-]/;
  // map DOM Elements to their URI attribute
  URI.domAttributes = {
    'a': 'href',
    'blockquote': 'cite',
    'link': 'href',
    'base': 'href',
    'script': 'src',
    'form': 'action',
    'img': 'src',
    'area': 'href',
    'iframe': 'src',
    'embed': 'src',
    'source': 'src',
    'track': 'src',
    'input': 'src', // but only if type="image"
    'audio': 'src',
    'video': 'src'
  };
  URI.getDomAttribute = function(node) {
    if (!node || !node.nodeName) {
      return undefined;
    }

    var nodeName = node.nodeName.toLowerCase();
    // <input> should only expose src for type="image"
    if (nodeName === 'input' && node.type !== 'image') {
      return undefined;
    }

    return URI.domAttributes[nodeName];
  };

  function escapeForDumbFirefox36(value) {
    // https://github.com/medialize/URI.js/issues/91
    return escape(value);
  }

  // encoding / decoding according to RFC3986
  function strictEncodeURIComponent(string) {
    // see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/encodeURIComponent
    return encodeURIComponent(string)
      .replace(/[!'()*]/g, escapeForDumbFirefox36)
      .replace(/\*/g, '%2A');
  }
  URI.encode = strictEncodeURIComponent;
  URI.decode = decodeURIComponent;
  URI.iso8859 = function() {
    URI.encode = escape;
    URI.decode = unescape;
  };
  URI.unicode = function() {
    URI.encode = strictEncodeURIComponent;
    URI.decode = decodeURIComponent;
  };
  URI.characters = {
    pathname: {
      encode: {
        // RFC3986 2.1: For consistency, URI producers and normalizers should
        // use uppercase hexadecimal digits for all percent-encodings.
        expression: /%(24|26|2B|2C|3B|3D|3A|40)/ig,
        map: {
          // -._~!'()*
          '%24': '$',
          '%26': '&',
          '%2B': '+',
          '%2C': ',',
          '%3B': ';',
          '%3D': '=',
          '%3A': ':',
          '%40': '@'
        }
      },
      decode: {
        expression: /[\/\?#]/g,
        map: {
          '/': '%2F',
          '?': '%3F',
          '#': '%23'
        }
      }
    },
    reserved: {
      encode: {
        // RFC3986 2.1: For consistency, URI producers and normalizers should
        // use uppercase hexadecimal digits for all percent-encodings.
        expression: /%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/ig,
        map: {
          // gen-delims
          '%3A': ':',
          '%2F': '/',
          '%3F': '?',
          '%23': '#',
          '%5B': '[',
          '%5D': ']',
          '%40': '@',
          // sub-delims
          '%21': '!',
          '%24': '$',
          '%26': '&',
          '%27': '\'',
          '%28': '(',
          '%29': ')',
          '%2A': '*',
          '%2B': '+',
          '%2C': ',',
          '%3B': ';',
          '%3D': '='
        }
      }
    },
    urnpath: {
      // The characters under `encode` are the characters called out by RFC 2141 as being acceptable
      // for usage in a URN. RFC2141 also calls out "-", ".", and "_" as acceptable characters, but
      // these aren't encoded by encodeURIComponent, so we don't have to call them out here. Also
      // note that the colon character is not featured in the encoding map; this is because URI.js
      // gives the colons in URNs semantic meaning as the delimiters of path segements, and so it
      // should not appear unencoded in a segment itself.
      // See also the note above about RFC3986 and capitalalized hex digits.
      encode: {
        expression: /%(21|24|27|28|29|2A|2B|2C|3B|3D|40)/ig,
        map: {
          '%21': '!',
          '%24': '$',
          '%27': '\'',
          '%28': '(',
          '%29': ')',
          '%2A': '*',
          '%2B': '+',
          '%2C': ',',
          '%3B': ';',
          '%3D': '=',
          '%40': '@'
        }
      },
      // These characters are the characters called out by RFC2141 as "reserved" characters that
      // should never appear in a URN, plus the colon character (see note above).
      decode: {
        expression: /[\/\?#:]/g,
        map: {
          '/': '%2F',
          '?': '%3F',
          '#': '%23',
          ':': '%3A'
        }
      }
    }
  };
  URI.encodeQuery = function(string, escapeQuerySpace) {
    var escaped = URI.encode(string + '');
    if (escapeQuerySpace === undefined) {
      escapeQuerySpace = URI.escapeQuerySpace;
    }

    return escapeQuerySpace ? escaped.replace(/%20/g, '+') : escaped;
  };
  URI.decodeQuery = function(string, escapeQuerySpace) {
    string += '';
    if (escapeQuerySpace === undefined) {
      escapeQuerySpace = URI.escapeQuerySpace;
    }

    try {
      return URI.decode(escapeQuerySpace ? string.replace(/\+/g, '%20') : string);
    } catch(e) {
      // we're not going to mess with weird encodings,
      // give up and return the undecoded original string
      // see https://github.com/medialize/URI.js/issues/87
      // see https://github.com/medialize/URI.js/issues/92
      return string;
    }
  };
  // generate encode/decode path functions
  var _parts = {'encode':'encode', 'decode':'decode'};
  var _part;
  var generateAccessor = function(_group, _part) {
    return function(string) {
      try {
        return URI[_part](string + '').replace(URI.characters[_group][_part].expression, function(c) {
          return URI.characters[_group][_part].map[c];
        });
      } catch (e) {
        // we're not going to mess with weird encodings,
        // give up and return the undecoded original string
        // see https://github.com/medialize/URI.js/issues/87
        // see https://github.com/medialize/URI.js/issues/92
        return string;
      }
    };
  };

  for (_part in _parts) {
    URI[_part + 'PathSegment'] = generateAccessor('pathname', _parts[_part]);
    URI[_part + 'UrnPathSegment'] = generateAccessor('urnpath', _parts[_part]);
  }

  var generateSegmentedPathFunction = function(_sep, _codingFuncName, _innerCodingFuncName) {
    return function(string) {
      // Why pass in names of functions, rather than the function objects themselves? The
      // definitions of some functions (but in particular, URI.decode) will occasionally change due
      // to URI.js having ISO8859 and Unicode modes. Passing in the name and getting it will ensure
      // that the functions we use here are "fresh".
      var actualCodingFunc;
      if (!_innerCodingFuncName) {
        actualCodingFunc = URI[_codingFuncName];
      } else {
        actualCodingFunc = function(string) {
          return URI[_codingFuncName](URI[_innerCodingFuncName](string));
        };
      }

      var segments = (string + '').split(_sep);

      for (var i = 0, length = segments.length; i < length; i++) {
        segments[i] = actualCodingFunc(segments[i]);
      }

      return segments.join(_sep);
    };
  };

  // This takes place outside the above loop because we don't want, e.g., encodeUrnPath functions.
  URI.decodePath = generateSegmentedPathFunction('/', 'decodePathSegment');
  URI.decodeUrnPath = generateSegmentedPathFunction(':', 'decodeUrnPathSegment');
  URI.recodePath = generateSegmentedPathFunction('/', 'encodePathSegment', 'decode');
  URI.recodeUrnPath = generateSegmentedPathFunction(':', 'encodeUrnPathSegment', 'decode');

  URI.encodeReserved = generateAccessor('reserved', 'encode');

  URI.parse = function(string, parts) {
    var pos;
    if (!parts) {
      parts = {};
    }
    // [protocol"://"[username[":"password]"@"]hostname[":"port]"/"?][path]["?"querystring]["#"fragment]

    // extract fragment
    pos = string.indexOf('#');
    if (pos > -1) {
      // escaping?
      parts.fragment = string.substring(pos + 1) || null;
      string = string.substring(0, pos);
    }

    // extract query
    pos = string.indexOf('?');
    if (pos > -1) {
      // escaping?
      parts.query = string.substring(pos + 1) || null;
      string = string.substring(0, pos);
    }

    // extract protocol
    if (string.substring(0, 2) === '//') {
      // relative-scheme
      parts.protocol = null;
      string = string.substring(2);
      // extract "user:pass@host:port"
      string = URI.parseAuthority(string, parts);
    } else {
      pos = string.indexOf(':');
      if (pos > -1) {
        parts.protocol = string.substring(0, pos) || null;
        if (parts.protocol && !parts.protocol.match(URI.protocol_expression)) {
          // : may be within the path
          parts.protocol = undefined;
        } else if (string.substring(pos + 1, pos + 3) === '//') {
          string = string.substring(pos + 3);

          // extract "user:pass@host:port"
          string = URI.parseAuthority(string, parts);
        } else {
          string = string.substring(pos + 1);
          parts.urn = true;
        }
      }
    }

    // what's left must be the path
    parts.path = string;

    // and we're done
    return parts;
  };
  URI.parseHost = function(string, parts) {
    // Copy chrome, IE, opera backslash-handling behavior.
    // Back slashes before the query string get converted to forward slashes
    // See: https://github.com/joyent/node/blob/386fd24f49b0e9d1a8a076592a404168faeecc34/lib/url.js#L115-L124
    // See: https://code.google.com/p/chromium/issues/detail?id=25916
    // https://github.com/medialize/URI.js/pull/233
    string = string.replace(/\\/g, '/');

    // extract host:port
    var pos = string.indexOf('/');
    var bracketPos;
    var t;

    if (pos === -1) {
      pos = string.length;
    }

    if (string.charAt(0) === '[') {
      // IPv6 host - http://tools.ietf.org/html/draft-ietf-6man-text-addr-representation-04#section-6
      // I claim most client software breaks on IPv6 anyways. To simplify things, URI only accepts
      // IPv6+port in the format [2001:db8::1]:80 (for the time being)
      bracketPos = string.indexOf(']');
      parts.hostname = string.substring(1, bracketPos) || null;
      parts.port = string.substring(bracketPos + 2, pos) || null;
      if (parts.port === '/') {
        parts.port = null;
      }
    } else {
      var firstColon = string.indexOf(':');
      var firstSlash = string.indexOf('/');
      var nextColon = string.indexOf(':', firstColon + 1);
      if (nextColon !== -1 && (firstSlash === -1 || nextColon < firstSlash)) {
        // IPv6 host contains multiple colons - but no port
        // this notation is actually not allowed by RFC 3986, but we're a liberal parser
        parts.hostname = string.substring(0, pos) || null;
        parts.port = null;
      } else {
        t = string.substring(0, pos).split(':');
        parts.hostname = t[0] || null;
        parts.port = t[1] || null;
      }
    }

    if (parts.hostname && string.substring(pos).charAt(0) !== '/') {
      pos++;
      string = '/' + string;
    }

    return string.substring(pos) || '/';
  };
  URI.parseAuthority = function(string, parts) {
    string = URI.parseUserinfo(string, parts);
    return URI.parseHost(string, parts);
  };
  URI.parseUserinfo = function(string, parts) {
    // extract username:password
    var firstSlash = string.indexOf('/');
    var pos = string.lastIndexOf('@', firstSlash > -1 ? firstSlash : string.length - 1);
    var t;

    // authority@ must come before /path
    if (pos > -1 && (firstSlash === -1 || pos < firstSlash)) {
      t = string.substring(0, pos).split(':');
      parts.username = t[0] ? URI.decode(t[0]) : null;
      t.shift();
      parts.password = t[0] ? URI.decode(t.join(':')) : null;
      string = string.substring(pos + 1);
    } else {
      parts.username = null;
      parts.password = null;
    }

    return string;
  };
  URI.parseQuery = function(string, escapeQuerySpace) {
    if (!string) {
      return {};
    }

    // throw out the funky business - "?"[name"="value"&"]+
    string = string.replace(/&+/g, '&').replace(/^\?*&*|&+$/g, '');

    if (!string) {
      return {};
    }

    var items = {};
    var splits = string.split('&');
    var length = splits.length;
    var v, name, value;

    for (var i = 0; i < length; i++) {
      v = splits[i].split('=');
      name = URI.decodeQuery(v.shift(), escapeQuerySpace);
      // no "=" is null according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#collect-url-parameters
      value = v.length ? URI.decodeQuery(v.join('='), escapeQuerySpace) : null;

      if (hasOwn.call(items, name)) {
        if (typeof items[name] === 'string' || items[name] === null) {
          items[name] = [items[name]];
        }

        items[name].push(value);
      } else {
        items[name] = value;
      }
    }

    return items;
  };

  URI.build = function(parts) {
    var t = '';

    if (parts.protocol) {
      t += parts.protocol + ':';
    }

    if (!parts.urn && (t || parts.hostname)) {
      t += '//';
    }

    t += (URI.buildAuthority(parts) || '');

    if (typeof parts.path === 'string') {
      if (parts.path.charAt(0) !== '/' && typeof parts.hostname === 'string') {
        t += '/';
      }

      t += parts.path;
    }

    if (typeof parts.query === 'string' && parts.query) {
      t += '?' + parts.query;
    }

    if (typeof parts.fragment === 'string' && parts.fragment) {
      t += '#' + parts.fragment;
    }
    return t;
  };
  URI.buildHost = function(parts) {
    var t = '';

    if (!parts.hostname) {
      return '';
    } else if (URI.ip6_expression.test(parts.hostname)) {
      t += '[' + parts.hostname + ']';
    } else {
      t += parts.hostname;
    }

    if (parts.port) {
      t += ':' + parts.port;
    }

    return t;
  };
  URI.buildAuthority = function(parts) {
    return URI.buildUserinfo(parts) + URI.buildHost(parts);
  };
  URI.buildUserinfo = function(parts) {
    var t = '';

    if (parts.username) {
      t += URI.encode(parts.username);

      if (parts.password) {
        t += ':' + URI.encode(parts.password);
      }

      t += '@';
    }

    return t;
  };
  URI.buildQuery = function(data, duplicateQueryParameters, escapeQuerySpace) {
    // according to http://tools.ietf.org/html/rfc3986 or http://labs.apache.org/webarch/uri/rfc/rfc3986.html
    // being »-._~!$&'()*+,;=:@/?« %HEX and alnum are allowed
    // the RFC explicitly states ?/foo being a valid use case, no mention of parameter syntax!
    // URI.js treats the query string as being application/x-www-form-urlencoded
    // see http://www.w3.org/TR/REC-html40/interact/forms.html#form-content-type

    var t = '';
    var unique, key, i, length;
    for (key in data) {
      if (hasOwn.call(data, key) && key) {
        if (isArray(data[key])) {
          unique = {};
          for (i = 0, length = data[key].length; i < length; i++) {
            if (data[key][i] !== undefined && unique[data[key][i] + ''] === undefined) {
              t += '&' + URI.buildQueryParameter(key, data[key][i], escapeQuerySpace);
              if (duplicateQueryParameters !== true) {
                unique[data[key][i] + ''] = true;
              }
            }
          }
        } else if (data[key] !== undefined) {
          t += '&' + URI.buildQueryParameter(key, data[key], escapeQuerySpace);
        }
      }
    }

    return t.substring(1);
  };
  URI.buildQueryParameter = function(name, value, escapeQuerySpace) {
    // http://www.w3.org/TR/REC-html40/interact/forms.html#form-content-type -- application/x-www-form-urlencoded
    // don't append "=" for null values, according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#url-parameter-serialization
    return URI.encodeQuery(name, escapeQuerySpace) + (value !== null ? '=' + URI.encodeQuery(value, escapeQuerySpace) : '');
  };

  URI.addQuery = function(data, name, value) {
    if (typeof name === 'object') {
      for (var key in name) {
        if (hasOwn.call(name, key)) {
          URI.addQuery(data, key, name[key]);
        }
      }
    } else if (typeof name === 'string') {
      if (data[name] === undefined) {
        data[name] = value;
        return;
      } else if (typeof data[name] === 'string') {
        data[name] = [data[name]];
      }

      if (!isArray(value)) {
        value = [value];
      }

      data[name] = (data[name] || []).concat(value);
    } else {
      throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
    }
  };
  URI.removeQuery = function(data, name, value) {
    var i, length, key;

    if (isArray(name)) {
      for (i = 0, length = name.length; i < length; i++) {
        data[name[i]] = undefined;
      }
    } else if (getType(name) === 'RegExp') {
      for (key in data) {
        if (name.test(key)) {
          data[key] = undefined;
        }
      }
    } else if (typeof name === 'object') {
      for (key in name) {
        if (hasOwn.call(name, key)) {
          URI.removeQuery(data, key, name[key]);
        }
      }
    } else if (typeof name === 'string') {
      if (value !== undefined) {
        if (getType(value) === 'RegExp') {
          if (!isArray(data[name]) && value.test(data[name])) {
            data[name] = undefined;
          } else {
            data[name] = filterArrayValues(data[name], value);
          }
        } else if (data[name] === value) {
          data[name] = undefined;
        } else if (isArray(data[name])) {
          data[name] = filterArrayValues(data[name], value);
        }
      } else {
        data[name] = undefined;
      }
    } else {
      throw new TypeError('URI.removeQuery() accepts an object, string, RegExp as the first parameter');
    }
  };
  URI.hasQuery = function(data, name, value, withinArray) {
    if (typeof name === 'object') {
      for (var key in name) {
        if (hasOwn.call(name, key)) {
          if (!URI.hasQuery(data, key, name[key])) {
            return false;
          }
        }
      }

      return true;
    } else if (typeof name !== 'string') {
      throw new TypeError('URI.hasQuery() accepts an object, string as the name parameter');
    }

    switch (getType(value)) {
      case 'Undefined':
        // true if exists (but may be empty)
        return name in data; // data[name] !== undefined;

      case 'Boolean':
        // true if exists and non-empty
        var _booly = Boolean(isArray(data[name]) ? data[name].length : data[name]);
        return value === _booly;

      case 'Function':
        // allow complex comparison
        return !!value(data[name], name, data);

      case 'Array':
        if (!isArray(data[name])) {
          return false;
        }

        var op = withinArray ? arrayContains : arraysEqual;
        return op(data[name], value);

      case 'RegExp':
        if (!isArray(data[name])) {
          return Boolean(data[name] && data[name].match(value));
        }

        if (!withinArray) {
          return false;
        }

        return arrayContains(data[name], value);

      case 'Number':
        value = String(value);
        /* falls through */
      case 'String':
        if (!isArray(data[name])) {
          return data[name] === value;
        }

        if (!withinArray) {
          return false;
        }

        return arrayContains(data[name], value);

      default:
        throw new TypeError('URI.hasQuery() accepts undefined, boolean, string, number, RegExp, Function as the value parameter');
    }
  };


  URI.commonPath = function(one, two) {
    var length = Math.min(one.length, two.length);
    var pos;

    // find first non-matching character
    for (pos = 0; pos < length; pos++) {
      if (one.charAt(pos) !== two.charAt(pos)) {
        pos--;
        break;
      }
    }

    if (pos < 1) {
      return one.charAt(0) === two.charAt(0) && one.charAt(0) === '/' ? '/' : '';
    }

    // revert to last /
    if (one.charAt(pos) !== '/' || two.charAt(pos) !== '/') {
      pos = one.substring(0, pos).lastIndexOf('/');
    }

    return one.substring(0, pos + 1);
  };

  URI.withinString = function(string, callback, options) {
    options || (options = {});
    var _start = options.start || URI.findUri.start;
    var _end = options.end || URI.findUri.end;
    var _trim = options.trim || URI.findUri.trim;
    var _attributeOpen = /[a-z0-9-]=["']?$/i;

    _start.lastIndex = 0;
    while (true) {
      var match = _start.exec(string);
      if (!match) {
        break;
      }

      var start = match.index;
      if (options.ignoreHtml) {
        // attribut(e=["']?$)
        var attributeOpen = string.slice(Math.max(start - 3, 0), start);
        if (attributeOpen && _attributeOpen.test(attributeOpen)) {
          continue;
        }
      }

      var end = start + string.slice(start).search(_end);
      var slice = string.slice(start, end).replace(_trim, '');
      if (options.ignore && options.ignore.test(slice)) {
        continue;
      }

      end = start + slice.length;
      var result = callback(slice, start, end, string);
      string = string.slice(0, start) + result + string.slice(end);
      _start.lastIndex = start + result.length;
    }

    _start.lastIndex = 0;
    return string;
  };

  URI.ensureValidHostname = function(v) {
    // Theoretically URIs allow percent-encoding in Hostnames (according to RFC 3986)
    // they are not part of DNS and therefore ignored by URI.js

    if (v.match(URI.invalid_hostname_characters)) {
      // test punycode
      if (!punycode) {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-] and Punycode.js is not available');
      }

      if (punycode.toASCII(v).match(URI.invalid_hostname_characters)) {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }
    }
  };

  // noConflict
  URI.noConflict = function(removeAll) {
    if (removeAll) {
      var unconflicted = {
        URI: this.noConflict()
      };

      if (root.URITemplate && typeof root.URITemplate.noConflict === 'function') {
        unconflicted.URITemplate = root.URITemplate.noConflict();
      }

      if (root.IPv6 && typeof root.IPv6.noConflict === 'function') {
        unconflicted.IPv6 = root.IPv6.noConflict();
      }

      if (root.SecondLevelDomains && typeof root.SecondLevelDomains.noConflict === 'function') {
        unconflicted.SecondLevelDomains = root.SecondLevelDomains.noConflict();
      }

      return unconflicted;
    } else if (root.URI === this) {
      root.URI = _URI;
    }

    return this;
  };

  p.build = function(deferBuild) {
    if (deferBuild === true) {
      this._deferred_build = true;
    } else if (deferBuild === undefined || this._deferred_build) {
      this._string = URI.build(this._parts);
      this._deferred_build = false;
    }

    return this;
  };

  p.clone = function() {
    return new URI(this);
  };

  p.valueOf = p.toString = function() {
    return this.build(false)._string;
  };


  function generateSimpleAccessor(_part){
    return function(v, build) {
      if (v === undefined) {
        return this._parts[_part] || '';
      } else {
        this._parts[_part] = v || null;
        this.build(!build);
        return this;
      }
    };
  }

  function generatePrefixAccessor(_part, _key){
    return function(v, build) {
      if (v === undefined) {
        return this._parts[_part] || '';
      } else {
        if (v !== null) {
          v = v + '';
          if (v.charAt(0) === _key) {
            v = v.substring(1);
          }
        }

        this._parts[_part] = v;
        this.build(!build);
        return this;
      }
    };
  }

  p.protocol = generateSimpleAccessor('protocol');
  p.username = generateSimpleAccessor('username');
  p.password = generateSimpleAccessor('password');
  p.hostname = generateSimpleAccessor('hostname');
  p.port = generateSimpleAccessor('port');
  p.query = generatePrefixAccessor('query', '?');
  p.fragment = generatePrefixAccessor('fragment', '#');

  p.search = function(v, build) {
    var t = this.query(v, build);
    return typeof t === 'string' && t.length ? ('?' + t) : t;
  };
  p.hash = function(v, build) {
    var t = this.fragment(v, build);
    return typeof t === 'string' && t.length ? ('#' + t) : t;
  };

  p.pathname = function(v, build) {
    if (v === undefined || v === true) {
      var res = this._parts.path || (this._parts.hostname ? '/' : '');
      return v ? (this._parts.urn ? URI.decodeUrnPath : URI.decodePath)(res) : res;
    } else {
      if (this._parts.urn) {
        this._parts.path = v ? URI.recodeUrnPath(v) : '';
      } else {
        this._parts.path = v ? URI.recodePath(v) : '/';
      }
      this.build(!build);
      return this;
    }
  };
  p.path = p.pathname;
  p.href = function(href, build) {
    var key;

    if (href === undefined) {
      return this.toString();
    }

    this._string = '';
    this._parts = URI._parts();

    var _URI = href instanceof URI;
    var _object = typeof href === 'object' && (href.hostname || href.path || href.pathname);
    if (href.nodeName) {
      var attribute = URI.getDomAttribute(href);
      href = href[attribute] || '';
      _object = false;
    }

    // window.location is reported to be an object, but it's not the sort
    // of object we're looking for:
    // * location.protocol ends with a colon
    // * location.query != object.search
    // * location.hash != object.fragment
    // simply serializing the unknown object should do the trick
    // (for location, not for everything...)
    if (!_URI && _object && href.pathname !== undefined) {
      href = href.toString();
    }

    if (typeof href === 'string' || href instanceof String) {
      this._parts = URI.parse(String(href), this._parts);
    } else if (_URI || _object) {
      var src = _URI ? href._parts : href;
      for (key in src) {
        if (hasOwn.call(this._parts, key)) {
          this._parts[key] = src[key];
        }
      }
    } else {
      throw new TypeError('invalid input');
    }

    this.build(!build);
    return this;
  };

  // identification accessors
  p.is = function(what) {
    var ip = false;
    var ip4 = false;
    var ip6 = false;
    var name = false;
    var sld = false;
    var idn = false;
    var punycode = false;
    var relative = !this._parts.urn;

    if (this._parts.hostname) {
      relative = false;
      ip4 = URI.ip4_expression.test(this._parts.hostname);
      ip6 = URI.ip6_expression.test(this._parts.hostname);
      ip = ip4 || ip6;
      name = !ip;
      sld = name && SLD && SLD.has(this._parts.hostname);
      idn = name && URI.idn_expression.test(this._parts.hostname);
      punycode = name && URI.punycode_expression.test(this._parts.hostname);
    }

    switch (what.toLowerCase()) {
      case 'relative':
        return relative;

      case 'absolute':
        return !relative;

      // hostname identification
      case 'domain':
      case 'name':
        return name;

      case 'sld':
        return sld;

      case 'ip':
        return ip;

      case 'ip4':
      case 'ipv4':
      case 'inet4':
        return ip4;

      case 'ip6':
      case 'ipv6':
      case 'inet6':
        return ip6;

      case 'idn':
        return idn;

      case 'url':
        return !this._parts.urn;

      case 'urn':
        return !!this._parts.urn;

      case 'punycode':
        return punycode;
    }

    return null;
  };

  // component specific input validation
  var _protocol = p.protocol;
  var _port = p.port;
  var _hostname = p.hostname;

  p.protocol = function(v, build) {
    if (v !== undefined) {
      if (v) {
        // accept trailing ://
        v = v.replace(/:(\/\/)?$/, '');

        if (!v.match(URI.protocol_expression)) {
          throw new TypeError('Protocol "' + v + '" contains characters other than [A-Z0-9.+-] or doesn\'t start with [A-Z]');
        }
      }
    }
    return _protocol.call(this, v, build);
  };
  p.scheme = p.protocol;
  p.port = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v !== undefined) {
      if (v === 0) {
        v = null;
      }

      if (v) {
        v += '';
        if (v.charAt(0) === ':') {
          v = v.substring(1);
        }

        if (v.match(/[^0-9]/)) {
          throw new TypeError('Port "' + v + '" contains characters other than [0-9]');
        }
      }
    }
    return _port.call(this, v, build);
  };
  p.hostname = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v !== undefined) {
      var x = {};
      var res = URI.parseHost(v, x);
      if (res !== '/') {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }

      v = x.hostname;
    }
    return _hostname.call(this, v, build);
  };

  // compound accessors
  p.host = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined) {
      return this._parts.hostname ? URI.buildHost(this._parts) : '';
    } else {
      var res = URI.parseHost(v, this._parts);
      if (res !== '/') {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }

      this.build(!build);
      return this;
    }
  };
  p.authority = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined) {
      return this._parts.hostname ? URI.buildAuthority(this._parts) : '';
    } else {
      var res = URI.parseAuthority(v, this._parts);
      if (res !== '/') {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }

      this.build(!build);
      return this;
    }
  };
  p.userinfo = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined) {
      if (!this._parts.username) {
        return '';
      }

      var t = URI.buildUserinfo(this._parts);
      return t.substring(0, t.length -1);
    } else {
      if (v[v.length-1] !== '@') {
        v += '@';
      }

      URI.parseUserinfo(v, this._parts);
      this.build(!build);
      return this;
    }
  };
  p.resource = function(v, build) {
    var parts;

    if (v === undefined) {
      return this.path() + this.search() + this.hash();
    }

    parts = URI.parse(v);
    this._parts.path = parts.path;
    this._parts.query = parts.query;
    this._parts.fragment = parts.fragment;
    this.build(!build);
    return this;
  };

  // fraction accessors
  p.subdomain = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    // convenience, return "www" from "www.example.org"
    if (v === undefined) {
      if (!this._parts.hostname || this.is('IP')) {
        return '';
      }

      // grab domain and add another segment
      var end = this._parts.hostname.length - this.domain().length - 1;
      return this._parts.hostname.substring(0, end) || '';
    } else {
      var e = this._parts.hostname.length - this.domain().length;
      var sub = this._parts.hostname.substring(0, e);
      var replace = new RegExp('^' + escapeRegEx(sub));

      if (v && v.charAt(v.length - 1) !== '.') {
        v += '.';
      }

      if (v) {
        URI.ensureValidHostname(v);
      }

      this._parts.hostname = this._parts.hostname.replace(replace, v);
      this.build(!build);
      return this;
    }
  };
  p.domain = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (typeof v === 'boolean') {
      build = v;
      v = undefined;
    }

    // convenience, return "example.org" from "www.example.org"
    if (v === undefined) {
      if (!this._parts.hostname || this.is('IP')) {
        return '';
      }

      // if hostname consists of 1 or 2 segments, it must be the domain
      var t = this._parts.hostname.match(/\./g);
      if (t && t.length < 2) {
        return this._parts.hostname;
      }

      // grab tld and add another segment
      var end = this._parts.hostname.length - this.tld(build).length - 1;
      end = this._parts.hostname.lastIndexOf('.', end -1) + 1;
      return this._parts.hostname.substring(end) || '';
    } else {
      if (!v) {
        throw new TypeError('cannot set domain empty');
      }

      URI.ensureValidHostname(v);

      if (!this._parts.hostname || this.is('IP')) {
        this._parts.hostname = v;
      } else {
        var replace = new RegExp(escapeRegEx(this.domain()) + '$');
        this._parts.hostname = this._parts.hostname.replace(replace, v);
      }

      this.build(!build);
      return this;
    }
  };
  p.tld = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (typeof v === 'boolean') {
      build = v;
      v = undefined;
    }

    // return "org" from "www.example.org"
    if (v === undefined) {
      if (!this._parts.hostname || this.is('IP')) {
        return '';
      }

      var pos = this._parts.hostname.lastIndexOf('.');
      var tld = this._parts.hostname.substring(pos + 1);

      if (build !== true && SLD && SLD.list[tld.toLowerCase()]) {
        return SLD.get(this._parts.hostname) || tld;
      }

      return tld;
    } else {
      var replace;

      if (!v) {
        throw new TypeError('cannot set TLD empty');
      } else if (v.match(/[^a-zA-Z0-9-]/)) {
        if (SLD && SLD.is(v)) {
          replace = new RegExp(escapeRegEx(this.tld()) + '$');
          this._parts.hostname = this._parts.hostname.replace(replace, v);
        } else {
          throw new TypeError('TLD "' + v + '" contains characters other than [A-Z0-9]');
        }
      } else if (!this._parts.hostname || this.is('IP')) {
        throw new ReferenceError('cannot set TLD on non-domain host');
      } else {
        replace = new RegExp(escapeRegEx(this.tld()) + '$');
        this._parts.hostname = this._parts.hostname.replace(replace, v);
      }

      this.build(!build);
      return this;
    }
  };
  p.directory = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined || v === true) {
      if (!this._parts.path && !this._parts.hostname) {
        return '';
      }

      if (this._parts.path === '/') {
        return '/';
      }

      var end = this._parts.path.length - this.filename().length - 1;
      var res = this._parts.path.substring(0, end) || (this._parts.hostname ? '/' : '');

      return v ? URI.decodePath(res) : res;

    } else {
      var e = this._parts.path.length - this.filename().length;
      var directory = this._parts.path.substring(0, e);
      var replace = new RegExp('^' + escapeRegEx(directory));

      // fully qualifier directories begin with a slash
      if (!this.is('relative')) {
        if (!v) {
          v = '/';
        }

        if (v.charAt(0) !== '/') {
          v = '/' + v;
        }
      }

      // directories always end with a slash
      if (v && v.charAt(v.length - 1) !== '/') {
        v += '/';
      }

      v = URI.recodePath(v);
      this._parts.path = this._parts.path.replace(replace, v);
      this.build(!build);
      return this;
    }
  };
  p.filename = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined || v === true) {
      if (!this._parts.path || this._parts.path === '/') {
        return '';
      }

      var pos = this._parts.path.lastIndexOf('/');
      var res = this._parts.path.substring(pos+1);

      return v ? URI.decodePathSegment(res) : res;
    } else {
      var mutatedDirectory = false;

      if (v.charAt(0) === '/') {
        v = v.substring(1);
      }

      if (v.match(/\.?\//)) {
        mutatedDirectory = true;
      }

      var replace = new RegExp(escapeRegEx(this.filename()) + '$');
      v = URI.recodePath(v);
      this._parts.path = this._parts.path.replace(replace, v);

      if (mutatedDirectory) {
        this.normalizePath(build);
      } else {
        this.build(!build);
      }

      return this;
    }
  };
  p.suffix = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined || v === true) {
      if (!this._parts.path || this._parts.path === '/') {
        return '';
      }

      var filename = this.filename();
      var pos = filename.lastIndexOf('.');
      var s, res;

      if (pos === -1) {
        return '';
      }

      // suffix may only contain alnum characters (yup, I made this up.)
      s = filename.substring(pos+1);
      res = (/^[a-z0-9%]+$/i).test(s) ? s : '';
      return v ? URI.decodePathSegment(res) : res;
    } else {
      if (v.charAt(0) === '.') {
        v = v.substring(1);
      }

      var suffix = this.suffix();
      var replace;

      if (!suffix) {
        if (!v) {
          return this;
        }

        this._parts.path += '.' + URI.recodePath(v);
      } else if (!v) {
        replace = new RegExp(escapeRegEx('.' + suffix) + '$');
      } else {
        replace = new RegExp(escapeRegEx(suffix) + '$');
      }

      if (replace) {
        v = URI.recodePath(v);
        this._parts.path = this._parts.path.replace(replace, v);
      }

      this.build(!build);
      return this;
    }
  };
  p.segment = function(segment, v, build) {
    var separator = this._parts.urn ? ':' : '/';
    var path = this.path();
    var absolute = path.substring(0, 1) === '/';
    var segments = path.split(separator);

    if (segment !== undefined && typeof segment !== 'number') {
      build = v;
      v = segment;
      segment = undefined;
    }

    if (segment !== undefined && typeof segment !== 'number') {
      throw new Error('Bad segment "' + segment + '", must be 0-based integer');
    }

    if (absolute) {
      segments.shift();
    }

    if (segment < 0) {
      // allow negative indexes to address from the end
      segment = Math.max(segments.length + segment, 0);
    }

    if (v === undefined) {
      /*jshint laxbreak: true */
      return segment === undefined
        ? segments
        : segments[segment];
      /*jshint laxbreak: false */
    } else if (segment === null || segments[segment] === undefined) {
      if (isArray(v)) {
        segments = [];
        // collapse empty elements within array
        for (var i=0, l=v.length; i < l; i++) {
          if (!v[i].length && (!segments.length || !segments[segments.length -1].length)) {
            continue;
          }

          if (segments.length && !segments[segments.length -1].length) {
            segments.pop();
          }

          segments.push(v[i]);
        }
      } else if (v || typeof v === 'string') {
        if (segments[segments.length -1] === '') {
          // empty trailing elements have to be overwritten
          // to prevent results such as /foo//bar
          segments[segments.length -1] = v;
        } else {
          segments.push(v);
        }
      }
    } else {
      if (v) {
        segments[segment] = v;
      } else {
        segments.splice(segment, 1);
      }
    }

    if (absolute) {
      segments.unshift('');
    }

    return this.path(segments.join(separator), build);
  };
  p.segmentCoded = function(segment, v, build) {
    var segments, i, l;

    if (typeof segment !== 'number') {
      build = v;
      v = segment;
      segment = undefined;
    }

    if (v === undefined) {
      segments = this.segment(segment, v, build);
      if (!isArray(segments)) {
        segments = segments !== undefined ? URI.decode(segments) : undefined;
      } else {
        for (i = 0, l = segments.length; i < l; i++) {
          segments[i] = URI.decode(segments[i]);
        }
      }

      return segments;
    }

    if (!isArray(v)) {
      v = (typeof v === 'string' || v instanceof String) ? URI.encode(v) : v;
    } else {
      for (i = 0, l = v.length; i < l; i++) {
        v[i] = URI.encode(v[i]);
      }
    }

    return this.segment(segment, v, build);
  };

  // mutating query string
  var q = p.query;
  p.query = function(v, build) {
    if (v === true) {
      return URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    } else if (typeof v === 'function') {
      var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
      var result = v.call(this, data);
      this._parts.query = URI.buildQuery(result || data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
      this.build(!build);
      return this;
    } else if (v !== undefined && typeof v !== 'string') {
      this._parts.query = URI.buildQuery(v, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
      this.build(!build);
      return this;
    } else {
      return q.call(this, v, build);
    }
  };
  p.setQuery = function(name, value, build) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);

    if (typeof name === 'string' || name instanceof String) {
      data[name] = value !== undefined ? value : null;
    } else if (typeof name === 'object') {
      for (var key in name) {
        if (hasOwn.call(name, key)) {
          data[key] = name[key];
        }
      }
    } else {
      throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
    }

    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
    if (typeof name !== 'string') {
      build = value;
    }

    this.build(!build);
    return this;
  };
  p.addQuery = function(name, value, build) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    URI.addQuery(data, name, value === undefined ? null : value);
    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
    if (typeof name !== 'string') {
      build = value;
    }

    this.build(!build);
    return this;
  };
  p.removeQuery = function(name, value, build) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    URI.removeQuery(data, name, value);
    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
    if (typeof name !== 'string') {
      build = value;
    }

    this.build(!build);
    return this;
  };
  p.hasQuery = function(name, value, withinArray) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    return URI.hasQuery(data, name, value, withinArray);
  };
  p.setSearch = p.setQuery;
  p.addSearch = p.addQuery;
  p.removeSearch = p.removeQuery;
  p.hasSearch = p.hasQuery;

  // sanitizing URLs
  p.normalize = function() {
    if (this._parts.urn) {
      return this
        .normalizeProtocol(false)
        .normalizePath(false)
        .normalizeQuery(false)
        .normalizeFragment(false)
        .build();
    }

    return this
      .normalizeProtocol(false)
      .normalizeHostname(false)
      .normalizePort(false)
      .normalizePath(false)
      .normalizeQuery(false)
      .normalizeFragment(false)
      .build();
  };
  p.normalizeProtocol = function(build) {
    if (typeof this._parts.protocol === 'string') {
      this._parts.protocol = this._parts.protocol.toLowerCase();
      this.build(!build);
    }

    return this;
  };
  p.normalizeHostname = function(build) {
    if (this._parts.hostname) {
      if (this.is('IDN') && punycode) {
        this._parts.hostname = punycode.toASCII(this._parts.hostname);
      } else if (this.is('IPv6') && IPv6) {
        this._parts.hostname = IPv6.best(this._parts.hostname);
      }

      this._parts.hostname = this._parts.hostname.toLowerCase();
      this.build(!build);
    }

    return this;
  };
  p.normalizePort = function(build) {
    // remove port of it's the protocol's default
    if (typeof this._parts.protocol === 'string' && this._parts.port === URI.defaultPorts[this._parts.protocol]) {
      this._parts.port = null;
      this.build(!build);
    }

    return this;
  };
  p.normalizePath = function(build) {
    var _path = this._parts.path;
    if (!_path) {
      return this;
    }

    if (this._parts.urn) {
      this._parts.path = URI.recodeUrnPath(this._parts.path);
      this.build(!build);
      return this;
    }

    if (this._parts.path === '/') {
      return this;
    }

    var _was_relative;
    var _leadingParents = '';
    var _parent, _pos;

    // handle relative paths
    if (_path.charAt(0) !== '/') {
      _was_relative = true;
      _path = '/' + _path;
    }

    // handle relative files (as opposed to directories)
    if (_path.slice(-3) === '/..' || _path.slice(-2) === '/.') {
      _path += '/';
    }

    // resolve simples
    _path = _path
      .replace(/(\/(\.\/)+)|(\/\.$)/g, '/')
      .replace(/\/{2,}/g, '/');

    // remember leading parents
    if (_was_relative) {
      _leadingParents = _path.substring(1).match(/^(\.\.\/)+/) || '';
      if (_leadingParents) {
        _leadingParents = _leadingParents[0];
      }
    }

    // resolve parents
    while (true) {
      _parent = _path.indexOf('/..');
      if (_parent === -1) {
        // no more ../ to resolve
        break;
      } else if (_parent === 0) {
        // top level cannot be relative, skip it
        _path = _path.substring(3);
        continue;
      }

      _pos = _path.substring(0, _parent).lastIndexOf('/');
      if (_pos === -1) {
        _pos = _parent;
      }
      _path = _path.substring(0, _pos) + _path.substring(_parent + 3);
    }

    // revert to relative
    if (_was_relative && this.is('relative')) {
      _path = _leadingParents + _path.substring(1);
    }

    _path = URI.recodePath(_path);
    this._parts.path = _path;
    this.build(!build);
    return this;
  };
  p.normalizePathname = p.normalizePath;
  p.normalizeQuery = function(build) {
    if (typeof this._parts.query === 'string') {
      if (!this._parts.query.length) {
        this._parts.query = null;
      } else {
        this.query(URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace));
      }

      this.build(!build);
    }

    return this;
  };
  p.normalizeFragment = function(build) {
    if (!this._parts.fragment) {
      this._parts.fragment = null;
      this.build(!build);
    }

    return this;
  };
  p.normalizeSearch = p.normalizeQuery;
  p.normalizeHash = p.normalizeFragment;

  p.iso8859 = function() {
    // expect unicode input, iso8859 output
    var e = URI.encode;
    var d = URI.decode;

    URI.encode = escape;
    URI.decode = decodeURIComponent;
    try {
      this.normalize();
    } finally {
      URI.encode = e;
      URI.decode = d;
    }
    return this;
  };

  p.unicode = function() {
    // expect iso8859 input, unicode output
    var e = URI.encode;
    var d = URI.decode;

    URI.encode = strictEncodeURIComponent;
    URI.decode = unescape;
    try {
      this.normalize();
    } finally {
      URI.encode = e;
      URI.decode = d;
    }
    return this;
  };

  p.readable = function() {
    var uri = this.clone();
    // removing username, password, because they shouldn't be displayed according to RFC 3986
    uri.username('').password('').normalize();
    var t = '';
    if (uri._parts.protocol) {
      t += uri._parts.protocol + '://';
    }

    if (uri._parts.hostname) {
      if (uri.is('punycode') && punycode) {
        t += punycode.toUnicode(uri._parts.hostname);
        if (uri._parts.port) {
          t += ':' + uri._parts.port;
        }
      } else {
        t += uri.host();
      }
    }

    if (uri._parts.hostname && uri._parts.path && uri._parts.path.charAt(0) !== '/') {
      t += '/';
    }

    t += uri.path(true);
    if (uri._parts.query) {
      var q = '';
      for (var i = 0, qp = uri._parts.query.split('&'), l = qp.length; i < l; i++) {
        var kv = (qp[i] || '').split('=');
        q += '&' + URI.decodeQuery(kv[0], this._parts.escapeQuerySpace)
          .replace(/&/g, '%26');

        if (kv[1] !== undefined) {
          q += '=' + URI.decodeQuery(kv[1], this._parts.escapeQuerySpace)
            .replace(/&/g, '%26');
        }
      }
      t += '?' + q.substring(1);
    }

    t += URI.decodeQuery(uri.hash(), true);
    return t;
  };

  // resolving relative and absolute URLs
  p.absoluteTo = function(base) {
    var resolved = this.clone();
    var properties = ['protocol', 'username', 'password', 'hostname', 'port'];
    var basedir, i, p;

    if (this._parts.urn) {
      throw new Error('URNs do not have any generally defined hierarchical components');
    }

    if (!(base instanceof URI)) {
      base = new URI(base);
    }

    if (!resolved._parts.protocol) {
      resolved._parts.protocol = base._parts.protocol;
    }

    if (this._parts.hostname) {
      return resolved;
    }

    for (i = 0; (p = properties[i]); i++) {
      resolved._parts[p] = base._parts[p];
    }

    if (!resolved._parts.path) {
      resolved._parts.path = base._parts.path;
      if (!resolved._parts.query) {
        resolved._parts.query = base._parts.query;
      }
    } else if (resolved._parts.path.substring(-2) === '..') {
      resolved._parts.path += '/';
    }

    if (resolved.path().charAt(0) !== '/') {
      basedir = base.directory();
      basedir = basedir ? basedir : base.path().indexOf('/') === 0 ? '/' : '';
      resolved._parts.path = (basedir ? (basedir + '/') : '') + resolved._parts.path;
      resolved.normalizePath();
    }

    resolved.build();
    return resolved;
  };
  p.relativeTo = function(base) {
    var relative = this.clone().normalize();
    var relativeParts, baseParts, common, relativePath, basePath;

    if (relative._parts.urn) {
      throw new Error('URNs do not have any generally defined hierarchical components');
    }

    base = new URI(base).normalize();
    relativeParts = relative._parts;
    baseParts = base._parts;
    relativePath = relative.path();
    basePath = base.path();

    if (relativePath.charAt(0) !== '/') {
      throw new Error('URI is already relative');
    }

    if (basePath.charAt(0) !== '/') {
      throw new Error('Cannot calculate a URI relative to another relative URI');
    }

    if (relativeParts.protocol === baseParts.protocol) {
      relativeParts.protocol = null;
    }

    if (relativeParts.username !== baseParts.username || relativeParts.password !== baseParts.password) {
      return relative.build();
    }

    if (relativeParts.protocol !== null || relativeParts.username !== null || relativeParts.password !== null) {
      return relative.build();
    }

    if (relativeParts.hostname === baseParts.hostname && relativeParts.port === baseParts.port) {
      relativeParts.hostname = null;
      relativeParts.port = null;
    } else {
      return relative.build();
    }

    if (relativePath === basePath) {
      relativeParts.path = '';
      return relative.build();
    }

    // determine common sub path
    common = URI.commonPath(relativePath, basePath);

    // If the paths have nothing in common, return a relative URL with the absolute path.
    if (!common) {
      return relative.build();
    }

    var parents = baseParts.path
      .substring(common.length)
      .replace(/[^\/]*$/, '')
      .replace(/.*?\//g, '../');

    relativeParts.path = (parents + relativeParts.path.substring(common.length)) || './';

    return relative.build();
  };

  // comparing URIs
  p.equals = function(uri) {
    var one = this.clone();
    var two = new URI(uri);
    var one_map = {};
    var two_map = {};
    var checked = {};
    var one_query, two_query, key;

    one.normalize();
    two.normalize();

    // exact match
    if (one.toString() === two.toString()) {
      return true;
    }

    // extract query string
    one_query = one.query();
    two_query = two.query();
    one.query('');
    two.query('');

    // definitely not equal if not even non-query parts match
    if (one.toString() !== two.toString()) {
      return false;
    }

    // query parameters have the same length, even if they're permuted
    if (one_query.length !== two_query.length) {
      return false;
    }

    one_map = URI.parseQuery(one_query, this._parts.escapeQuerySpace);
    two_map = URI.parseQuery(two_query, this._parts.escapeQuerySpace);

    for (key in one_map) {
      if (hasOwn.call(one_map, key)) {
        if (!isArray(one_map[key])) {
          if (one_map[key] !== two_map[key]) {
            return false;
          }
        } else if (!arraysEqual(one_map[key], two_map[key])) {
          return false;
        }

        checked[key] = true;
      }
    }

    for (key in two_map) {
      if (hasOwn.call(two_map, key)) {
        if (!checked[key]) {
          // two contains a parameter not present in one
          return false;
        }
      }
    }

    return true;
  };

  // state
  p.duplicateQueryParameters = function(v) {
    this._parts.duplicateQueryParameters = !!v;
    return this;
  };

  p.escapeQuerySpace = function(v) {
    this._parts.escapeQuerySpace = !!v;
    return this;
  };

  return URI;
}));

},{"./IPv6":139,"./SecondLevelDomains":140,"./punycode":142}],142:[function(require,module,exports){
(function (global){
/*! http://mths.be/punycode v1.2.3 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    length,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.3',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return punycode;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],143:[function(require,module,exports){
(function (Buffer){
var Q = require("q");
var qs = require("qs");

module.exports = exports = function (app) {
  var common = app.extensions.common;
  var select = common.select;

  var oms = app.extensions.oms = {};
  var omsDeferred;

  function createErrorFromContent(content) {
    var message = createErrorMessage(content.location, content.data.toString());
    return new Error(message);
  }

  function createErrorMessage(location, data) {
    var message = [];
    message.push("URL:");
    message.push(location);
    message.push("CONTENT:");
    message.push(data ? data.toString() : "");
    return message.join("\n");
  }

  function omsFinishing(result) {
    var doneScope = "http://bestbuy.com/retail/oms/order/done/";
    if (!result.element.dataset.contentRealm) return result;
    if (!app.extensions.common.scopeIncludesRealm(doneScope, result.element.dataset.contentRealm)) return result;

    var omsResult = {
      orderStatesUrl: "",
      orderDetailsUrl: ""
    };

    var statesUrlElement = select("[data-lynx-hints~='http://bestbuy.com/retail/oms/order/done/states-link'],a[data-lynx-name=statesLink],a[data-lynx-name=statesUrl]")(result.element).first();

    if (!statesUrlElement) {
      omsDeferred.reject(createErrorFromContent(result.content));
      return result;
    }

    omsResult.orderStatesUrl = statesUrlElement.pathname + statesUrlElement.search + statesUrlElement.hash;

    function parseLynx(content) {
      return app.extensions.lynx.parsing(content)
        .then(function (lynxDoc) {
          return {
            content: content,
            document: lynxDoc
          };
        });
    }

    function resolveOmsDeferred(parseResult) {
      var orderDetailsLink = parseResult.document.root.find(function (lynxNode) {
        return lynxNode.hasHint("http://bestbuy.com/retail/oms/order/states/data-link") || lynxNode.name === "dataLink";
      });

      if (!orderDetailsLink || !orderDetailsLink.value || !orderDetailsLink.value.href) {
        omsDeferred.reject(createErrorFromContent(parseResult.content));
        return result;
      }

      omsResult.orderDetailsUrl = orderDetailsLink.value.href;
      omsDeferred.resolve(omsResult);

      return result;
    }

    return app.transferring(statesUrlElement.href)
      .then(parseLynx)
      .then(resolveOmsDeferred)
      .fail(function (err) {
        err.message = createErrorMessage(omsResult.orderStatesUrl, err.message);
        omsDeferred.reject(err);
        // always restore finishing function result
        return result;
      });
  }

  var omsIntegrationBranch = app.finishing.composite(function (result) {
    return !!omsDeferred;
  });
  omsIntegrationBranch.add(omsFinishing);
  app.finishing.add(omsIntegrationBranch);

  function submitFormData(dataObj) {
    return function submitFormDataWorker(lynxDoc) {
      var submitControl = lynxDoc.root.find(function (lynxNode) {
        return lynxNode.hasHint("submit") && lynxNode.value.method === "POST";
      });

      var sendUrl = lynxDoc.resolveURI(submitControl.value.action);

      var bodyData = qs.stringify(dataObj);
      var body = {
        data: new Buffer(bodyData),
        type: "application/x-www-form-urlencoded"
      };

      var options = {
        method: submitControl.value.method,
        body: body
      };

      return app.send(sendUrl, options);
    };
  }

  oms.createOrder = function omsCreateOrder(startUrl, order) {
    omsDeferred = Q.defer();

    if (!startUrl) {
      omsDeferred.reject(new Error("The 'startUrl' parameter is required."));
      return omsDeferred.promise;
    }

    if (!order) {
      omsDeferred.reject(new Error("The 'order' parameter is required."));
      return omsDeferred.promise;
    }

    startUrl = app.resolveURI(document.location.href, startUrl);

    app.transferring(startUrl)
      .then(app.extensions.lynx.parsing)
      .then(submitFormData(order));

    return omsDeferred.promise;
  };

  oms.modifyOrder = function omsModifyOrder(orderStatesUrl) {
    return Q().then(function () {
      if (!orderStatesUrl) throw new Error("The 'orderStatesUrl' parameter is required.");
      return mockResult;
    });
  };

  oms.validateOrder = function omsValidateOrder(orderStatesUrl) {
    return Q().then(function () {
      if (!orderStatesUrl) throw new Error("The 'orderStatesUrl' parameter is required.");
      return mockResult;
    });
  };

  oms.addLines = function omsAddLines(orderStatesUrl, orderLines) {
    return Q().then(function () {
      if (!orderStatesUrl || !orderLines) throw new Error("The 'orderStatesUrl' and orderLines parameters are required.");
      return mockResult;
    });
  };

  oms.deleteLines = function omsDeleteLines(orderStatesUrl, orderLines) {
    return Q().then(function () {
      if (!orderStatesUrl || !orderLines) throw new Error("The 'orderStatesUrl' and 'orderLines' parameters are required.");
      return mockResult;
    });
  };

  oms.updatePurchaser = function omsUpdatePurchaser(orderStatesUrl, purchaser) {
    return Q().then(function () {
      if (!orderStatesUrl || !purchaser) throw new Error("The 'orderStatesUrl' and 'purchaser' parameters are required.");
      return mockResult;
    });
  };

  return app;
};

}).call(this,require("buffer").Buffer)
},{"buffer":80,"q":134,"qs":135}],144:[function(require,module,exports){
module.exports = exports = function (app) {
  var bem = app.extensions.bem;
  var composite = app.extensions.common.finishing.composite;
  var lynx = app.extensions.lynx;
  var ux = app.extensions.ux;
  
  function optionsRoleChanged(result) {
    if (result.state === "options") {
      result = app.extensions.common.finishing.applyOptionsKeyboardBehavior("._option", "._option--selected")(result);
      result = bem.mixin("_options")(result);
      return tryToConvertOptionsToSelect(result);
    }
    
    if (result.element.removeOptionsKeyboardBehavior) {
      result.element.removeOptionsKeyboardBehavior();
    }
    
    tryToRemoveSelect(result);
    bem.remove("_options")(result);
    
    return result;
  }
  
  function copyElementsAndStates(sourceElement) {
    var markerAndElementExp = /^-|__/;
    return function (result) {  
      Array.prototype.forEach.call(sourceElement.classList, function (className) {
          if (markerAndElementExp.test(className)) {
            result.element.classList.add(className);
          }
      });
      
      return result;
    };
  }
  
  function tryToRemoveSelect(result) {
    var endsWithSelection = /Selection$/;
    if (!endsWithSelection.test(result.element.dataset.lynxName)) return result;
    
    var optionsElement = result.element;
    ux.visibilityChanged(optionsElement);
    
    var selectElement = app.extensions.common.findNearestElement(optionsElement, function (elem) {
      return optionsElement.dataset.lynxName === elem.dataset.lynxOptionsSelectFor;
    });
    
    selectElement.parentElement.removeChild(selectElement);
    
    var inputElement = app.extensions.common.findNearestElement(optionsElement, function (elem) {
      return elem.dataset.lynxName === optionsElement.dataset.lynxOptionsFor;
    });
    
    inputElement.disabled = false;
    
    return result;
  }
  
  function tryToConvertOptionsToSelect(result) {
    var endsWithSelection = /Selection$/;
    if (!endsWithSelection.test(result.element.dataset.lynxName)) return result;
    
    var optionsElement = result.element;
    
    var selectElement = document.createElement("select");
    var selectResult = { element: selectElement };
    
    composite(
      bem.block("input"),
      bem.modifier("input--select"),
      copyElementsAndStates(optionsElement)
    )(selectResult).then(function () {
      ux.setVisibility("hidden")(result);
    });
    
    selectElement.appendChild(document.createElement("option"));
    selectElement.dataset.lynxOptionsSelectFor = optionsElement.dataset.lynxName;
    optionsElement.dataset.lynxOptionsHasSelect = true;
    optionsElement.parentElement.insertBefore(selectElement, optionsElement);
    
    var inputElement = app.extensions.common.findNearestElement(optionsElement, function (elem) {
      return elem.dataset.lynxName === optionsElement.dataset.lynxOptionsFor;
    });
    
    inputElement.disabled = true;
    selectElement.name = inputElement.name;
    
    selectElement.addEventListener("change", function () {
      var selectOptionElement = selectElement.options[selectElement.selectedIndex];
      var optionElement;
      
      if (selectOptionElement.dataset.lynxOptionsOptionFor) {
        // click the related option
        var selector = "[data-lynx-option=true][data-lynx-name='";
        selector += selectOptionElement.dataset.lynxOptionsOptionFor;
        selector += "']";
        
        optionElement = app.extensions.common.select(selector)(optionsElement).first();
      }
      else {
        // click the currently selected option b/c the empty option was selected
        optionElement = app.extensions.common.select("[data-lynx-option-selected=true]")(optionsElement).first();
      }
      
      optionElement.click();
    });
    
    return result;
  }
  
  function optionRoleChanged(result) {
    if (result.state === "option") {
      result = bem.mixin("_option")(result);
      return tryToConvertOptionToSelectOption(result);
    }
    
    bem.remove("_option")(result);
    return result;
  }
  
  function tryToConvertOptionToSelectOption(result) {
    var optionElement = result.element;
    
    var optionsElement = app.extensions.common.findNearestElement(optionElement, function (elem) {
      return elem.dataset.lynxOptionsFor;
    });
    
    if (!optionsElement.dataset.lynxOptionsHasSelect) return result;
    
    var selectElement = app.extensions.common.findNearestElement(optionsElement, function (elem) {
      return optionsElement.dataset.lynxName === elem.dataset.lynxOptionsSelectFor;
    });
    
    var valueElement = app.extensions.common.select("[data-lynx-option-value]")(optionElement).first();
    var selectOptionElement;
    
    if (valueElement.textContent === "") {
      selectOptionElement = app.extensions.common.select("option[value=''],option:not([value])")(selectElement).first();
    }
    else {
      selectOptionElement = document.createElement("option");
      selectElement.appendChild(selectOptionElement);
    }
    
    var labelElement = app.extensions.lynx.findLabelElement(optionElement);
    selectOptionElement.text = labelElement && labelElement.textContent;
    selectOptionElement.value = valueElement.textContent;
    selectOptionElement.selected = optionElement.dataset.lynxOptionSelected === "true";
    selectOptionElement.dataset.lynxOptionsOptionFor = optionElement.dataset.lynxName;  
    
    return result;
  }
  
  function optionSelectedChanged(result) {
    if (result.state === "selected") {
      return bem.modifier("_option--selected")(result);
    }
    
    bem.remove("_option--selected")(result);
    
    return result;
  }
  
  var optionsCallbacks = lynx.finishing.optionsCallbacks = {
    optionsRoleChanged: optionsRoleChanged,
    optionRoleChanged: optionRoleChanged,
    optionSelectedChanged: optionSelectedChanged
  };
  
  app.getApplicationElement().addEventListener("jsua", function (evt) {
    if (evt.state === "ready") {
      lynx.finishing.applyOptionsBehavior(optionsCallbacks)({ element: app.getApplicationElement() });
    }
  });
};

},{}],145:[function(require,module,exports){
module.exports = exports = function (app) {
  var uxConfig = app.extensions.uxConfiguration;
  
  var retailScope = app.finishing.scope("http://bestbuy.com/retail/");
  app.finishing.add(retailScope);
  uxConfig.configureYouAreHere(retailScope);
  uxConfig.configureMarkersAsOptions(retailScope);
  
  // uxConfig.configureSectionBlock(retailScope, "[data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/section/primary']", "section--primary");
  uxConfig.configureAttributeList(retailScope, "[data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/attribute-list']");
  uxConfig.configureControlsSectionBlock
  (retailScope, "[data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/control-section']");
  
  uxConfig.configureBannerBlock(retailScope);
  uxConfig.configureHeaderBlock(retailScope);
  uxConfig.configureListingBlock(retailScope);
  uxConfig.configureInputBlock(retailScope);
  uxConfig.configureInputSectionBlock(retailScope);
  uxConfig.configureComplementBlock(retailScope);
  uxConfig.configureControlsSectionBlock(retailScope);
  uxConfig.configureFormSectionBlock(retailScope);
  uxConfig.configureButtonBlock(retailScope);
  uxConfig.configureMainSection(retailScope);
  uxConfig.configureSectionBlock(retailScope, "[data-lynx-hints~=section]");
  uxConfig.configureTextBlock(retailScope);
  uxConfig.configureLinkBlock(retailScope);
  uxConfig.configureLinkMixin(retailScope);
  uxConfig.configureFixedLayout(retailScope);
};

},{}],146:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function () {
  require("./polyfills");
  var app = require("jsua")();

  app.setApplicationElement(document.body);

  // transferring module configuration
  // app.transferring = f(url, options) -> (content)
  var http = app.extensions.http = require("jsua-http-transferring")(app);
  app.transferring.add("http", http.transferring);
  app.transferring.add("https", http.transferring);
  var data = app.extensions.data = require("jsua-data-transferring")(app);
  app.transferring.add("data", data.transferring);

  // encoding module configuration
  // app.encoding(formdata, enctype) -> (data,type)
  var urlEncoding = app.extensions.urlEncoding = require("jsua-url-encoding")(app);
  app.encoding.add("application/x-www-form-urlencoded", urlEncoding.encoding);


  // common module configuration
  var common = app.extensions.common = require("jsua-common")(app);
  common.replaceElementAndPreserveAttributes.addPreservedAttribute("lynxName");
  common.replaceElementAndPreserveAttributes.addPreservedAttribute("lynxOptionsFor");
  common.css.namespace = "jsua-";

  // rendering module configuration
  // app.rendering = f(content) -> (content, element)
  var lynx = app.extensions.lynx = require("jsua-lynx")(app);

  lynx.rendering.add("container", lynx.nodeRendering.container);
  lynx.rendering.add("container", lynx.nodeRendering.containerInput, true);
  lynx.rendering.add("array", lynx.nodeRendering.container);
  lynx.rendering.add("object", lynx.nodeRendering.container);
  lynx.rendering.add("content", lynx.nodeRendering.content);
  lynx.rendering.add("image", lynx.nodeRendering.image);
  lynx.rendering.add("form", lynx.nodeRendering.form);
  lynx.rendering.add("submit", lynx.nodeRendering.submit);
  lynx.rendering.add("link", lynx.nodeRendering.link);
  lynx.rendering.add("text", lynx.nodeRendering.text);
  lynx.rendering.add("text", lynx.nodeRendering.textInput, true);

  var contentSet = require("./extensions/http-bestbuy-com-retail/content-set")(app);
  lynx.rendering.add("http://bestbuy.com/retail/content-set", contentSet.lynx.rendering);

  lynx.rendering.after(lynx.afterNodeRendering.setName);
  lynx.rendering.after(lynx.afterNodeRendering.setHints);
  lynx.rendering.after(lynx.afterNodeRendering.setVisibility);
  lynx.rendering.after(lynx.afterNodeRendering.setScope);
  lynx.rendering.after(lynx.afterNodeRendering.setOptions);
  lynx.rendering.after(lynx.afterNodeRendering.link);
  lynx.rendering.after(lynx.afterNodeRendering.submit);
  lynx.rendering.after(lynx.afterNodeRendering.setValidation);
  lynx.rendering.after(lynx.afterNodeRendering.setLabeledBy);
  lynx.rendering.after(lynx.afterNodeRendering.setFormatted);
  lynx.rendering.after(lynx.afterNodeRendering.wrapSectionBody);
  var marker = require("./extensions/http-uncategorized-marker")(app);
  lynx.rendering.after(marker.lynx.afterNodeRendering.setMarkerFor);


  app.rendering.add("application/lynx+json", lynx.rendering);

  var text = app.extensions.text = require("jsua-text-rendering")(app);
  app.rendering.add("text/plain", text.rendering);

  var markdown = app.extensions.markdown = require("jsua-markdown-rendering")(app);
  app.rendering.add("text/markdown", markdown.rendering);

  var image = app.extensions.image = require("jsua-image-rendering")(app);
  app.rendering.add("image/*", image.rendering);

  var html = app.extensions.html = require("jsua-html-rendering")(app);
  app.rendering.add("text/html", html.rendering);
  app.rendering.add("application/xhtml+xml", html.rendering);

  var generic = app.extensions.generic = require("jsua-generic-rendering")(app);
  app.rendering.add("*/*", generic.rendering);

  app.rendering.after(common.afterRendering.setContentContext);

  // Finishing
  var bem = app.extensions.bem = require("jsua-bem")(app);
  var ux = app.extensions.ux = require("./ux-patterns")(app);
  var uxConfig = app.extensions.uxConfiguration = require("./ux-configuration")(app);


  app.finishing.add(app.extensions.lynx.finishing.applyValidationBehavior(ux.visibilityChanged, ux.validityChanged));


  app.finishing.add(app.extensions.common.finishing.applyLinkBehavior);
  app.finishing.add(app.extensions.common.finishing.applySubmitBehavior);

  app.finishing.add(app.extensions.common.finishing.attachElementByScope);

  app.finishing.add(require("./extensions/attach-view")(app).finishing);

  var select = common.select;
  var apply = common.finishing.apply;
  var composite = common.finishing.composite;


  function configureValidation(finishing) {
    finishing.add(app.extensions.lynx.finishing.showHideValidationConstraintContentForAll(ux.visibilityChanged));
    finishing.add(apply("[data-lynx-validation-state]", ux.validityState));

    finishing.add(apply(".input[data-lynx-validation-state]", function (result) {

      var constraints = [];
      app.extensions.lynx.forEachValidationConstraint(result.element, function (constraint) {
        constraints.push(constraint);
      });

      function setFocusForConstraint(constraint, inputHasFocus) {
        ["valid", "invalid", "unknown"].forEach(function (name) {
          if (!(name in constraint)) return;

          var contentElement = app.extensions.common.findNearestElement(result.element, function (element) {
            return element.dataset.lynxName === constraint[name];
          });

          if (!contentElement) return;

          if (inputHasFocus) bem.state("-input-has-focus")({element: contentElement});
          else bem.remove("-input-has-focus")({element: contentElement});
        });
      }

      result.element.addEventListener("focus", function () {
        constraints.forEach(function (constraint) {
          setFocusForConstraint(constraint, true);
        });
      });

      result.element.addEventListener("blur", function () {
        constraints.forEach(function (constraint) {
          setFocusForConstraint(constraint, false);
        });
      });

      return result;
    }));

    finishing.add(apply("[data-lynx-validation-content-for-state]", ux.setValidationContentForStates));
  }

  function configureLabeling(finishing) {
    finishing.add(apply(".input[data-lynx-labeled-by]", function (result) {
      var labelElement = app.extensions.lynx.findLabelElement(result.element);
      if (!labelElement) return result;

      labelElement.addEventListener("click", function () {
        result.element.focus();
      });

      return result;
    }));
  }

  function configureVisibility(finishing) {
    finishing.add(apply("[data-lynx-visibility]", ux.visibilityState));
  }

  function configureFocus(finishing) {
    finishing.add(apply(select.first(select.concat(".input.-invalid", ".input:not(.-disabled)", ".button")), function (result) {
      result.element.focus();
      return result;
    }));
  }

  function configureContainerInput(finishing) {
    finishing.add(apply("[data-lynx-hints~='container'][data-lynx-input]", app.extensions.lynx.finishing.applyContainerInputBehavior));
  }

  function configureFormatted(finishing) {
    finishing.add(apply("[data-lynx-validation-formatted]", app.extensions.lynx.finishing.applyFormattedBehavior));
  }

  app.getApplicationElement().addEventListener("jsua", function (evt) {
    var applicationElement = app.getApplicationElement();
    var appBusyModifier = "application--busy";

    if (evt.state === "busy") {
      bem.modifier(appBusyModifier)({element: applicationElement});
    }
    else if (evt.state === "ready") {
      bem.remove(appBusyModifier)({element: applicationElement});
    }
  });

  require("./application-options")(app);
  //require("./application-oms")(app);
  require("./application-retail")(app);
  require("./application-oms-extension")(app);

  configureValidation(app.finishing);
  configureFormatted(app.finishing);
  configureVisibility(app.finishing);
  configureLabeling(app.finishing);
  configureFocus(app.finishing);
  configureContainerInput(app.finishing);
  uxConfig.configureApplicationBlock(app.finishing);

  window.jsua = app;

  return app;
};

},{"./application-oms-extension":143,"./application-options":144,"./application-retail":145,"./extensions/attach-view":147,"./extensions/dev-states":148,"./extensions/http-bestbuy-com-retail/content-set":149,"./extensions/http-uncategorized-marker":152,"./polyfills":154,"./ux-configuration":155,"./ux-patterns":158,"jsua":75,"jsua-bem":1,"jsua-common":9,"jsua-data-transferring":24,"jsua-generic-rendering":25,"jsua-html-rendering":26,"jsua-http-transferring":27,"jsua-image-rendering":28,"jsua-lynx":38,"jsua-markdown-rendering":68,"jsua-text-rendering":69,"jsua-url-encoding":70,"q":134}],147:[function(require,module,exports){
module.exports = exports = function (app) {

  function attachView(result) {
    if (result.element.parentElement) return result;

    var applicationElement = app.getApplicationElement();

    while (applicationElement.firstChild) {
      applicationElement.removeChild(applicationElement.firstChild);
    }

    applicationElement.appendChild(result.element);

    return result;
  }

  var extension = {
    finishing: attachView
  };

  return extension;
};

},{}],148:[function(require,module,exports){
module.exports = exports = function (app) {
  var url = require("url");

  function recordHistory(result) {
    // ignore history for transitions originating from dev states
    if (result.options.origin &&
      (result.options.origin.dataset.devStates ||
      result.options.origin.dataset.devStatesTargetId)) return result;

    var element = result.element;

    if (element.dataset.contentScope) return result;

    if (element.dataset.contentLocation !== document.location.href) {
      //TODO: This will fail for external links.
      history.pushState(null, null, element.dataset.contentLocation);
    }

    return result;
  }

  function appendStatesForEachContentElement(result) {
    if (result.options.origin && result.options.origin.dataset.devStates) return result;

    var applicationElement = app.getApplicationElement();

    var elementToRemove = applicationElement.querySelector("[data-dev-states]");
    if (elementToRemove) {
      elementToRemove.parentElement.removeChild(elementToRemove);
    }

    var selector = "[data-content-location]";
    var contentElements = applicationElement.querySelectorAll(selector);

    contentElements = Array.prototype.slice.call(contentElements);
    // if (result.element.matches(selector)) contentElements.push(result.element);

    function appendStates(contentElement) {
      if (contentElement.dataset.contentType !== "application/lynx+json") return result;
       
      var contentLocation = contentElement.dataset.contentLocation;
      var statesLocation = url.resolve(contentLocation, "./states.lnx");

      var correlationId = "N" + Math.random().toString(36).slice(2);
      contentElement.dataset.devStatesId = correlationId;

      var options = {};
      options.origin = statesContainerElement;
      options.type = "application/lynx+json";

      app.follow(statesLocation, options).then(function (result) {
        var linkElements = result.element.querySelectorAll("a,[role*=link]");

        Array.prototype.forEach.call(linkElements, function (linkElement) {
          linkElement.dataset.devStatesTargetId = correlationId;
        });
      });
    }

    var statesContainerElement = document.createElement("div");
    statesContainerElement.dataset.devStates = "true";
    contentElements.forEach(appendStates);
    applicationElement.appendChild(statesContainerElement);

    return result;
  }

  function attachStatesDocument(result) {
    if (result.element.parentElement) return result;
    if (!result.options.origin || !result.options.origin.dataset.devStates) return result;

    result.options.origin.appendChild(result.element);

    return result;
  }

  function attachStatesTransitionResult(result) {
    if (result.element.parentElement) return result;
    if (!result.options.origin || !result.options.origin.dataset.devStatesTargetId) return result;


    var applicationElement = app.getApplicationElement();
    var targetId = result.options.origin.dataset.devStatesTargetId;
    var selector = "[data-dev-states-id=" + targetId + "]";
    var targetElement = applicationElement.querySelector(selector);
    if (!targetElement) return result;

    app.extensions.common.replaceElementAndPreserveAttributes(targetElement, result.element);
    return result;
  }

  var extension = {
    finishing: {
      recordHistory: recordHistory,
      appendStatesForEachContentElement: appendStatesForEachContentElement,
      attachStatesDocument: attachStatesDocument,
      attachStatesTransitionResult: attachStatesTransitionResult
    }
  };

  return extension;
};

},{"url":111}],149:[function(require,module,exports){
var contentType = require("content-type");

module.exports = exports = function (app) {
  var printEscPos = require("./print-esc-pos")(app);
  var printPdf = require("./print-pdf")(app);

  var extension = {
    lynx: {
      rendering: renderContentSet
    }
  };

  var printers = {
    "application/vnd.bestbuy.esc-pos": printEscPos,
    "application/pdf": printPdf
  };

  function renderContentSet(node) {
    var promiseForElement;

    node.children.forEach(function (childNode) {
      var content = childNode.value;
      var type = contentType.parse(content.type).type;
      var printer = printers[type];

      if (!printer) {
        printer = app.rendering;
      }

      if (!promiseForElement) {
        promiseForElement = printer(content);
      }
      else {
        promiseForElement = promiseForElement.fail(function (err) {
          app.error(err);
          return printer(content);
        });
      }
    });

    return promiseForElement.then(function (result) {
      return result.element;
    });
  }

  return extension;
};

},{"./print-esc-pos":150,"./print-pdf":151,"content-type":126}],150:[function(require,module,exports){
var Q = require("q");
var contentType = require("content-type");
var linesToAdvanceAfterCuttingPaper = 5;

module.exports = exports = function (app) {
  function ensureContentHasData(content) {
    if (content.data) return Q(content);

    return app.transferring(content.src).then(function (content) {
      var type = contentType.parse(content.type).type;
      if (type !== "application/vnd.bestbuy.esc-pos") throw new Error("Invalid content");
      return content;
    }).then(function (transferred) {
      transferred.alt = content.alt;
      return transferred;
    });
  }

  function createThermalPrinterControl() {
    // var thermalPrinterControlMock = {
    //   Open: function () {
    //     return {
    //       OPOSResultCode: 0
    //     };
    //   },
    //   PrintToReceipt: function (data) {
    //     console.log(data);
    //     return {
    //       OPOSResultCode: 0
    //     };
    //   },
    //   CutPaper: function (lines) {
    //     console.log("cut", lines);
    //     return {
    //       OPOSResultCode: 0
    //     };
    //   },
    //   Close: function () {}
    // };
    //
    // return thermalPrinterControlMock;

    var thermalPrinterControl = new ActiveXObject("E3Retail.DMS.Fireball.ComPrinter");
    return thermalPrinterControl;
  }

  function printContent(content) {
    console.log("Started printing ESC-POS content", new Date());

    var thermalPrinterControl = createThermalPrinterControl();
    if (!thermalPrinterControl) throw new Error("Unable to Create OPOS Printer Control");

    try {
      var result = thermalPrinterControl.Open();
      if (!result || result.OPOSResultCode !== 0) throw new Error("Unable to Open OPOS Printer");
      var print = content.data.toString();
      var newlineRegex = /\\n/ig;
      var posESCRegex = /\\x1B/ig;
      print = print.replace(newlineRegex, "\n").replace(posESCRegex, "\x1B");
      result = thermalPrinterControl.PrintToReceipt(print);
      if (!result || result.OPOSResultCode !== 0) throw new Error("Unable to Print to OPOS Printer");

      thermalPrinterControl.CutPaper(linesToAdvanceAfterCuttingPaper);
    }
    finally {
      if (thermalPrinterControl) thermalPrinterControl.Close();
      console.log("Finished printing ESC-POS content", new Date());
    }
  }

  function renderElement(content) {
    var rootElement = document.createElement("div");
    rootElement.dataset.lynxControl = true;
    rootElement.textContent = "Reprint " + content.alt;

    rootElement.addEventListener("click", function (evt) {
      printContent(content);
    });

    printContent(content);

    return {
      content: content,
      element: rootElement
    };
  }

  function printEscPos(content) {
    return ensureContentHasData(content).then(renderElement);
  }

  return printEscPos;
};

},{"content-type":126,"q":134}],151:[function(require,module,exports){
var Q = require("q");

module.exports = exports = function (app) {
  function objectTagHasReadyState() {
    var objectElement = document.createElement("object");
    return ("readyState" in objectElement);
  }

  function renderContentElementUsingObjectTag(content) {
    var contentElement = document.createElement("object");

    contentElement.data = content.src;
    contentElement.type = "application/pdf";

    var altText = content.alt || "Unable to display content from: " + content.src;
    var altElement = document.createElement("a");
    altElement.setAttribute("download", "content");
    altElement.href = content.src;
    altElement.textContent = altText;
    contentElement.appendChild(altElement);

    contentElement.addEventListener("printContent", function () {
      contentElement.PrintWithDialog();
    });

    contentElement.addEventListener("readystatechange", function () {
      if (contentElement.readyState !== 4) return;
      sendPrintContentMessage(contentElement);
    });

    return contentElement;
  }

  function renderContentElementUsingFrameTag(content) {
    function printFrameContentWhenReady() {
      if (contentElement.contentDocument === null) {
        window.setTimeout(printFrameContentWhenReady, 100);
      }
      else {
        if (contentElement.contentDocument.readyState !== "complete") {
          contentElement.contentDocument.addEventListener("readystatechange", function () {
            if (contentElement.contentDocument.readyState !== "complete") return;
            sendPrintContentMessage(contentElement);
          });
        }
        else {
          sendPrintContentMessage(contentElement);
        }
      }
    }

    var contentElement = document.createElement("iframe");
    contentElement.src = content.src;

    contentElement.addEventListener("printContent", function () {
      contentElement.contentWindow.print();
    });

    window.setTimeout(printFrameContentWhenReady, 100);

    return contentElement;
  }

  function renderContentElement(content) {
    var contentElement;

    if (objectTagHasReadyState()) {
      // Internet Explorer goes down this path
      contentElement = renderContentElementUsingObjectTag(content);
    }
    else {
      // Chrome goes down this path
      contentElement = renderContentElementUsingFrameTag(content);
    }

    contentElement.style.position = "fixed";
    contentElement.style.top = "-1px";
    contentElement.style.left = "-1";
    contentElement.style.height = "1px";
    contentElement.style.width = "1px";

    return contentElement;
  }

  function sendPrintContentMessage(element) {
    var evt = document.createEvent("Event");
    evt.initEvent("printContent", true, true);
    element.dispatchEvent(evt);
  }

  function renderElement(content) {
    var rootElement = document.createElement("div");
    rootElement.dataset.lynxControl = true;
    rootElement.textContent = "Reprint " + content.alt;

    var contentElement = renderContentElement(content);

    rootElement.addEventListener("click", function (evt) {
      sendPrintContentMessage(contentElement);
    });

    rootElement.appendChild(contentElement);

    return {
      content: content,
      element: rootElement
    };
  }

  function printPdf(content) {
    return Q(content).then(renderElement);
  }

  return printPdf;
};

},{"q":134}],152:[function(require,module,exports){
module.exports = exports = function (app) {
  var extension = {};

  extension.lynx = {};
  extension.lynx.afterNodeRendering = {};
  extension.lynx.afterNodeRendering.setMarkerFor = setMarkerFor;

  function setMarkerFor(result) {
    if (!result.node.hasHint("http://uncategorized/marker")) return result;
    result.element.dataset.lynxMarkerFor = result.node.value.for;
    return result;
  }

  return extension;
};

},{}],153:[function(require,module,exports){
var url = require("url");
var app = require("../application")();

function recordHistory(result) {
  var element = result.element;

  if (element.dataset.contentScope) return result;
  if (element.dataset.contentLocation === getContentLocation(document.location.href)) return result;
  if (element.querySelector("a[data-follow]")) return result;

  var contentLocation = element.dataset.contentLocation;
  var htmlPageUrl = getHtmlPageUrl(contentLocation);

  history.pushState(null, null, htmlPageUrl);
  return result;
}

app.finishing.add(recordHistory);

window.addEventListener("popstate", function () {
  var contentLocation = getContentLocation(document.location.href);
  app.follow(contentLocation);
});

function getContentLocation(htmlPageUrl) {
  var current = url.parse(htmlPageUrl);
  if (!current || !current.query || current.query.indexOf("url=") !== 0) return null;
  var contentLocation = current.query.substr(4);
  contentLocation = url.resolve(start, contentLocation);
  return contentLocation;
}

function getHtmlPageUrl(contentLocation) {
  var htmlPageUrl = url.parse(document.location.href);
  contentLocation = url.parse(contentLocation);
  htmlPageUrl.search = "?url=" + contentLocation.path;
  return url.format(htmlPageUrl);
}

// var contentLocation = getContentLocation(document.location.href) || "http://localhost:3000/";
var start = url.resolve(document.location.href, "/");
app.follow(start);

// app.transferring(start).then(function (result) {
//   start = result.data.toString();
//   app.follow(start);
// });

},{"../application":146,"url":111}],154:[function(require,module,exports){
if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

},{}],155:[function(require,module,exports){
module.exports = exports = function (app) {
  var bem = app.extensions.bem;
  var common = app.extensions.common;
  var select = common.select;
  var apply = common.finishing.apply;
  var whenReady = common.finishing.whenReady;
  var composite = common.finishing.composite;
  var ux = app.extensions.ux = require("./ux-patterns")(app);

  var extension = {};

  extension.configureApplicationBlock = function configureApplicationBlock(finishing) {
    finishing.add(apply(select.applicationElement, composite(bem.block("application"), (bem.element("application__root")))));
    finishing.add(apply(".application > :first-child", bem.element("application__content")));
    // TODO: Reevaluate after dev-states refactoring.
    finishing.add(apply(select.fromApp(".application > .dev-states"), bem.element("application__dev-states")));
  };

  extension.configureMainSection = function configureMainSection(finishing){
    extension.configureSectionBlock(finishing, ux.selectors.mainSection, "section--main");
    finishing.add(apply(".section--main", function (result) {
      if (select("[data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/listing']")(result.element).some()) {
        bem.remove("section--main")(result);
        bem.modifier("section--full-page")(result);
      }
      
      return result;
    }));
  };
  
  // extension.configurePage = function configurePage(finishing) {
  //   // page block
  //   finishing.add(apply(ux.selectors.pageElement, bem.block("page")));
  //   finishing.add(apply(".page > [data-lynx-hints~=header]", bem.element("page__header")));
  //
  //   //page body layouts
  //   finishing.add(apply(select.wrap(".page > *:not(.page__header)"), composite(bem.block("page-body"), bem.element("page__body"))));
  //   finishing.add(apply(".page__body > *", bem.element("page__body-content")));
  //
  //   finishing.add(apply(".page-body", function (result) {
  //     var select = app.extensions.common.select;
  //
  //     if (select("[data-lynx-name$=Listing]")(result.element).some()) {
  //       return bem.modifier("page-body--full-page")(result);
  //     }
  //
  //     return result;
  //   }));
  // };

  // 
  // extension.configurePageFullWidthBlock = function configurePageFullWidthBlock(finishing) {
  //   // page block
  //   finishing.add(apply(".page-full-width > [data-lynx-hints~=header]", bem.element("page-full-width__header")));
  // 
  //   //page body layouts
  //   finishing.add(apply(select.wrap(".page-full-width > *:not(.page-full-width__header)"), composite(bem.block("page-body"), bem.modifier("page-body--full-page"), bem.element("page-full-width__body"))));
  //   finishing.add(apply(".page-full-width__body > *", bem.element("page-full-width__body-content")));
  // };
  // 
  extension.configureBannerBlock = function configureBannerBlock(finishing) {
    // banner block
    finishing.add(apply("[data-lynx-name=banner]", bem.block("banner")));

    // banner - clock element
    finishing.add(apply(".banner", ux.banner.addClock));
    finishing.add(apply(".banner > *:nth-child(1)", bem.element("banner__clock")));

    // banner - brand element
    finishing.add(apply(".banner > *:nth-child(2)", bem.element("banner__brand")));

    // banner - utilities element
    finishing.add(apply(".banner > *:nth-child(3)", composite(bem.element("banner__utilities"), bem.block("utilities"))));
    finishing.add(apply(".utilities > *", bem.block("utilities-item")));
    finishing.add(apply(".utilities > *", bem.element("utilities__item")));
  };

  extension.configureHeaderBlock = function configureHeaderBlock(finishing) {
    finishing.add(apply("[data-lynx-hints~=header]", bem.block("header")));
    finishing.add(apply(".header[data-lynx-hints~=text]", bem.element("header--text")));
    finishing.add(apply(".header > [data-lynx-hints~=text]", bem.element("header__text")));
    finishing.add(apply(".header > *", bem.element("header__item")));
  };

  extension.configureInputBlock = function configureInputBlock(finishing) {
    finishing.add(apply("input, textarea", bem.block("input")));
    finishing.add(apply("input[type=text]", bem.modifier("input--text")));
    finishing.add(apply("input[type=password]", bem.modifier("input--password")));
    finishing.add(apply("textarea", bem.modifier("input--textarea")));
  };

  extension.configureButtonBlock = function configureButtonBlock(finishing, selector) {
    selector = selector || "[data-lynx-hints~=submit]";
    finishing.add(apply(selector, bem.block("button")));
  };

  extension.configureLinkMixin = function configureLinkBlock(finishing) {
    finishing.add(apply("[data-lynx-hints~=link]", bem.mixin("_link")));
  };

  extension.configureInputSectionBlock = function configureInputSectionBlock(finishing) {
    finishing.add(apply(ux.selectors.inputSections, bem.block("input-section")));
    finishing.add(apply(".input-section", apply(ux.wrapWithInputSection(select.siblings("[data-lynx-hints~=link], [data-lynx-hints~=submit]")), bem.block("input-section"))));
    finishing.add(apply(".input-section > [data-lynx-hints~=header]", bem.element("input-section__header")));
    finishing.add(apply(".input-section > .input.-visible, .input-section > .options.-visible, .input-section > .button.-visible", bem.element("input-section__control")));
    finishing.add(apply(".input-section > *", bem.element("input-section__item")));
  };

  extension.configureFormSectionBlock = function configureFormSectionBlock(finishing) {
    finishing.add(apply(ux.selectors.formSection, bem.block("form-section")));
    finishing.add(apply(".form-section > [data-lynx-hints~=header]", bem.element("form-section__header")));
    finishing.add(apply(".form-section > .form-section", bem.element("form-section__form-section")));
    finishing.add(apply(".form-section > *", bem.element("form-section__item")));
  };

  extension.configureFormBlock = function configureFormBlock(finishing) {
    finishing.add(apply("[data-lynx-hints~=form]", bem.block("form")));
    finishing.add(apply(".form > .input-section > .button", bem.element("form__button")));
    finishing.add(apply(".form > *", bem.element("form__item")));
  };

  extension.configureListingBlock = function configureListingBlock(finishing) {
    finishing.add(apply("[data-lynx-name$=Listing]", bem.block("listing")));
    finishing.add(apply(select.parent(".listing"), function (result) {
      bem.modifier("section--listing")(result);
      return result;
    }));
    finishing.add(apply(".listing > *", composite(bem.block("listing-item"), bem.element("listing__item"))));
    finishing.add(apply("[data-lynx-hints~='http://uncategorized/child']", bem.modifier("listing-item--child")));
    finishing.add(apply(".listing-item > img", composite(bem.remove("listing-item__item"), bem.element("listing-item__image"))));
    finishing.add(apply(select.wrapEachMatching(".listing-item__image"), composite(bem.element("listing-item__item"), bem.element("listing-item__image-wrapper"), bem.modifier("listing-item__item--no-separator"))));
    finishing.add(apply(".listing-item > *", bem.element("listing-item__item")));
    finishing.add(apply(".listing-item > [data-lynx-hints~=header]", bem.element("listing-item__header")));
    
    var compoundSectionFinishing = composite(bem.block("listing-item"), bem.element("listing-item__listing-item"), bem.modifier("listing-item__item--no-separator"));
    finishing.add(apply(ux.selectors.compoundSections(".listing-item__item"), compoundSectionFinishing));
  };

  extension.configureSectionBlock = function configureSectionBlock(finishing, selector, modifier) {
    var blockFn = app.finishing.composite(bem.hasNoBlock());
    blockFn.add(bem.block("section"));

    if (modifier) {
      blockFn.add(bem.modifier(modifier));
    }

    // TODO: Removing the page-body wrapper until we need it.
    // blockFn.add(apply(select.wrap("* > :not([data-lynx-hints~=header]):not([data-lynx-hints~=complement])"), composite(bem.block("section-body"), bem.element("section__body"))));

    finishing.add(apply(selector, blockFn));
    finishing.add(apply(".section > [data-lynx-hints~=header]", bem.element("section__header")));
    finishing.add(apply(".section > [data-lynx-hints~=submit], .section > .input-section > [data-lynx-hints~=submit]", bem.element("section__button")));
    finishing.add(apply(".section > [data-lynx-hints~=complement]", bem.element("section__complement")));
    finishing.add(apply(".section > [data-lynx-hints~=section]", bem.element("section__section")));
    finishing.add(apply(".section > *", bem.element("section__item")));
  };
  
  extension.configureFixedLayout = function configureFixedLayout(finishing) {
    finishing.add(apply(ux.selectors.pageElement, bem.mixin("_fixed")));
    finishing.add(apply("._fixed > [data-lynx-hints~=header]", bem.element("_fixed__top")));
    finishing.add(apply("._fixed [data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/fixed/sticky']", bem.element("_fixed__sticky")));
    finishing.add(apply("._fixed [data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/fixed/top']", bem.element("_fixed__top")));
    finishing.add(apply("._fixed [data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/fixed/left']", bem.element("_fixed__left")));
    finishing.add(apply("._fixed [data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/fixed/right']", bem.element("_fixed__right")));
    finishing.add(apply("._fixed [data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/fixed/bottom']", bem.element("_fixed__bottom")));
    
    ux.fixedLayout();
  };

  extension.configureComplementBlock = function configureComplementBlock(finishing) {
    // TODO: this is temporary - we need to combine the complement and listing-item blocks into same concept
    finishing.add(apply("[data-lynx-hints~=complement]", bem.block("listing-item")));
    finishing.add(apply(".listing-item[data-lynx-hints~=complement] > img", composite(bem.remove("listing-item__item"), bem.element("listing-item__image"))));
    finishing.add(apply(select.wrapEachMatching(".listing-item[data-lynx-hints~=complement] > .listing-item__image"), composite(bem.element("listing-item__item"), bem.element("listing-item__image-wrapper"), bem.modifier("listing-item__item--no-separator"))));
    finishing.add(apply(".listing-item[data-lynx-hints~=complement] > *", bem.element("listing-item__item")));
    finishing.add(apply(".listing-item[data-lynx-hints~=complement] > [data-lynx-hints~=header]", composite(bem.element("listing-item__header"), bem.modifier("listing-item__header--wide"))));
  };

  extension.configurePhrasingContainerBlock = function configurePhrasingContainerBlock(finishing, selector) {
    finishing.add(apply(selector, bem.block("phrasing-container")));
    finishing.add(apply(".phrasing-container > *", bem.element("phrasing-container__item")));
    finishing.add(apply(".phrasing-container > [data-lynx-hints~=header]", bem.element("phrasing-container__header")));
  };

  extension.configureControlsSectionBlock = function configureControlsSectionBlock(finishing, selector) {
    selector = selector || ux.selectors.controlsSection;
    finishing.add(apply(selector, bem.block("form-controls-section")));
    finishing.add(apply(".form-controls-section > *", bem.element("form-controls-section__control")));

    extension.configureButtonBlock(finishing, ".form-controls-section > [data-lynx-hints~=submit], .form-controls-section > [data-lynx-hints~=link]");
    finishing.add(apply(select.first(".form-controls-section > [data-lynx-hints~=submit]"), bem.modifier("form-controls-section__control--primary")));
    finishing.add(apply(".form-controls-section > :last-child", bem.modifier("form-controls-section__control--negative")));
  };

  extension.configureTextBlock = function configureTextBlock(finishing) {
    finishing.add(apply("pre", composite(bem.mixin("_text"), bem.element("_text__content"))));
  };

  extension.configureLinkBlock = function configureLinkBlock(finishing) {
    finishing.add(apply("[data-lynx-hints~=link]", bem.block("link")));
    finishing.add(apply(".link > *", bem.element("link__item")));
  };
  
  extension.configureYouAreHere = function configureYouAreHere(finishing) {
    finishing.add(apply("[data-lynx-marker-for]", function (result) {
      var element = result.element;
      var forScope = element.dataset.lynxMarkerFor;
      
      var elementInMarkerScope = app.extensions.common.findNearestAncestor(element, function (current) {
        return app.extensions.common.scopeIncludesRealm(forScope, current.dataset.contentRealm);
      });
      
      if (elementInMarkerScope) {
        return bem.state("-you-are-here")(result);
      }
      
      return result;
    }));
  };
  
  extension.configureMarkersAsOptions = function configureMarkersAsOptions(finishing) {
    finishing.add(apply(ux.selectors.markersAsOptions, composite(
      bem.mixin("_options"), 
      bem.block("listbox"),
      apply(select.wrapEachMatching(".listbox > *"), composite(
        bem.element("listbox__item-wrapper"),
        apply(select.children("[data-lynx-marker-for]"), composite(bem.mixin("_option"), bem.block("listbox-item"))))),
      apply(".-you-are-here", bem.modifier("_option--selected")))));
  };
  
  extension.configureAttributeList = function configureAttributeList(finishing) {
    finishing.add(apply("[data-lynx-hints~='http://bestbuy.com/retail/ux-patterns/attribute-list']", bem.block("attribute-list")));
    finishing.add(apply(".attribute-list > *", composite(bem.block("attribute"), bem.element("attribute-list__item"))));
    finishing.add(apply(".attribute > [data-lynx-hints~=label]", bem.element("attribute__label")));
  };

  return extension;
};

},{"./ux-patterns":158}],156:[function(require,module,exports){
module.exports = exports = function (app) {
  var bem = app.extensions.bem;
  var select = app.extensions.common.select;
  
  function applyFixedLayout(result) {
    var element = result.element;
    var top = 0, bottom = 0, left = 0, right = 0;
    function fixTop() { 
      select("._fixed__top")(element).forEach(function (el) {
        el.style.top = top + "px";
        top += el.offsetHeight;
      });
    }
    
    function fixBottom() {
      var elements = select("._fixed__bottom")(element).array();
      var elementsReversed = [];

      elements.forEach(function (el) {
        elementsReversed.unshift(el);
      });
      
      elementsReversed.forEach(function (el) {
        el.style.bottom = bottom + "px";
        bottom += el.offsetHeight;
      });
    }
    
    function fixLeft() { 
      select("._fixed__left")(element).forEach(function (el) {
        el.style.top = top + "px";
        el.style.bottom = bottom + "px";
        el.style.left = left + "px";
        left += el.offsetWidth;
      });
    }
    
    function fixRight() {
      var elements = select("._fixed__right")(element).array();
      var elementsReversed = [];

      // There's gotta be a better way.
      elements.forEach(function (el) {
        elementsReversed.unshift(el);
      });
      
      elementsReversed.forEach(function (el) {
        el.style.top = top + "px";
        el.style.bottom = bottom + "px";
        el.style.right = right + "px";
        right += el.offsetWidth;
      });
    }
    
    function fixSticky() {
      var stickiesAboveTop = select("._fixed__sticky")(element).filter(function (el) {
        return el.getBoundingClientRect().top < top;
      });
      
      var currentSticky = select("._fixed__stuck")(element).first();
      
      if (!stickiesAboveTop.some()) {
        if (currentSticky) {
          element.removeChild(currentSticky);
        }
        return;
      }
      
      if (stickiesAboveTop.some()) {
        var stickyToStick = stickiesAboveTop.last();

        var clone = stickyToStick.cloneNode(true);
        
        bem.element("_fixed__stuck")({ element: clone });
        clone.style.position = "fixed";
        clone.style.top = top + "px";
        clone.style.left = left + "px";
        clone.style.right = right + "px";
        
        if (currentSticky) {
          currentSticky.parentElement.replaceChild(clone, currentSticky);
        } else {
          element.appendChild(clone);
        }
      }
    }
    
    fixTop();
    fixBottom();
    fixLeft();
    fixRight();
    fixSticky();
    
    element.style.marginTop = top + "px";
    element.style.marginBottom = bottom + "px";
    element.style.marginLeft = left + "px";
    element.style.marginRight = right + "px";
    
    var verticalMargin = top + bottom;
    element.style.minHeight = "calc(100vh - " + verticalMargin + "px)";
    return result;
  }
  
  function applyOnTimer() {
    var fixedElement = select("._fixed")(app.getApplicationElement()).first();
    
    if (fixedElement) {
      applyFixedLayout({ element: fixedElement });
    }
    
    setTimeout(applyOnTimer, 20);
  }
  
  return applyOnTimer;
};

},{}],157:[function(require,module,exports){
module.exports = exports = function (app) {
  function initializeClock(element) {
    function getLocalTime() {
      var time = new Date();

      return time.toLocaleDateString(navigator.language, {month: "2-digit", day: "2-digit", year: "numeric"}) + " " +
        time.toLocaleTimeString(navigator.language, {hour: '2-digit', minute: '2-digit'});
    }

    function updateLocalTime() {
      if (!app.extensions.common.elementIsAttached(element)) return;

      element.textContent = getLocalTime();
      setTimeout(updateLocalTime, 10000);
    }

    setTimeout(updateLocalTime, 10000);

    element.textContent = getLocalTime();
  }
  
  return {
    addClock: function (result) {
      var clockElement = document.createElement("div");
      result.element.insertBefore(clockElement, result.element.firstChild);
      initializeClock(clockElement);
      
      return result;
    }
  }
};

},{}],158:[function(require,module,exports){
module.exports = exports = function (app) {
  var bem = app.extensions.bem;

  var validityClasses = {
    unknown: "-validity-unknown",
    invalid: "-invalid",
    valid: "-valid"
  };

  var visibilityClasses = {
    hidden: "-hidden",
    concealed: "-concealed",
    visible: "-visible"
  };

  function validityState(result) {
    var state = validityClasses[result.element.dataset.lynxValidationState];
    return bem.state(state)(result);
  }

  function validityChanged(element) {
    var state;

    for (var key in validityClasses) {
      state = validityClasses[key];
      bem.remove(state)({element: element});
    }

    state = validityClasses[element.dataset.lynxValidationState];
    bem.state(state)({element: element});
  }

  function visibilityChanged(element) {
    var state;
    for (var key in visibilityClasses) {
      state = visibilityClasses[key];
      bem.remove(state)({element: element});
    }

    var state = visibilityClasses[element.dataset.lynxVisibility];
    bem.state(state)({element: element});
  }

  function setVisibility(visibility) {
    return function (result) {
      var state;
      for (var p in visibilityClasses) {
        state = visibilityClasses[p];
        bem.remove(state)(result);
      }

      return bem.state(visibilityClasses[visibility])(result);
    };
  }

  function visibilityState(result) {
    return setVisibility(result.element.dataset.lynxVisibility)(result);
  }

  function setValidationContentForStates(result) {
    var state = "-when" + validityClasses[result.element.dataset.lynxValidationContentForState];
    return bem.state(state)(result);
  }

  function wrapWithInputSection(selector) {
    return function (element) {
      var elements = select(selector)(element);
      if (!elements.some()) return new app.extensions.common.Iterable();

      return elements.map(function (inputElement) {
        var inputSection = document.createElement("div");
        inputSection.dataset.lynxHints = "section";

        var header = document.createElement("div");
        header.innerHTML = "&nbsp;";
        header.dataset.lynxHints = "header";
        inputSection.appendChild(header);

        inputElement.parentElement.replaceChild(inputSection, inputElement);
        inputSection.appendChild(inputElement);

        return inputSection;
      });
    };
  }

  var extension = {};
  extension.validityState = validityState;
  extension.validityChanged = validityChanged;
  extension.visibilityChanged = visibilityChanged;
  extension.setVisibility = setVisibility;
  extension.visibilityState = visibilityState;
  extension.setValidationContentForStates = setValidationContentForStates;
  extension.wrapWithInputSection = wrapWithInputSection;

  extension.banner = require("./banner")(app);

  var common = app.extensions.common;
  var select = common.select;
  var Iterable = app.extensions.common.Iterable;
  extension.selectors = {
    pageElement: function selectPageElement(element) {
      if (element.parentElement === app.getApplicationElement()) return new Iterable([element]);
      return new app.extensions.common.Iterable();
    },
    mainSection: function selectMainSection(element) {
      if (element.parentElement !== app.getApplicationElement()) return new Iterable();

      var page = app.getApplicationElement().firstElementChild;
      if (!app.extensions.common.matchesSelector(page, "[data-lynx-hints~=section")) return new Iterable();

      var sections = select.children("[data-lynx-hints~=section")(page);

      return sections.count() === 1 ? sections : new Iterable();
    },
    inputSections: function getInputSections(element) {
      return select("[data-lynx-hints~=section]")(element).filter(function (section) {
        var inputChildren = Array.prototype.filter.call(section.children, function (child) {
          return app.extensions.common.matchesSelector(child, ".input:not(.-hidden), ._options");
        });
        return inputChildren.length === 1;
      });
    },
    formSection: function selectFormSection(element) {
      var formSectionSelector = "[data-lynx-hints~=form] [data-lynx-hints~=section]";
      return select(formSectionSelector)(element).filter(function (el) {
        return Array.prototype.some.call(el.children, function (child) {
          return app.extensions.common.matchesSelector(child, ".input-section");
        });
      });
    },
    controlsSection: function selectControlsSection(element) {
      var formSectionSelector = "[data-lynx-hints~=form] > [data-lynx-hints~=section]";
      return select(formSectionSelector)(element).filter(function (el) {
        return Array.prototype.every.call(el.children, function (child) {
          return app.extensions.common.matchesSelector(child, "[data-lynx-visibility=hidden], [data-lynx-hints~=submit], [data-lynx-hints~=link]");
        });
      });
    },
    markersAsOptions: function selectMarkersAsOptions(element) {
      var markerSelector = "[data-lynx-hints~=form] [data-lynx-hints~='http://uncategorized/marker']";
      return select.parent(markerSelector)(element).filter(function (p) {
        var allSiblingsAreMarkers = Array.prototype.every.call(p.children, function (c) {
          return app.extensions.common.matchesSelector(c, "[data-lynx-hints~='http://uncategorized/marker']");
        });
        
        var someMarkersAreLinks = Array.prototype.some.call(p.children, function (c) {
          return app.extensions.common.matchesSelector(c, "[data-lynx-hints~='link']");
        });
        
        return allSiblingsAreMarkers && someMarkersAreLinks;
      });
    },
    compoundSections: function selectCompoundSections(selector) {
      function isVisibleOrConcealed(el) {
        return app.extensions.common.matchesSelector(el, "[data-lynx-visibility=visible],[data-lynx-visibility=concealed]");
      }
      
      function isNotContent(el) {
        return !app.extensions.common.matchesSelector(el, "[data-lynx-hints~=text],[data-lynx-hints~=content]");
      }
      
      function isCompoundSection(possibleCompoundSection) {
        if(possibleCompoundSection.children.length === 0) return false;
        var children = Array.prototype.slice.call(possibleCompoundSection.children);
        return children.filter(isVisibleOrConcealed).every(isNotContent);
      }
      
      return function (element) {
        var possibleCompoundSections = select(selector)(element);
        return possibleCompoundSections.filter(isCompoundSection);
      };
    }
  };
  
  extension.fixedLayout = require("./_fixed")(app);

  return extension;
};

},{"./_fixed":156,"./banner":157}]},{},[153]);

//# sourceMappingURL=../../out/html-page/application.js.map