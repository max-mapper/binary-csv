# binary-csv

# Update: you should use [csv-parser](https://www.npmjs.org/package/csv-parser) instead, it has the same API as this but is faster

A fast CSV parser written in javascript.

[![NPM](https://nodei.co/npm/binary-csv.png)](https://nodei.co/npm/binary-csv/)

[![badge](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)](http://dat-data.com)

Consumes `Buffer` in node or `Uint8Array` in the browser (thanks to [bops](https://github.com/chrisdickinson/bops)). Whereas most CSV parsers parse `String` data, this library never converts binary data into non-binary data. It's fast because it never creates Numbers, Strings, Arrays or Objects -- only binary representations of the line and cell values in the CSV, meaning the JS VM spends less time doing things like decoding UTF8 strings and going back and forth between C++ and JS.

By default it will only split lines, but you can use the provided `.line` and `.cell` methods to parse the cells and cell values.

Parses a 55 million line, 5.18GB CSV in a little over 1 minute.

### demo

See a demo running in the browser on RequireBin:

[![http://requirebin.com/?gist=maxogden/7555664](http://requirebin.com/badge.png)](http://requirebin.com/?gist=maxogden/7555664)

You can also load any CSV on the internet via querystring, e.g.:

http://requirebin.com/embed?gist=maxogden/7555664&csv=http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv

Huge CSVs might be slow to render because of the terminal renderer used in the demo.

### usage

You can use it two ways: programmatically in Node programs, or from the command line.

##### binaryCSV([options])

```js
var binaryCSV = require('binary-csv')
var parser = binaryCSV()
```

`parser` is a duplex stream -- you can pipe data to it and it will emit a buffer for each line in the CSV

#### default options

```js
{
  separator: ',',
  newline: '\n',
  detectNewlines: true,
  json: false
}
```

if `json` is truthy then the parser stream will emit fully decoded JSON objects representing each row of the csv (combined with the header row)

```js
fs.createReadStream('data.csv').pipe(parser)
  .on('data', function(line) { })
```

### parser.line(buf)

Parses cells from a line buffer. Returns an array of cell buffers.

```js
var cells = parser.line(new Buffer('hello,world'))
// returns equivalent of [new Buffer('hello'), new Buffer('world')]
```

### parser.cell(buf)

Parses a single cell buffer, returns the unescaped data in a buffer.

```js
var cell = parser.cell(new Buffer('"this is a ""escaped"" csv cell value"'))
// returns equivalent of new Buffer('this is a "escaped" csv cell value")
```

See `test/test.js` for more examples.

### CLI API

To use on the command line install it globally:

```bash
$ npm install binary-csv -g
```

This should add the `bcsv` command to your `$PATH`.

Then, you either pipe data into it or give it a filename:

```bash
# pipe data in
$ cat some_data.csv | bcsv
# pass a filename
$ bcsv some_data.csv
# tell bcsv to read from + wait on stdin
$ bcsv -
```

### run the test suite

```bash
$ npm install
$ npm test
```
