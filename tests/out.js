var require = (typeof require != 'undefined') && require.install ? require : (function () {
    var modules = {};
    var main = null;

    var normalizePath = function (path) {
        var pathComponents1 = path.split('/');
        var pathComponents2 = [];
        if (path.charAt(0) == '/') {
            pathComponents1.unshift('');
        }

        var component;
        for (var i = 0, ii = pathComponents1.length; i < ii; i++) {
            component = pathComponents1[i];
            switch (component) {
                case '':
                case '.':
                    if (i == 0) {
                        pathComponents2.push(component);
                    }
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

        return pathComponents2.join('/');
    };

    var rootedPath = function (path, relativePath) {
        var topLevelPath = path;
        if (path.charAt(0) == '.' && (path.charAt(1) == '/' || (path.charAt(1) == '.' && path.charAt(2) == '/'))) {
             topLevelPath = (relativePath || '/') + path;
        }
        return topLevelPath;
    };

    var moduleAtPath = function (topLevelPath) {
        var suffixes = ['', '.js', '/index.js'];
        for (var i = 0, ii = suffixes.length; i < ii; i++) {
            var suffix = suffixes[i];
            var path = topLevelPath + suffix;
            var module = Object.prototype.hasOwnProperty.call(modules, path) && modules[path];
            if (module) {
                // If it's a function then it hasn't been exported yet. Run function and
                //  then replace with exports result.
                if (module instanceof Function) {
                    var _module = {id: topLevelPath, exports: {}};
                    if (!main) {
                        main = _module;
                    }
                    modules[topLevelPath] = _module;
                    module(requireRelativeTo(path.replace(/[^\/]+$/,'')), _module.exports, _module);
                    module = _module;
                }
                return module;
            }
        }
        return null;
    };

    var requireRelativeTo = function (relativePath) {
        var _require = function (path) {
            var topLevelPath = normalizePath(rootedPath(path, relativePath));
            var module = moduleAtPath(topLevelPath);
            if (!module) {
                throw new Error("The module at \"" + topLevelPath + "\" does not exist.");
            }
            return module.exports;
        };
        var _install = function (topLevelPath, module) {
            if (typeof topLevelPath != 'string' || typeof module != 'function') {
                throw new Error("Argument error: install must be given a string function pair.");
            }

            if (moduleAtPath(topLevelPath)) {
                // Drop import silently
            } else {
                modules[topLevelPath] = module;
            }
        };
        _require.install = function (topLevelPathOrModuleMap, module) {
            if (typeof topLevelPathOrModuleMap == 'object') {
                var moduleMap = topLevelPathOrModuleMap;
                for (var topLevelPath in moduleMap) {
                    if (Object.prototype.hasOwnProperty.call(moduleMap, topLevelPath)) {
                        _install(topLevelPath, moduleMap[topLevelPath]);
                    }
                }
            } else {
                _install(topLevelPathOrModuleMap, module);
            }
        };
        _require._modules = modules;
        _require.main = main;

        return _require;
    };

    return requireRelativeTo('/');
})();

require.install({
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
    var square = require("./square");
    var circle = require("./circle");
    var triangle = require("./triangle");

    exports.square = require('./square');
    exports.circle = require('./circle');
    exports.triangle = require('./triangle');
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
  "/lib/model/square.js": function (require, exports, module) {
    exports.type = "SQUARE";
    },
  "/lib/model/circle.js": function (require, exports, module) {
    exports.type = "CIRCLE";
    },
  "/lib/model/triangle.js": function (require, exports, module) {
    exports.type = "TRIANGLE";
    },
  "/lib/ui/control.js": function (require, exports, module) {
    var Util = require("../util/util");
    console.log('MODULE RUN: CONTROL');

    exports.i_am_a_control = true;
    exports.utils = Util;
    }
});
require("/root")

