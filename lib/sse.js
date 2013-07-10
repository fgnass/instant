/**
 * Returns a middleware that keeps track of all open connections and adds a
 * `.sse()` method to the response object that can be used to push a message
 * to the client.
 *
 * The middleware also exposes a `broadcast` function that can be called to
 * send a message to all connected clients.
 */
module.exports = function() {

  var connected = []
  var token = Date.now()

  function middleware(req, res, next) {

    /**
     * Remove the response from the list of connected clients.
     */
    function removeResponse() {
      var i = connected.indexOf(res)
      if (~i) connected.splice(i, 1)
    }

    /**
     * Sends a token that can be used by the client to detect server restarts.
     * Since instant only watches files once they have been requested, the
     * client should reload the whole page in case of a token mismatch.
     */
    function sendToken() {
      res.sse('token:' + token)
    }

    /**
     * Initialize the event stream and add a sse() method to the response that
     * sends text/event-stream formatted data.
     */
    function initEventStream() {
      res.sse = function sse(message) {
        if (message) this.write('data: ' + message.split(/\n/).join('\ndata:') + '\n')
        this.write('\n\n') // Add extra line-breaks for Opera Mobile
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'close'
      })

      sendToken()
    }

    /**
     * Initialize the iframe document and add a sse() method to the response
     * that emits inline script tags.
     */
    function initIframe() {
      var close
        , timeout

      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      })

      res.write('<html><body>')

      // Emit the p() function that passes the messages to the parent window
      res.write('<script>')
      res.write('function p(msg) { parent.instantEvent({data: msg}) }')
      res.write('</script>')

      // Add an sse() method that emits inline scripts which call p()
      res.sse = function sse(message) {
        this.write('<script>p(' + JSON.stringify(message) + ')</script>')
        this.write('\n')
        if (close) close()
      }

      if (req.url.match(/close/)) {
        // If requested with `?close` close the response after the first event
        // has been sent or the timeout of 60s is reached.
        close = function() {
          clearTimeout(timeout)
          res.write('<script>')
          res.write('setTimeout(function() { location.reload() }, 0)')
          res.write('</script>')
          res.end()
          removeResponse()
        }
        timeout = setTimeout(close, 60000)
      }

      if (!close) {
        // After a certain timeout the "htmlfile" ActiveXObject closes the
        // connection and fires an onload event ...
        res.write('<script>')
        res.write('window.onload = function() {')
        res.write('location.href = location.pathname+"?v="+new Date()')
        res.write('}')
        res.write('</script>')

        // Add 4K padding so that the browser starts to parse the document
        res.write(new Array(4096).join('.'))

        sendToken()
      }
    }

    connected.push(res)
    res.on('close', removeResponse)

    if (req.headers.accept == 'text/event-stream') initEventStream()
    else initIframe()

    // Close the connection if called from the test-suite
    if (req.headers['user-agent'] == 'supertest') {
      res.end()
      removeResponse()
    }
  }

  middleware.broadcast = function(message, event) {
    connected.forEach(function(res) {
      res.sse(message, event)
    })
  }

  return middleware
}


