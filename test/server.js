'use strict';
var express = require('express');
var app = module.exports = express();

var instance = require('../lib/index.js');
var instantClient = instance();
app.use( instantClient.add( __dirname + '/fixture' ) );
app.use( instantClient.add( __dirname + '/fixture2' ) );

app.start = function(port) {
  // start the web server
  return app.listen(port,function() {
    console.log('Web server listening at: %s', port);
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start(3000);
}
