var Processor = require('../processor').Processor;
var Importer = require('../directives').Importer;
var fs = require('fs');
var pathutil = require('path');

var Modulizer = function (rootPath, libraryPath) {
    this._rootPath = rootPath;
    this._libraryPath = libraryPath;
    this._readyWaiters = [];
    this._modules = {};
    this._pendingModules = 0;

    this._importing = false;
    this._queuedRootModules = [];
};

Modulizer.prototype = new function () {
    this.resolvePath = function (path, relativeTo) {
        return require('../directives').resolvePath(path, relativeTo, this._rootPath, this._libraryPath);
    };
    this.canonicalPath = function (path, callback) {
        var suffixes = ['', '.js', '/index.js'];
        var self = this;
        var search = function (suffixes, i) {
            if (i < suffixes.length) {
                var suffix = suffixes[i];
                var _path = path + suffix;
                _path = self.resolvePath(_path);
                pathutil.exists(_path, function (exists) {
                    if (exists) {
                        callback(null, path + suffix);
                    } else {
                        search(suffixes, i+1);
                    }
                });
            } else {
                callback(new Error("Cannot find a valid file for " + path));
            }
        };
        search(suffixes, 0);
    };
    this.moduleAtPath = function (path) {
        var suffixes = ['', '.js', '/index.js'];
        for (var i = 0, ii = suffixes.length; i < ii; i++) {
            var suffix = suffixes[i];
            var _path = path + suffix;
            var module = this._modules[_path];
            if (module) {
                return module;
            }
        }
        return null;
    };

    this.importModule = function (path) {
        if (this.moduleAtPath(path)) {
            return; // Nothing to do here (except maybe report a root dependency).
        }

        if (this._importing) {
            this._queuedRootModules.push(path);
        } else {
            this._importRootModule(path)
        }
    };
    this._importRootModule = function (path) {
        this._importing = true;
        var dependencies = [[path, null]];
        var self = this;

        var inOrderDepImport = function () {
            var dependency = dependencies.shift();
            if (!dependency) {
                self._importing = false;
                return self._rootModuleImported();
            }
            var module = self.moduleAtPath(dependency[0]);
            if (module) {
            	if (module.pending) {
                	// Circular import happened here.
                }
                dependency[1] && module.dependencyOf.push(dependency[1].path);
                inOrderDepImport();
            } else {
                self.canonicalPath(dependency[0],
                    function (error, path) {
                        if (error) {
                            callback(error)
                        } else {
                        	var module = {path: path};
                            module.pending = true;
                            module.dependencyOf = dependency[1] ? [dependency[1].path] : [];
                            self._modules[path] = module;
                            self._processModule(path,
                                function (error, result) {
                                    module.pending = false;
                                    module.code = result.code;
                                    module.dependencies = result.dependencies;
                                    for (var i = 0, ii = module.dependencies.length; i < ii; i++) {
                                        dependencies.push([module.dependencies[i], module]);
                                    }
                                    inOrderDepImport();
                                });
                        }
                    });
            }
        };
        inOrderDepImport();
    };
    this._rootModuleImported = function () {
        if (this._queuedRootModules.length == 0 && !this._importing) {
            for (var i = 0, ii = this._readyWaiters.length; i < ii; i++) {
                this._readyWaiters[i]();
            }
        } else {
            this._importRootModule(this._queuedRootModules.shift());
        }
    };
    this._processModule = function (path, callback) {
        var processor = new Processor();
        var importer = new Importer();
        importer.addDirectivesToProcessor(processor);

        var self = this;
        fs.readFile(self.resolvePath(path), 'utf8',
            function (error, text) {
                if (error) {
                    callback(error)
                } else {
                    processor.processText(text, path,
                        function (renderOperation) {
                            var buffer = "";
                            chunks = 0;
                            renderOperation.on('data', function (chunk) {
                                buffer += chunk;
                            });
                            renderOperation.on('end', function () {
                                var module = {
                                    'canonicalPath': path,
                                    'code': buffer,
                                    'dependencies': importer._dependencies
                                };
                                callback(error, module);
                            });
                        });
                }
            });
    };

    this.ready = function (continuation) {
        if (!this._importing && this._queuedRootModules.length == 0) {
            continuation();
        } else {
            this._readyWaiters.push(continuation);
        }
    };
};


var m = new Modulizer('./tests/', './tests/');
m.importModule('root.js');
m.ready(function () {console.log(require('util').inspect(m._modules))});
