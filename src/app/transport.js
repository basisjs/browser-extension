// default
var config = resource('./transport/static.js');

// choose suitable config
if (global.chrome && global.chrome.extension)
  config = resource('./transport/plugin.js');
else
  config = resource('./transport/server.js');

/**
* transport
*/
module.exports = config();
