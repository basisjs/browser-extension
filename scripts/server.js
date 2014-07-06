var fs = require('fs');
var http = require('http');
var socketIo = require('socket.io');

var TTL = 15 * 60 * 1000; // 15 min offline -> remove from client list
var ports = {};
var clients = {};

var clientServer = socketIo(http.createServer().listen(null, function(){
  ports.client = this.address().port;
}));
var acpServer = socketIo(http.createServer().listen(null, function(){
  ports.acp = this.address().port;
}));


/**
* Generates unique id.
* random() + performance.now() + Date.now()
* @param {number=} len Required length of id (16 by default).
* @returns {string} Generated id.
*/
function genUID(len){
  function base36(val){
    return parseInt(Number(val), 10).toString(36);
  }

  var result = (global.performance ? base36(global.performance.now()) : '') + base36(new Date);

  if (!len)
    len = 16;

  while (result.length < len)
    result = base36(1e12 * Math.random()) + result;

  return result.substr(result.length - len, len);
}


//
// client model
//
function getClientList(){
  var result = [];

  for (var key in clients)
    result.push(['id', 'online', 'title', 'location'].reduce(function(res, field){
      res[field] = clients[key][field];
      return res;
    }, {}));

  return result;
}
function updateClientList(){
  if (acpServer)
    acpServer.sockets.emit('clientList', getClientList());
}

function Client(id, online, title, location){
  this.id = id;
  this.online = !!online;
  this.title = title || '[no title]';
  this.location = location || '[unknown]';

  clients[id] = this;
  updateClientList();
}
Client.prototype = {
  id: null,
  online: false,

  offlineTime: null,
  setOnline: function(){
    if (!this.online)
    {
      this.offlineTime = null;
      this.online = true;
      updateClientList();
    }
  },
  setOffline: function(){
    if (this.online)
    {
      this.online = false;
      this.offlineTime = new Date();
      updateClientList();
      setTimeout(function(){
        if (!this.online && (new Date() - this.offlineTime) > TTL)
        {
          delete clients[this.clientId];
          updateClientList();
        }
      }.bind(this), TTL);
    }
  }
};


//
// Client server
//
clientServer.sockets.on('connect', function(socket){
  console.log('connected');

  socket.on('disconnect', function(){
    console.log('disconnected');

    var client = clients[this.clientId];
    if (client)
      client.setOffline();
  });

  socket.on('handshake', function(data){
    data = data || {};

    var clientId = data.clientId || genUID();
    var client = clients[clientId];

    if (!client)
      client = new Client(clientId, true, data.title, data.location);
    else
    {
      client.title = data.title;
      client.location = data.location;
      client.setOnline();
    }

    this.clientId = clientId;
    this.emit('handshake', {
      clientId: clientId
    });
  });

  socket.on('info', function(data){
    data = data || {};

    var clientId = data.clientId || genUID();
    var client = clients[clientId];

    if (!client)
    {
      console.error('Wrong client id (' + clientId + '), client info not found');
      return;
    }

    client.location = data.location || '[unknown]';
    client.title = data.title || '[no title]';

    updateClientList();
  });
});


//
// ACP server
//
acpServer.sockets.on('connect', function(socket){
  console.log('connected');

  socket.on('disconnect', function(){
    console.log('disconnect');
  });

  socket.on('handshake', function(data){
    data = data || {};

    this.emit('handshake', {
      clients: getClientList()
    });
  });
});


//
// export
//
module.exports = {
  port: ports
};
