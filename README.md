# instant – transparent live-reloading

[![Build Status](https://travis-ci.org/fgnass/instant.png)](https://travis-ci.org/fgnass/instant)

Instant is a drop-in replacement for
[connect.static](http://www.senchalabs.org/connect/middleware-static.html)
that watches all served HTML, CSS and JavaScript files.

### Features

* Works in all browsers including mobile devices and IE6
* No browser plugin required
* Drop-in replacement for the connect.static middleware
* Production mode with zero overhead
* Automatic client code injection

### How it works

Instant automatically injects a script-tag right before the closing `body` tag
of any HTML page (including dynamic ones) in order to load the client code.

The client uses
[server-sent events](http://en.wikipedia.org/wiki/Server-sent_events) to
listen for updates. Browsers that don't support EventSource will fall back to a
[hidden iframe](http://en.wikipedia.org/wiki/Comet_%28programming%29#Hidden_iframe).

### Usage

```js
var express = require('express');
var instant = require('instant');

var app = express();
app.use(instant(__dirname + '/static'));
```

If `{ watch: false }` is passed as option or `$NODE_ENV` is set to `production`
instant will behave just like `connect.static()` with no additional overhead.

### instant(1)

There is also an `instant` binary that can be used to spawn a development
server in the current directory.
The [instant-server](https://github.com/fgnass/instant-server) is packaged as
speparate module and can be installed via npm:

```
npm install -g instant-server
```

### Reloading dynamic files

The instant middlware also exposes a `.reload()` function that can be called to
reload arbitrary URLs. This can be useful if you want to reload scripts or
stylesheets that have been processed/compiled on the fly.

Note: If you don't want to server any static files at all you can safely omit
the  `root` argument.

```js
var express = require('express');
var instant = require('instant');

var app = express();
var ins = instant();

app.use(ins);

app.get('/tick', function(req, res) {
  res.send('Current date: ' + new Date());
});

// Trigger a reload of the page every 10 seconds:
setInterval(function() {
  ins.reload('/tick');
}, 10000);
```

### The MIT License (MIT)

Copyright (c) 2013 Felix Gnass

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
