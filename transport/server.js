
  basis.require('basis.dom');

  var Transport = resource('transport.js').fetch();

  module.exports = new Transport({
    init: function(){
      var self = this;

      Transport.prototype.init.call(this);

      basis.dom.appendHead(basis.dom.createElement({
        description: 'script[src="/socket.io/socket.io.js"]',
        error: function(){
          basis.dev.warn('Error on loading socket.io');
        },
        load: function(){
          self.socket = io.connect('/');
          self.socket.on('connect', function(){
            self.injectScript();
          });
          self.socket.on('message', function(message){
            if (message.action == 'clientConnected')
              self.injectScript();

            self.message(message);
          })
        }
      }));
    },
    injectScript: function(){
      this.socket.emit('message', { 
        action: 'injectScript', 
        data: resource('pageScript.js').fetch() 
      });
    },
    call: function(funcName){
      this.socket.emit('message', { 
        action: 'call', 
        data: { 
          method: funcName, 
          args: basis.array.from(arguments).slice(1)
        }
      });
    }
  });
