var through = require('through')
var bops = require('bops')
var os = require('os')

module.exports = CSV
var quote = bops.from('"')[0] // 22

function CSV(lineDelim, cellDelim) {
  if (!(this instanceof CSV)) return new CSV(lineDelim)
  var newline = bops.from(lineDelim || os.EOL)
  var comma = bops.from(cellDelim || ',')[0]
  var buffered
  var inQuotes = false
  
  var stream = through(write, end)
  stream.line = line
  stream.cell = cell
  
  return stream
  
  function write(buf) { 
    var offset = 0
        
    if (buffered) {
      buf = bops.join([buffered, buf])
      buffered = undefined
    }
    
    while (buf) {
      var idx = firstMatch(buf, offset, newline)
      if (idx) {
        var line = bops.subarray(buf, offset, idx)
        if (idx === buf.length) {
          buffered = line
          buf = undefined
          offset = idx
        } else {
          this.queue(line)
          offset = idx + newline.length
        }
      } else {
        if (offset >= buf.length) {
          buffered = undefined
        } else {
          buffered = buf
        }
        buf = undefined
      }
    }
  }
  
  function end() {
    if (buffered) this.queue(buffered)
    this.queue(null)
  }
  
  function firstMatch(buf, offset) {
    var i = offset
    if (offset >= buf.length) return false
    for (var i = offset; i < buf.length; i++) {
      if (buf[i] === quote) { // "
        if (buf[i + 1] === quote) { // ""
          i++
        } else {
          inQuotes = !inQuotes
        }
        continue
      }
      if (buf[i] === newline[0]) {
        if (newline.length > 1) { // multichar newlines e.g. /r/n
          var fullMatch = true
          for (var j = i, k = 0; j < i + newline.length; j++, k++) {
            if (buf[j] !== newline[k]) {
              fullMatch = false
              break
            }
          }
          if (fullMatch && !inQuotes) return j - newline.length
        } else { // singlechar newlines e.g. \n
          if (!inQuotes) break
        }
      }
    }

    var idx = i + newline.length - 1
    return idx
  }

  function line(buf) {
    var cells = []
    var inQuotes = false
    var offset = 0
    for (var i = 0; i < buf.length; i++) {
      if (buf[i] === quote) { // "
        if (buf[i + 1] === quote) { // ""
          i++
        } else {
          inQuotes = !inQuotes
        }
        continue
      }
      if (buf[i] === comma && !inQuotes) {
        var cell = bops.subarray(buf, offset, i)
        cells.push(cell)
        offset = i + 1
      }
    }
    if (offset < buf.length) cells.push(bops.subarray(buf, offset, buf.length))
    return cells
  }
  
  function cell(buf) {
    if (buf[0] === quote && buf[buf.length - 1] === quote) buf = bops.subarray(buf, 1, buf.length - 1)
    
    // TODO way to implement this without looping twice?
    
    var cellLength = 0
    // first loop is to figure out exact length of cell after escaped quotes are removed
    for (var i = 0; i < buf.length; i++) {
      if (buf[i] === quote && buf[i + 1] === quote) i++ // ""
      cellLength++
    }
    var val = bops.create(cellLength)
     
    // second loop fills the val buffer with data
    for (var i = 0, y = 0; i < buf.length; i++) {
      if (buf[i] === quote && buf[i + 1] === quote) i++
      bops.writeUInt8(val, buf[i], y)
      y++
    }
    return val
  }
}
