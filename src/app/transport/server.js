module.exports = {
  init: function(){
    var self = this;
    var online = false;
    var script = document.createElement('script');
    script.src = '/acp';
    script.onerror = function(){
      basis.dev.warn('Error on loading socket.io');
    };
    script.onload = function(){
      var socket = global.__AcpSocket__;
      self.socket = socket;
      // self.socket.on('connect', function(){
      //   self.socket.emit('message', { action: 'appcpReady' });
      // });
      // self.socket.on('message', function(message){
      //   if (message.action == 'clientConnected')
      //     self.socket.emit('message', { action: 'appcpReady' });

      //   self.message(message);
      // });

      // connection events
      self.socket
        .on('connect', function(){
          online = true;
          self.socket.emit('handshake');
        })
        .on('disconnect', function(){
          online = false;
        })
        .on('handshake', function(data){
          console.log('handshake', data);
          app.type.Client.all.sync(data.clients);
        })
        .on('clientList', function(data){
          app.type.Client.all.sync(data);
          // data.forEach(function(i){ console.log(i); });
        });
    };
    basis.doc.head.add(script);
  },

  invoke: function(funcName){
    if (this.socket)
      this.socket.emit('message', {
        action: 'call',
        data: {
          method: funcName,
          args: basis.array.from(arguments, 1)
        }
      });
    else
      console.warn('no socket');
  }
};
