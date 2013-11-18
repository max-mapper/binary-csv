#!/usr/bin/env node
var bcsv = require('./')
var arg = process.argv[2]
var opts = {json: true}
if (!process.stdin.isTTY || arg === '-') {
  process.stdin.pipe(bcsv(opts)).on('data', function(obj) {
    console.log(JSON.stringify(obj))
  })
} else {
  var fs = require('fs')
  fs.createReadStream(arg).pipe(bcsv(opts)).on('data', function(obj) {
    console.log(JSON.stringify(obj))
  })
}
