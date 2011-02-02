var fs = require('fs');
var pathutil = require('path');
var Modulizer = require('./modularize').Modulizer;

var m = new Modulizer('./tests/', './tests/');
m.importModule('/root.js');
m.ready(function () {
    var kernel = fs.readFileSync(pathutil.join(__dirname, 'kernel.js'), 'utf8');

    packedCode = [];
    packedCode.push(kernel);
    packedCode.push('declareModules({');
    var moduleEntries = [];
    for (var path in m._modules) {
        var module = m._modules[path];
        var modularizedCode = 'function (require, exports, module) {\n' + module.code + '}'
        moduleEntries.push("  " + JSON.stringify(path) + ": " +
            modularizedCode.replace(/\n/g, "\n    ")
            );
    }
    packedCode.push(moduleEntries.join(',\n'));
    packedCode.push('});\n');

    console.log(packedCode.join('\n'));
});
