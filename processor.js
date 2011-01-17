/*

  Copyright (C) 2011 Chad Weider

  This software is provided 'as-is', without any express or implied
  warranty.  In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.

*/

var sys = require('sys');
var fs = require('fs');
var pathutil = require('path');
var ejs = require('ejs');

function Processor() {
    this._rootPath = null;
    this._libraryPath = null;
    this._workingPath = null;
    this._sandbox = {};
};
Processor.process = function (path, rootPath, libraryPath) {
    var processor = new this();
    processor.setRootPath(rootPath);
    processor.setLibraryPath(libraryPath);
    var text = fs.readFileSync(path, 'utf8');
    return processor.processTextSync(text, path).content
};
Processor.prototype = new function () {
    this.setRootPath = function (path) {
        this._rootPath = fs.realpathSync(path);
    };
    this.setLibraryPath = function (path) {
        this._libraryPath = fs.realpathSync(path);
    };
    this.resolvePath = function (path) {
        var absolutePath;
        if (path.charAt(0) == '/') {
            absolutePath = pathutil.join(this._rootPath, path);
        } else if (path.charAt(0) == '.') {
            absolutePath = pathutil.join(this._workingPath, path);
        } else {
            absolutePath = pathutil.join(this._libraryPath, path);
        }
        return pathutil.normalize(absolutePath);
    };

    this.processFileSync = function (filename) {
        filename = this.resolvePath(filename);
        var text = this._readFileSync(filename);
        return this.processTextSync(text, filename);
    };

    this.processTextSync = function (text, filename) {
        var output = this._process(text, filename);
        return {content: output};
    };

    this._readFileSync = function (filename) {
        var text = fs.readFileSync(filename, 'utf8');
        return text;
    };

    this._process = function (text, filename) {
        var renderOperation = [];
        function echo(value) {
            if (value !== null && value !== undefined) {
                renderOperation.push(value.toString());
            }
        }
        var self = this;
        function include(path) {
            var result = self.processFileSync(path);
            renderOperation.push(result.content);
        }
        function includeVerbatim(path) {
            var text = self._readFileSync(self.resolvePath(path), 'utf8');
            renderOperation.push(text);
        }

        var code = ejs.compile(text);
        var environment = {
            'echo': echo,
            'include': include,
            'includeVerbatim': includeVerbatim,
            '__processor': this
            };

        // Archive environment
        var originalEnvironment = {};
        for (var key in environment) {
            originalEnvironment[key] = this._sandbox[key];
            this._sandbox[key] = environment[key];
        }
        var originalWorkingPath = this._workingPath;
        this._workingPath = pathutil.dirname(filename);

        Script = process.binding('evals').Script;
        Script.runInNewContext(code, this._sandbox, filename);

        // Restore environment
        for (var key in originalEnvironment) {
            this._sandbox[key] = originalEnvironment[key];
        }
        this._workingPath = originalWorkingPath;

        return renderOperation.join('');
    };
}();

exports.Processor = Processor;
