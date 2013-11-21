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
      .expect(/<script src="\/instant\/client\/bundle\.js"><\/script>/, done)
  })

  it('should serve the client script', function(done) {
    request(app)
      .get('/instant/client/bundle.js')
      .expect(read(__dirname + '/../client/bundle.js', 'utf8'), done)
  })

  it('should expose an EventSource', function(done) {
    request(app)
      .get('/instant/events/')
      .set('Accept', 'text/event-stream')
      .set('Close-Stream', 'true')
      .expect('Content-Type', 'text/event-stream')
      .expect(/hello\ndata: {"token":\d+}\n\n\n/, done)
  })

  it('should expose an forever iframe', function(done) {
    request(app)
      .get('/instant/events/')
      .set('Close-Stream', 'true')
      .expect('Content-Type', 'text/html')
      .expect(/handleSentEvent/, done)
  })
})
