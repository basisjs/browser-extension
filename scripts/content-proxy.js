var fs = require('fs');
var server = require('./server');
var socketIoClientCode = fs
  .readFileSync(__dirname + '/../node_modules/socket.io/node_modules/socket.io-client/socket.io.js', 'utf-8')
  .replace('{', '{var define;');  // fix issue with require.js

module.exports = {
  server: function(api, options){
    api.addPreprocessor('.js', function(content, filename, cb){
      switch (filename) {
        case '/scripts/client.js':
          cb(null,
            socketIoClientCode +
            String(content)
              .replace('{SELF_HOST}', ':' + server.port.client)
          );
          break;

        case '/scripts/acp.js':
          cb(null,
            socketIoClientCode +
            String(content)
              .replace('{SELF_HOST}', ':' + server.port.acp)
          );
          break;

        default:
          cb(null, content);
      }
    });
  }
};
