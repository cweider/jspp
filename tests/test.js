#! /usr/bin/node

var fs = require('fs');
var jspp = require('../jspp');

var prefix = process.argv[2];

var text = fs.readFileSync(prefix, 'utf8');
var processor = new jspp.Processor(process.cwd());
processor.append(text);

console.log(processor.output());
