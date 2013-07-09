
!function() {

  var url = '/instant/events/'
  var connected

  /**
   * Forever-iframe fallback for browsers that don't support EventSource.
   */
  function createIframe() {
    var doc = document

    // On IE use an ActiveXObject to prevent the "throbber of doom"
    // see: http://stackoverflow.com/a/1066729
    if (window.ActiveXObject) {
      doc = new ActiveXObject("htmlfile")
      doc.write('<html><body></body></html>')

      // set a global variable to prevent the document from being garbage
      // collected which would close the connection:
      window.instantDocument=doc

      // Expose a global function that can be invoked from within the iframe:
      doc.parentWindow.instantEvent = handle

      //appendIframe(doc, url)
      setTimeout(function() { appendIframe(doc, url) }, 1000)
    }
    else {
      window.instantEvent = handle
      setTimeout(function() { appendIframe(document, url+'?close') }, 1000)
    }
  }

  function appendIframe(doc, url) {
    var i = doc.createElement('iframe')
    i.style.display = 'none'
    i.src = url
    doc.body.appendChild(i)
  }

  function parseUrl(s) {
    var o = new Option()
    o.innerHTML = '<a>'
    o.firstChild.href = s
    o.innerHTML += ''
    return o.firstChild
  }

  function handle(ev) {

    if (ev.data == 'connected') {
      if (connected) return location.reload()
      connected = true
    }

    // resolve the URL
    var url = parseUrl(ev.data)

    // reload the page
    if (url.href == location.href) {
      window.instantDocument = null
      location.reload()
      return
    }

    // look for a stylesheet
    var el = findElement('link', 'href', url)
    if (el) return el.href = url.pathname + '?v=' + new Date().getTime()

    // look for a script
    el = findElement('script', 'src', url)
    if (el) location.reload()
  }

  var init = function() {
    setTimeout(function() {
      var source = new EventSource(url)
      source.onmessage = handle
    }, 2000)
  }

  if (!window.EventSource) init = createIframe

  if (window.attachEvent) attachEvent('onload', init)
  else addEventListener('load', init)

  /**
   * Find the first element with the given tag-name whoes property `prop`
   * matches the specified url.
   */
  function findElement(name, prop, url) {
    var el = document.getElementsByTagName(name)
    for (var i=0; i < el.length; i++)
      if (parseUrl(el[i][prop]).pathname == url.pathname) return el[i]
  }

}()
