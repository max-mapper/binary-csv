var test = require('tape')
var fs = require('fs')
var path = require('path')
var eol = require('os').EOL
var bops = require('bops')
var spectrum = require('csv-spectrum')
var concat = require('concat-stream')
var binaryCSV = require('..')
var read = fs.createReadStream

test('simple csv', function(t) {
  collect('dummy.csv', verify)
  function verify(err, lines) {
    t.false(err, 'no err')
    t.equal(lines[0].toString(), 'a,b,c', 'first row')
    t.equal(lines[1].toString(), '1,2,3', 'second row')
    t.equal(lines.length, 2, '2 rows')
    t.end()
  }
})

test('newlines in a cell', function(t) {
  collect('newlines.csv', verify)
  function verify(err, lines) {
    t.false(err, 'no err')
    t.equal(lines[0].toString(), 'a,b,c', 'first row')
    t.equal(lines[1].toString(), '1,2,3', 'second row')
    t.equal(lines[2].toString(), '"Once upon ' + eol + 'a time",5,6', 'third row')
    t.equal(lines[3].toString(), '7,8,9', 'fourth row')
    t.equal(lines.length, 4, '4 rows')
    t.end()
  }
})

test('raw escaped quotes', function(t) {
  collect('escaped_quotes.csv', verify)
  function verify(err, lines) {
    t.false(err, 'no err')
    t.equal(lines[0].toString(), 'a,b', 'first row')
    t.equal(lines[1].toString(), '1,"ha ""ha"" ha"', 'second row')
    t.equal(lines[2].toString(), '3,4', 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('raw escaped quotes and newlines', function(t) {
  collect('quotes_and_newlines.csv', verify)
  function verify(err, lines) {
    t.false(err, 'no err')
    t.equal(lines[0].toString(), 'a,b', 'first row')
    t.equal(lines[1].toString(), '1,"ha ' + eol + '""ha"" ' + eol + 'ha"', 'second row')
    t.equal(lines[2].toString(), '3,4', 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('line with comma in quotes', function(t) {
  var line = bops.from('John,Doe,120 any st.,"Anytown, WW",08123')
  var correct = JSON.stringify(['John', 'Doe', '120 any st.', '"Anytown, WW"', '08123'])
  var parser = binaryCSV()
  var cells = parser.line(line).map(function(c) { return c.toString() })
  t.equal(JSON.stringify(cells), correct)
  t.end()
})

test('line with newline in quotes', function(t) {
  var line = bops.from('1,"ha ' + eol + '""ha"" ' + eol + 'ha",3')
  var correct = JSON.stringify(['1', '"ha ' + eol + '""ha"" ' + eol + 'ha"', '3'])
  var parser = binaryCSV()
  var cells = parser.line(line).map(function(c) { return c.toString() })
  t.equal(JSON.stringify(cells), correct)
  t.end()
})

test('cell with comma in quotes', function(t) {
  var cell = bops.from('"Anytown, WW"')
  var correct = "Anytown, WW"
  var parser = binaryCSV()
  var parsed = parser.cell(cell)
  t.equal(parsed.toString(), correct)
  t.end()
})

test('cell with newline', function(t) {
  var cell = bops.from('why ' + eol + 'hello ' + eol + 'there')
  var correct = 'why ' + eol + 'hello ' + eol + 'there'
  var parser = binaryCSV()
  var parsed = parser.cell(cell)
  t.equal(parsed.toString(), correct)
  t.end()
})

test('cell with escaped quote in quotes', function(t) {
  var cell = bops.from('"ha ""ha"" ha"')
  var correct = 'ha "ha" ha'
  var parser = binaryCSV()
  var parsed = parser.cell(cell)
  t.equal(parsed.toString(), correct)
  t.end()
})

test('cell with multibyte character', function(t) {
  var cell = bops.from('this ʤ is multibyte')
  var correct = 'this ʤ is multibyte'
  var parser = binaryCSV()
  var parsed = parser.cell(cell)
  t.equal(parsed.toString(), correct, 'multibyte character is preserved')
  t.end()
})

test('geojson', function(t) {
  var parser = collect('test_geojson.csv', verify)
  function verify(err, lines) {
    t.false(err, 'no err')
    var lineObj = {
			"type": "LineString",
			"coordinates": [
				[102.0, 0.0],
				[103.0, 1.0],
				[104.0, 0.0],
				[105.0, 1.0]
			]
		}
    var cells2 = parser.line(lines[2])
    var lineString = parser.cell(cells2[3])
    t.equals(JSON.stringify(lineObj), JSON.stringify(JSON.parse(lineString)), 'linestrings match')
    t.end()
  }
})

test('empty_columns', function(t) {
  var parser = collect('empty_columns.csv', verify)
  function verify(err, lines) {
    t.false(err, 'no err')
    function testLine(buffer) {
      var line = parser.line(buffer)
      t.equal(line.length, 3, "Split into three columns")
      t.ok(/^2007-01-0\d$/.test(line[0]), "First column is a date")
      t.ok(line[1], "Empty column is in line")
      t.equal(line[1] && line[1].length, 0, "Empty column is empty")
      t.ok(line[2], "Empty column is in line")
      t.equal(line[2] && line[2].length, 0, "Empty column is empty")
    }
    lines.forEach(testLine)
    t.end()
  }
})

test('csv-spectrum', function(t) {
  spectrum(function(err, data) {
    var pending = data.length
    data.map(function(d) {
      var parser = binaryCSV({ json: true })
      var collector = concat(function(objs) {
        var expected = JSON.parse(d.json)
        for (var i = 0; i < objs.length; i++) {
          t.equal(JSON.stringify(objs[i]), JSON.stringify(expected[i]), d.name)
        }
        done()
      })
      parser.pipe(collector)
      parser.write(d.csv)
      parser.end()
    })
    function done() {
      pending--
      if (pending === 0) t.end()
    }
  })
})

// helpers

function fixture(name) {
  return path.join(__dirname, 'data', name)
}

function collect(file, cb) {
  var data = read(fixture(file))
  var lines = []
  var parser = binaryCSV()
  data.pipe(parser)
    .on('data', function(line) {
      lines.push(line)
    })
    .on('error', function(err) { cb(err) })
    .on('end', function() { cb(false, lines) })
  return parser
}
