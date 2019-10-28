var on = require('sendevent')
  , parse = require('./url')
  , find = require('./find')
  , replace = require('./replace')

var token

function reloadPage() {
  // Firefox has a quirk where it times out and disconnects an EventSource
  // connection when the host (not hostname) is “localhost” and it does
  // a regular reload from memory cache. Instead, we must do a forced reload from
  // the server and also flag it so that sendevent doesn’t also do
  // a forced reload just to be sure (and thereby adding an unnecessary reload).
  // Also, when we do a forced reload, Firefox loses the current scroll position
  // so we must save that so checking for the existence of the object that contains
  // the location to restore is how we know that we have asked for a force reload.
  if (navigator.userAgent.includes('Firefox') && document.location.host === 'localhost') {
    console.log('[instant] Firefox running on host localhost. Doing full reload.')
    window.locationToRestoreAfterForcedReload = {
      x: window.scrollX,
      y: window.scrollY
    }
    location.reload(true)
  } else {
    // In every other case, we can just do a regular reload.
    console.log('[instant] Not Firefox running on host location. Doing regular reload.')
    location.reload()
  }
}

on('/instant/events', function(ev) {
  if (ev.token) {
    if (!token) token = ev.token
    if (token != ev.token) return reloadPage()
  }

  // reload page if it contains an element with the given class name
  if (ev.className) {
    if (find.byClass(ev.className)) reloadPage()
    return
  }

  // reload page if it contains an element that matches the given selector
  if (ev.selector) {
    if (find.bySelector(ev.selector)) reloadPage()
    return
  }

  // resolve the URL
  var url = parse(ev.url)

  // reload the page
  if (url.href == location.href) {
    reloadPage()
    return
  }

  // look for a stylesheet
  var el = find.byURL('link', 'href', url)
  if (el) return replace(el, url.pathname + '?v=' + new Date().getTime())

  // look for a script
  el = find.byURL('script', 'src', url)
  if (el) reloadPage()
})
