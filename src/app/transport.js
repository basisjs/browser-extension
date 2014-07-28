// choose suitable transport
module.exports =
  global.chrome && global.chrome.extension
    ? require('./transport/plugin.js')
    : require('./transport/server.js');
