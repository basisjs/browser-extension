var fs = require('fs');
var http = require('http');
var socketIo = require('socket.io');

var TTL = 15 * 60 * 1000; // 15 min offline -> remove from client list
var CLIENT_FIELDS = {
  title: '[no title]',
  location: '[unknown]',
  devpanel: false
};
var ports = {};
var clients = {};

var clientServer = socketIo(http.createServer().listen(9101, function(){
  ports.client = this.address().port;
}));
var acpServer = socketIo(http.createServer().listen(9102, function(){
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
  {
    var client = clients[key];
    var info = Object.keys(CLIENT_FIELDS)
      .reduce(function(res, field){
        res[field] = clients[key][field];
        return res;
      }, {});
    info.id = client.id;
    info.online = !!client.socket;
    result.push(info);
  }

  return result;
}
function updateClientList(){
  if (acpServer)
    acpServer.sockets.emit('clientList', getClientList());
}

function Client(id, socket, data){
  this.id = id;
  this.socket = socket;

  for (var key in CLIENT_FIELDS)
    this[key] = Object.prototype.hasOwnProperty.call(data, key)
      ? data[key]
      : CLIENT_FIELDS[key];

  clients[id] = this;
  updateClientList();
}
Client.prototype = {
  id: null,
  socket: null,

  offlineTime: null,
  update: function(data){
    for (var key in data)
      if (Object.prototype.hasOwnProperty.call(CLIENT_FIELDS, key))
        this[key] = data[key];
  },
  setOnline: function(socket){
    if (!this.socket)
    {
      this.offlineTime = null;
      this.socket = socket;
      updateClientList();
    }
  },
  setOffline: function(){
    if (this.socket)
    {
      this.socket = null;
      this.offlineTime = new Date();
      updateClientList();
      setTimeout(function(){
        if (!this.socket && (new Date() - this.offlineTime) > TTL)
        {
          delete clients[this.id];
          updateClientList();
        }
      }.bind(this), TTL);
    }
  },
  send: function(action, args, callback){
    if (this.socket)
      this.socket.emit(action, args, callback);
    else
      callback('Client is offline');
  }
};


//
// Client server
// page -> server
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
    {
      client = new Client(clientId, this, data);
    }
    else
    {
      client.update(data);
      client.setOnline(this);
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

    client.update(data);
    updateClientList();
  });

  socket.on('devpanelPacket', function(channelId, data){
    acpServer.emit('devpanelPacket', channelId, data);
  });
});


//
// ACP server
// server -> ACP
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

  socket.on('init-devpanel', function(clientId, args, callback){
    var client = clients[clientId];

    if (typeof callback != 'function')
      callback = Function();

    if (!client)
    {
      var er = 'Wrong client id (' + clientId + '), client info not found';
      console.error(er);
      callback(er);
      return;
    }

    client.send('init-devpanel', null, callback);
  });
});


//
// export
//
module.exports = {
  port: ports
};
