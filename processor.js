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
var ejs = require('ejs');
var StreamStream = require('ejs/util').StreamStream;

function Processor() {
    this._sandbox = {};
    this._directives = {};
};
Processor.prototype = new function () {
    this.addDirectives = function (directives) {
      for (var directive in directives) {
          this.addDirective(directive, directives[directive]);
      }
    };
    this.addDirective = function (directive, func) {
        var self = this;
        this._directives[directive] = func;
    };

    this.processText = function (text, filename, callback) {
        var template = new ejs.Template(text, filename);
        var self = this;
        var directives = {};
        for (var directive in this._directives) {
            directives[directive] = function (func) {
                return function () {
                    var args = Array.prototype.slice.call(arguments, 0);
                    args.unshift(filename);
                    return func.apply(self, args)
                };
            }(this._directives[directive]);
        }

        template.execute(this._sandbox, directives, callback);
    };
}();

exports.Processor = Processor;
