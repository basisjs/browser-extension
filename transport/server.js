
  var Transport = resource('transport.js')();

  var ServerSocketTransport = Transport.subclass({
    init: function(){
      Transport.prototype.init.call(this);

      var scriptEl = document.createElement('script');

      scriptEl.src = "/socket.io/socket.io.js";
      scriptEl.onload = this.onLoad.bind(this);
      scriptEl.onError = this.onError.bind(this);

      document.getElementsByTagName('head')[0].appendChild(scriptEl);
    },
    onLoad: function(){
      this.socket = io.connect('/');

      var self = this;
      this.socket.on('connect', function(){
        self.injectScript();
      });
      this.socket.on('message', function(message){
        if (message.action == 'clientConnected')
          self.injectScript();

        self.message(message);
      });
    },
    onError: function(){
      console.warn('Error on loading socket.io');
    },
    injectScript: function(){
      var pageScript = resource('../pageScript.js')();
      this.socket.emit('message', { 
        action: 'injectScript', 
        data: pageScript 
      });
    },
    call: function(funcName){
      this.socket.emit('message', { 
        action: 'call', 
        data : { 
          method: funcName, 
          args: basis.array.from(arguments).slice(1)
        }
      });
    }
  });


  module.exports = ServerSocketTransport;