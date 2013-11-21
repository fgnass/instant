var sendevent = require('sendevent')
  , inject = require('./inject')
  , serve = require('./serve')
  , stack = require('stacked')
  , chokidar = require('chokidar')

module.exports = function(root, options) {
  var opts = Object.create(options || {})
    , startup = Date.now()

  if (opts.watch === false || process.env.NODE_ENV == 'production')
    return serve(root, opts)

  var events = sendevent('/instant/events')
    , watcher = chokidar.watch([])
    , urlsByFile = {}

  events.on('connect', function(client) {
    client.send({ token: startup })
  })

  watcher.on('change', function(file) {
    events.broadcast({ url: urlsByFile[file] })
  })

  var exts = opts.watch || ['html', 'js', 'css']
    , re = new RegExp('\\.(' + exts.join('|') + ')$')

  opts.onfile = function watch(path, stat) {
    if (!re.test(path)) return
    urlsByFile[path] = this.path
    this._maxage = 0
    watcher.add(path)
  }

  return stack()
    .use(events)
    .use(inject('/instant/client/bundle.js'))
    .mount('/instant/client', serve(__dirname + '/../client'))
    .use(serve(root, opts))
}
