# binary-csv

A fast CSV parser written in javascript.

[![NPM](https://nodei.co/npm/binary-csv.png)](https://nodei.co/npm/binary-csv/)

Consumes `Buffer` in node or `Uint8Array` in the browser (thanks to [bops](https://github.com/chrisdickinson/bops)). Whereas most CSV parsers parse `String` data, this library never converts binary data into non-binary data. It's fast because it never creates Numbers, Strings, Arrays or Objects -- only binary representations of the line and cell values in the CSV, meaning the JS VM spends less time doing things like decoding UTF8 strings and going back and forth between C++ and JS.

By default it will only split lines, but you can use the provided `.line` and `.cell` methods to parse the cells and cell values.

Parses a 55 million line, 5.18GB CSV in a little over 1 minute.

### usage

You can use it two ways: programmatically in Node programs, or from the command line.

##### binaryCSV([lineDelim, cellDelim])

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

### CLI API

To use on the command line install it globally:

```
npm install binary-csv -g
```

This should add the `bcsv` command to your `$PATH`.

Then, you either pipe data into it or give it a filename:

```
# pipe data in
cat some_data.csv | bcsv
# pass a filename
bcsv some_data.csv
# tell bcsv to read from + wait on stdin
bcsv -
```

### run the test suite

```
npm install
npm test
```
