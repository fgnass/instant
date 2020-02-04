var sendevent = require('sendevent')
  , inject = require('./inject')
  , serve = require('./serve')
  , stack = require('stacked')
  , filewatcher = require('filewatcher')
  , Graceful = require('node-graceful')

// timestamp to detect server-restarts
var startup = Date.now()

module.exports = function(root, opts) {

  if (typeof root == 'object' && !(root instanceof Array)) {
    opts = root
    root = opts.root
  }

  if (!opts) opts = {}

  var fn = stack()
  fn.reload = function() {}

  // bypass in production
  var bypass = opts.bypass
  if (bypass === undefined) bypass = process.env.NODE_ENV == 'production'

  if (!bypass) {
    // the prefix under which the eventstream and the client is exposed
    var prefix = opts.prefix || '/instant'

    var events = sendevent(prefix + '/events')

    fn.use(events)
      .use(inject(prefix + '/client/bundle.js'))
      .mount(prefix + '/client', serve(__dirname + '/../client'))

    // when a client connects send the startup time
    events.on('connect', function(client) {
      client.send({ token: startup })
    })

    fn.reload = function (ev) {
      if (typeof ev == 'string') ev = { url: ev }
      if (ev) events.broadcast(ev)
    }

    if (root && opts.watch !== false) {
      var urlsByFile = {}

      fn.watcher = filewatcher({ delay: opts.delay })

      // Stop the file system watcher so apps can exit gracefully when
      // terminated by Ctrl+c (SIGINT) or a polite termination request (SIGTERM).
      // You can also call the cleanUp() function directly to handle housekeeping
      // in your own server (e.g., when it is asked to close).
      fn.cleanUp = function (done) {
        fn.watcher.removeAll()
        done()
      }
      Graceful.timeout = 3000
      Graceful.on('SIGINT', fn.cleanUp)
      Graceful.on('SIGTERM', fn.cleanUp)

      // when a file is modifed tell all clients to reload it
      fn.watcher.on('change', function(file) {
        fn.reload(urlsByFile[file])
      })

      // build a RegExp to match all watched file extensions
      var exts = opts.watch || ['html', 'js', 'css']
        , re = new RegExp('\\.(' + exts.join('|') + ')$')

      // pass an `onfile` handler that watches matching files
      opts = Object.create(opts, {
        onfile: { value: function(path, stat) {
          if (!re.test(path)) return
          urlsByFile[path] = this.path
          this._maxage = 0
          fn.watcher.add(path)
        }}
      })
    }
  } else {
    // Bypass requested.

    // Create a noop cleanUp() method so that it can be called without
    // having the calling app having to check for whether we are running
    // in production mode or not.
    fn.cleanUp = function (done) {
      // Do nothing on purpose.
      done()
    }
  }

  if (root) {
    if (root instanceof Array) {
      // Multiple roots.
      root.forEach(r => {
        fn.use(serve(r, Object.create(opts)))
      })
    } else {
      // Single root.
      fn.use(serve(root, opts))
    }
  }

  return fn
}
