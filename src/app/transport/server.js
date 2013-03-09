
  basis.require('basis.dom');

  module.exports = {
    init: function(){
      var self = this;

      basis.dom.appendHead(basis.dom.createElement({
        description: 'script[src="/socket.io/socket.io.js"]',
        error: function(){
          basis.dev.warn('Error on loading socket.io');
        },
        load: function(){
          self.socket = io.connect('/');
          self.socket.on('connect', function(){
            self.socket.emit('message', { action: 'appcpReady' });
          });
          self.socket.on('message', function(message){
            if (message.action == 'clientConnected')
              self.socket.emit('message', { action: 'appcpReady' });

            self.message(message);
          });
        }
      }));
    },

    call: function(funcName){
      this.socket.emit('message', { 
        action: 'call', 
        data: { 
          method: funcName, 
          args: basis.array.from(arguments, 1)
        }
      });
    }
  };
