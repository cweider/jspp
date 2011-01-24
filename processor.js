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

function Processor() {
    this._rootPath = null;
    this._libraryPath = null;
    this._workingPath = null;
    this._sandbox = {};
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

    this.processFile = function (filename, callback) {
        var self = this;
        filename = this.resolvePath(filename);
        fs.readFile(filename, 'utf8',
            function (error, text) {
                self.processText(text, filename, callback);
            });
    };

    this.processText = function (text, filename, callback) {
        this._process(text, filename, callback);
    };

    this._process = function (text, filename, callback) {
        var template = new ejs.Template(text, filename);
        var self = this;

        function include(renderOperation, path) {
            var stream = new StreamStream();
            self.processFile(path,
                function (text) {
                    stream.write(text);
                    stream.end();
                });
            renderOperation.write(stream);
        }
        function includeVerbatim(renderOperation, path) {
            var stream = new StreamStream();
            fs.readFile(self.resolvePath(path), 'utf8',
                function (error, text) {
                    stream.write(text);
                    stream.end();
                });
            renderOperation.write(stream);
        };

        var originalWorkingPath = this._workingPath;
        this._workingPath = pathutil.dirname(filename);

        template.executeBuffered(
            {'__processor': this},
            {
            'include': include,
            'includeVerbatim': includeVerbatim
            },
            function (result) {
                self._workingPath = originalWorkingPath;
                callback(result);
            });
    };
}();

exports.Processor = Processor;
