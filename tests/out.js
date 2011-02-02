var __MODULES__ = __MODULES__ || {};
var require = (function () {
    var _require = function (absolutePath) {
        var module;
        var suffixes = ['', '.js', '/index.js'];
        for (var i = 0, ii = suffixes.length; i < ii && !module; i++) {
            var suffix = suffixes[i];
            var _path = absolutePath + suffix;
            module = __MODULES__[_path];
        }

        if (!module) {
	        throw new Error("The module at \"" + absolutePath + "\" does not exist.");
        }

        // If it's a function then it hasn't been exported yet. Run function and
        //  then replace with exports result.
        if (module instanceof Function) {
            var _exports = {};
            var _module = {id: absolutePath};
            module.call(_module, _requireRelativeTo(absolutePath.replace(/[^\/]+$/,'')), _exports, _module);
            module = _exports;
            __MODULES__[absolutePath] = module;
        }

        return module;
    };
    var normalizePath = function (path) {
        var isAbsolute = path.charAt(0) == '/';
        var pathComponents1 = path.split('/');
        var pathComponents2 = [];
        var component;
        for (var i = 0, ii = pathComponents1.length; i < ii; i++) {
            component = pathComponents1[i];
            switch (component) {
                case '':
                case '.':
                    break;
                case '..':
                    if (pathComponents2.length) {
                        pathComponents2.pop();
                        break;
                    }
                default:
                    pathComponents2.push(component);
            }
        }

        return (isAbsolute ? '/' : '') + pathComponents2.join('/');
    };
    var resolvePath = function (relativePath, path) {
        var absolutePath;
        if (path.charAt(0) == '/') {
            absolutePath = path;
        } else {
            absolutePath = relativePath + '/' + path;
        }
        return normalizePath(absolutePath);
    };
    var _requireRelativeTo = function (relativePath) {
      return function (path) {
        var absolutePath = resolvePath(relativePath, path);
        return _require(absolutePath);
      };
    };
    return _requireRelativeTo('/');
}());

var declareModule = function (absolutePath, module) {
    if (!Object.prototype.hasOwnProperty.call(__MODULES__, absolutePath)) {
        __MODULES__[absolutePath] = module;
    } else {
        // Drop import silently.
    }
};

var declareModules = function (pathModuleMap) {
    for (var absolutePath in pathModuleMap) {
        if (Object.prototype.hasOwnProperty.call(pathModuleMap, absolutePath)) {
            declareModule(absolutePath, pathModuleMap[absolutePath]);
        }
    }
};

declareModules({
  "/root.js": function (require, exports, module) {
    var Model = require("/lib/model");
    var Button = require("/lib/ui/button");
    var Util = require("/lib/util/util");
    var SpecialButton = require("/lib/ui/ext/special_button");
    
    console.log('Model is:');
    console.dir(Model);
    
    console.log('Button is:');
    console.dir(Button);
    
    console.log('SpecialButton is:');
    console.dir(SpecialButton);
    
    console.log('Util is:');
    console.dir(Util);
    },
  "/lib/model/index.js": function (require, exports, module) {
    exports.getSomeData = function () {};
    exports.setSomeData = function () {};
    },
  "/lib/ui/button.js": function (require, exports, module) {
    var Control = require("./control");
    var Util = require("../util/util");
    console.log('MODULE RUN: BUTTON');
    
    exports.button1 = 'button1';
    exports.button2 = 'button2';
    exports.Control = Control;
    },
  "/lib/util/util.js": function (require, exports, module) {
    console.log('MODULE RUN: UTIL');
    
    exports.escapeHTML = function () {};
    exports.escapeHTMLAttribute = function () {};
    exports.importantURL = 'http://example.com/';
    },
  "/lib/ui/ext/special_button.js": function (require, exports, module) {
    var Control = require("../control");
    var Button = require("../../ui/button");
    var Util = require("/lib/util/util");
    console.log('MODULE RUN: SPECIAL BUTTON');
    
    exports.Button = Button;
    exports.Control = Control;
    exports.Util = Util;
    },
  "/lib/ui/control.js": function (require, exports, module) {
    var Util = require("../util/util");
    console.log('MODULE RUN: CONTROL');
    
    exports.i_am_a_control = true;
    exports.utils = Util;
    }
});

