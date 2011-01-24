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
var StreamStream = require('ejs/util').StreamStream;

var normalizePath = function (path, relativeTo) {
    if (path.charAt(0) == '.') {
        return pathutil.normalize(pathutil.join(relativeTo || this._workingPath || '/', path));
    } else {
        return path;
    }
};
var resolvePath = function (path, workingPath, rootPath, libraryPath) {
    var absolutePath;
    if (path.charAt(0) == '/') {
        absolutePath = pathutil.join(rootPath, path);
    } else if (path.charAt(0) == '.') {
        absolutePath = pathutil.join(workingPath || rootPath, path);
    } else {
        absolutePath = pathutil.join(libraryPath, path);
    }
    return pathutil.normalize(absolutePath);
};

var Includer = function (rootPath, libraryPath) {
    this._rootPath = rootPath;
    this._libraryPath = libraryPath;
};

Includer.prototype = new function () {
    this.addDirectivesToProcessor = function (processor) {
        var self = this;
        processor.addDirectives({
            'include': function () {
                var args = Array.prototype.slice.call(arguments, 0);
                args.unshift(this);
                return self.include.apply(self, args)
            },
            'includeVerbatim': function () {
                var args = Array.prototype.slice.call(arguments, 0);
                args.unshift(this);
                return self.includeVerbatim.apply(self, args)
            }
        });
    };
    this.include = function (processor, filename, renderOperation, path) {
        var path = resolvePath(path, pathutil.dirname(filename), this._rootPath, this._libraryPath);
        var stream = new StreamStream();
        renderOperation.write(stream);
        fs.readFile(path, 'utf8', function (error, text) {
            processor.processText(text, path,
                function (renderOperation) {
                    stream.write(renderOperation);
                    stream.end();
                });
            });
    };
    this.includeVerbatim = function (processor, filename, renderOperation, path) {
        var path = resolvePath(path, pathutil.dirname(filename), this._rootPath, this._libraryPath);
        var stream = new StreamStream();
        renderOperation.write(stream);
        fs.readFile(path, 'utf8',
            function (error, text) {
                stream.write(text);
                stream.end();
            });
    };
}();

exports.Includer = Includer;
