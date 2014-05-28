/* global describe, it */

var instant = require('..')
  , http = require('http')
  , request = require('supertest')
  , assert = require('assert')
  , read = require('fs').readFileSync

var ins = instant(__dirname + '/fixture')
  , app = http.createServer(ins)

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
      .buffer(false)
      .expect('Content-Type', 'text/event-stream')
      .end(expect(/data: {"token":\d+}/, done))
  })

  it('should allow manual reloads', function(done) {
    request(app)
      .get('/instant/events/')
      .set('Accept', 'text/event-stream')
      .buffer(false)
      .end(function(err, res) {
        ins.reload('/foo')
        expect(/data: {"url":"\/foo"}/, done)(err, res)
      })
  })

  it('should expose an forever iframe', function(done) {
    request(app)
      .get('/instant/events/')
      .expect('Content-Type', 'text/html')
      .buffer(false)
      .end(expect(/handleSentEvent/, done))
  })
})


function expect(re, done) {
  return function(err, res) {
    if (err) return done(err)
    res.on('data', function(data) {
      if (re.exec(data)) done()
    })
  }
}
