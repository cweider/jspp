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
