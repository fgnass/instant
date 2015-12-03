var on = require('sendevent')
  , parse = require('./url')
  , find = require('./find')
  , replace = require('./replace')

var token

on('/instant/events', function(ev) {
  if (ev.token) {
    if (!token) token = ev.token
    if (token != ev.token) return location.reload()
  }

  // reload page if it contains an element with the given class name
  if (ev.className) {
    if (find.byClass(ev.className)) location.reload()
    return
  }

  // reload page if it contains an element that matches the given selector
  if (ev.selector) {
    if (find.bySelector(ev.selector)) location.reload()
    return
  }

  // resolve the URL
  var url = parse(ev.url)
  
  // Remove query and hash strings
  var normalizedLocationHref = location.href.split('#')[0].split('?')[0]

  // reload the page
  if (url.href == normalizedLocationHref) {
    location.reload()
    return
  }

  // look for a stylesheet
  var el = find.byURL('link', 'href', url)
  if (el) return replace(el, url.pathname + '?v=' + new Date().getTime())

  // look for a script
  el = find.byURL('script', 'src', url)
  if (el) location.reload()
})
