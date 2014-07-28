var fs = require('fs');
var server = require('./server');
var socketIoClientCode = fs
  .readFileSync(__dirname + '/../node_modules/socket.io/node_modules/socket.io-client/socket.io.js', 'utf-8')
  .replace('{', '{var define;');  // fix issue with require.js

exports.process = function(mime, data, fn, fres, location){
  switch (fn) {
    case '/scripts/client.js':
      return (
        socketIoClientCode +
        String(data)
          .replace('{SELF_HOST}', ':' + server.port.client)
      );

    case '/scripts/acp.js':
      return (
        socketIoClientCode +
        String(data)
          .replace('{SELF_HOST}', ':' + server.port.acp)
      );
  }
};
