# binary-csv

A fast CSV parser written in javascript.

[![NPM](https://nodei.co/npm/binary-csv.png)](https://nodei.co/npm/binary-csv/)

Consumes `Buffer` in node or `Uint8Array` in the browser (thanks to [bops](https://github.com/chrisdickinson/bops)). Whereas most CSVs parse `String` data, this library never converts binary data into non-binary data. It's fast because it never creates Numbers, Strings, Arrays or Objects -- only binary representations of the line and cell values in the CSV.

By default it will only split lines, but you can use the provided `.line` and `.cell` methods to parse the cells and cell values.

### usage

### binaryCSV([lineDelim, cellDelim])

```
var binaryCSV = require('binary-csv')
var parser = binaryCSV()
```

`parser` is a duplex stream -- you can pipe data to it and it will emit a buffer for each line in the CSV

```
fs.createReadStream('data.csv').pipe(parser)
  .on('data', function(line) { })
```

You can optionall pass in line and cell delimiters -- the defaults are the current operating systems newline delimiter (from `require('os').EOL`) and `,`, respectively.

### parser.line(buf)

Parses cells from a line buffer. Returns an array of cell buffers.

```
var cells = parser.line(new Buffer('hello,world'))
// returns equivalent of [new Buffer('hello'), new Buffer('world')]
```

### parser.cell(buf)

Parses a single cell buffer, returns the unescaped data in a buffer.

```
var cell = parser.cell(new Buffer('"this is a ""escaped"" csv cell value"'))
// returns equivalent of new Buffer('this is a "escaped" csv cell value")
```

See `test/test.js` for more examples.

### run the test suite

```
npm install
npm test
```
