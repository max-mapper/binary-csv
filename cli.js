#!/usr/bin/env node
var bcsv = require('./')
var arg = process.argv[2]
if (!process.stdin.isTTY || arg === '-') {
  process.stdin.pipe(bcsv()).pipe(process.stdout)  
} else {
  var fs = require('fs')
  fs.createReadStream(arg).pipe(bcsv()).pipe(process.stdout)
}
