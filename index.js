var through = require('through')
var bops = require('bops')
var extend = require('extend')

module.exports = CSV
var quote = bops.from('"')[0] // 22

function CSV(opts) {
  if (!(this instanceof CSV)) return new CSV(opts)
  if (!opts) opts = {}
  
  var newline
  var buffered
  var headers
  var inQuotes
  
  var defaults = {
    separator: ',',
    newline: '\n',
    detectNewlines: true,
    json: false
  }
  
  opts = extend(defaults, opts)
  
  if (opts.detectNewlines) delete opts.newline
  else newline = bops.from(opts.newline)
  
  var comma = bops.from(opts.separator || ',')[0]

  var stream = through(write, end)
  
  stream.line = line
  stream.cell = cell
  stream.options = opts
  
  return stream
  
  function write(buf) {
    
    inQuotes = false
    
    var offset = 0
     
    if (buffered) {
      buf = bops.join([buffered, buf])
      buffered = undefined
    }
    
    if (!newline) {
      for (var i = 0; i < buf.length; i++) {
        if (buf[i] === 13) { // \r
          if (i === buf.length) return
          if (buf[i + 1] === 10) { // \n
            newline = bops.from('\r\n')
            break
          } else {
            newline = bops.from('\r')
            break
          }
        } else if (buf[i] === 10) { // \n
          if (i === buf.length) return
          newline = bops.from('\n')
          break
        }
      }
    }
    
    while (buf) {
      var idx
      if (newline) idx = nextLine(buf, offset)
      if (idx) {
        var line = bops.subarray(buf, offset, idx)
        if (idx === buf.length) {
          buffered = line
          buf = undefined
          offset = idx
        } else {
          queue(line)
          offset = idx + newline.length
        }
      } else {
        if (offset >= buf.length) {
          buffered = undefined
        } else {
          buffered = bops.subarray(buf, offset, buf.length)
        }
        buf = undefined
      }
    }
  }
  
  function end() {
    if (buffered) queue(buffered)
    queue(null)
  }
  
  function queue(lineBuffer) {
    if (opts.json && lineBuffer) {
      var cells = line(lineBuffer)
      for (var i = 0; i < cells.length; i++) {
        cells[i] = bops.to(cell(cells[i]))
      }
      if (!headers) return headers = cells
      lineBuffer = zip(headers, cells)
    }
    stream.queue(lineBuffer)
  }
  
  function zip(headers, cells) {
    var obj = {}
    for (var i = 0; i < headers.length; i++) obj[headers[i]] = cells[i]
    return obj
  }
  
  function nextLine(buf, offset) {
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
    if (idx > buf.length) return false
    
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
    if (buf[buf.length - 1] === comma) cells.push(bops.create(0))
    return cells
  }
  
  function cell(buf) {
    if (buf[0] === quote && buf[buf.length - 1] === quote) buf = bops.subarray(buf, 1, buf.length - 1)
    
    // TODO way to implement this without looping twice?

    var start = 0
    var end = buf.length
    if (buf[start] === quote && buf[end - 1] === quote) {
      start++
      end--
    }
    
    var cellLength = 0
    // first loop is to figure out exact length of cell after escaped quotes are removed
    for (var i = start; i < end; i++) {
      if (buf[i] === quote && buf[i + 1] === quote) i++ // ""
      cellLength++
    }
    var val = bops.create(cellLength)
     
    // second loop fills the val buffer with data
    for (var i = start, y = 0; i < end; i++) {
      if (buf[i] === quote && buf[i + 1] === quote) i++
      val[y] = buf[i]
      y++
    }
    return val
  }
}
