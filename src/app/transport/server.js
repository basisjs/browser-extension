module.exports = {
  init: function(){
    var Client = require('app.type').Client;
    var profile = require('app.type').Profile();

    var self = this;
    var script = document.createElement('script');
    script.src = '/acp';
    script.onerror = function(){
      basis.dev.warn('Error on loading socket.io');
    };
    script.onload = function(){
      self.socket = global.__AcpSocket__
        .on('connect', function(){
          profile.set_online(true);
          this.emit('handshake');
        })
        .on('disconnect', function(){
          profile.set_online(false);
        })
        .on('handshake', function(data){
          console.log('handshake', data);
          Client.all.sync(data.clients);
        })
        .on('clientList', function(data){
          Client.all.sync(data);
        });
    };
    basis.doc.head.add(script);
  },

  invoke: function(action, clientId, args, callback){
    if (this.socket)
      this.socket.emit(action, clientId, args, callback);
    else
      console.warn('no socket');
  }
};
