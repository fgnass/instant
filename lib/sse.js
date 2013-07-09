/**
 * Returns a middleware that keeps track of all open requests that accept
 * `text/event-stream` responses, i.e. handle server-sent events.
 * The middleware exposes a `broadcast` function that can be called to send
 * an event to all connected clients.
 */
module.exports = function() {

  var streams = []

  /* Adds the response to the list of event streams */
  function middleware(req, res, next) {

    streams.push(res)

    // Remove res from list of event-streams upon close
    res.on('close', function() {
      var i = streams.indexOf(this)
      if (~i) streams.splice(i, 1)
    })

    if (req.headers.accept == 'text/event-stream') {
      res.sse = function sse(message) {
        if (message) this.write('data: ' + message.split(/\n/).join('\ndata:') + '\n')
        this.write('\n')
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'close'
      })
      res.sse('connected')
    }
    else {

      // If requested with `?close` close the response after the first event
      // has been sent or the timeout of 60s is reached.
      var close, timeout
      if (req.url.match(/close/)) {
        close = function() {
          clearTimeout(timeout)
          res.write('<script>')
          res.write('setTimeout(function() { location.reload() }, 100)')
          res.write('</script>')
          res.end()
          res.emit('close')
        }
        timeout = setTimeout(close, 60000)
      }

      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      })
      res.write('<html><body><script>')

      // A function that is called when events arrive ...
      res.write('function p(msg) { parent.instantEvent({data: msg}) }')

      if (!close) {
        // Add an onload handler to reload the iframe.
        // This happens in IE when the ActiveXObject exceeds a certain timeout.
        res.write('window.onload = function() {')
        res.write('location.href = location.pathname+"?v="+new Date()')
        res.write('}')

        // Add 4K padding so that the browser starts to parse the document
        res.write('/** padding ...' + new Array(4096).join('.') + '*/\n')
      }

      res.write('</script>')

      res.sse = function sse(message) {
        this.write('<script>p(' + JSON.stringify(message) + ')</script>')
        this.write('\n')
        if (close) close()
      }
    }
    if (req.headers['user-agent'] == 'supertest') res.end()
  }

  middleware.broadcast = function(message, event) {
    streams.forEach(function(res) {
      res.sse(message, event)
    })
  }

  return middleware
}


