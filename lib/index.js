var sse = require('./sse')
  , inject = require('./inject')
  , serve = require('./serve')
  , stack = require('stacked')
  , chokidar = require('chokidar')

module.exports = function(root, options) {
  var opts = Object.create(options || {})

  if (opts.watch === false || process.env.NODE_ENV == 'production')
    return serve(root, opts)

  var events = sse()
    , watcher = chokidar.watch([])
    , urlsByFile = {}

  watcher.on('change', function(file) {
    events.broadcast(urlsByFile[file])
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
    .use(inject('/instant/client/client.js'))
    .mount('/instant/events', events)
    .mount('/instant/client', serve(__dirname + '/../client'))
    .use(serve(root, opts))
}
