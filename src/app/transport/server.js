module.exports = {
  init: function(){
    var self = this;
    var script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onerror = function(){
      basis.dev.warn('Error on loading socket.io');
    };
    script.onload = function(){
      self.socket = io.connect('/');
      self.socket.on('connect', function(){
        self.socket.emit('message', { action: 'appcpReady' });
      });
      self.socket.on('message', function(message){
        if (message.action == 'clientConnected')
          self.socket.emit('message', { action: 'appcpReady' });

        self.message(message);
      });
    };
    basis.doc.head.add(script);
  },

  invoke: function(funcName){
    this.socket.emit('message', {
      action: 'call',
      data: {
        method: funcName,
        args: basis.array.from(arguments, 1)
      }
    });
  }
};
