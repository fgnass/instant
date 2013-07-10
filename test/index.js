
var instant = require('..')
  , http = require('http')
  , request = require('supertest')
  , assert = require('assert')
  , read = require('fs').readFileSync

var app = http.createServer(instant(__dirname + '/fixture'))

describe('instant', function() {
  it('should inject the client script', function(done) {
    request(app)
      .get('/index.html')
      .expect(/<script src="\/instant\/client\/client\.js"><\/script>/, done)
  })

  it('should serve the client script', function(done) {
    request(app)
      .get('/instant/client/client.js')
      .expect(read(__dirname + '/../client/client.js', 'utf8'), done)
  })

  it('should expose an EventSource', function(done) {
    request(app)
      .get('/instant/events/')
      .set('Accept', 'text/event-stream')
      .set('User-Agent', 'supertest')
      .expect('Content-Type', 'text/event-stream')
      .expect(/data: token:\d+\n\n/, done)
  })

  it('should expose an forever iframe', function(done) {
    request(app)
      .get('/instant/events/')
      .set('User-Agent', 'supertest')
      .expect('Content-Type', 'text/html')
      .expect(/instantEvent/, done)
  })
})
