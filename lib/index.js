'use strict';

var sendevent = require('sendevent')
  , inject = require('./inject')
  , serve = require('./serve')
  , stack = require('stacked')
  , filewatcher = require('filewatcher')

// timestamp to detect server-restarts
var startup = Date.now()

module.exports = function(root, opts) {

  if (typeof root == 'object') {
    opts = root
    root = opts.root
  }

  if (!opts) opts = {}

  var fn = stack()
  fn.reload = function() {}
  var watcher = filewatcher()
  var re;

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
    var urlsByFile = {}

    // when a file is modifed tell all clients to reload it
    watcher.on('change', function(file) {
      fn.reload(urlsByFile[file])
    })

    // build a RegExp to match all watched file extensions
    var exts = opts.watch || ['html', 'js', 'css']
    re = new RegExp('\\.(' + exts.join('|') + ')$')
  }

  fn.add = function( new_root ) {
    if ( !bypass && new_root && opts.watch !== false) {
      // pass an `onfile` handler that watches matching files
      opts = Object.create(opts, {
        onfile: { value: function(path, stat) {
          if (!re.test(path)) return
          urlsByFile[path] = this.path
          this._maxage = 0
          watcher.add(path)
        }}
      })
    }

    if (new_root) {
      fn.use(serve(new_root, opts))
    }
    return fn;
  }

  return fn.add(root);

}
