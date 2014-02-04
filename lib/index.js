var sendevent = require('sendevent')
  , inject = require('./inject')
  , serve = require('./serve')
  , stack = require('stacked')
  , Gaze = require('gaze').Gaze

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

  // if not explicitly specified watch unless env is production
  var watch = opts.watch
  if (watch === undefined) watch = process.env.NODE_ENV != 'production'

  if (watch) {
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
  }

  if (root && watch) {
    var urlsByFile = {}
      , gaze = new Gaze()

    // when a file is modifed tell all clients to reload it
    gaze.on('changed', function(file) {
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
        gaze.add(path);
      }}
    })
  }

  if (root) {
    fn.use(serve(root, opts))
  }

  return fn
}
