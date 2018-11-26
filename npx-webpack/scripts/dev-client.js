/* eslint-disable */
require('eventsource-polyfill')

var hotClient = require('webpack-hot-middleware/client?reload=true')

hotClient.subscribe(function(event) {
    console.log(22222222)
  if (event.action === 'reload') {
    window.location.reload()
  }
})
