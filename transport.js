
  var Transport = basis.Class(null, {
    isReady: false,

    init: function(){
      this.handlers = {};
    },

    ready: function(handler, context){
      if (this.isReady)
        handler.call(context);

      this.onMessage('ready', handler, context);
    },

    message: function(message){
      if (message.action == 'ready')
        this.isReady = true;

      var handlers = this.handlers[message.action];
      if (handlers)
      {
        for (var i = 0, handler; handler = handlers[i]; i++)
          handler.handler.call(handler.context, message.data && message.data.toObject());
      }
    },
    onMessage: function(message, handler, handlerContext){
      if (!this.handlers[message])
        this.handlers[message] = [];

      this.handlers[message].push({
        handler: handler,
        context: handlerContext
      });
    },
    
    call: Function.$undef
  });


  //
  // Chrome plugin transport
  //
  var ChromePluginTransport = Transport.subclass({
    port: null,

    init: function(){
      Transport.prototype.init.call(this);

      this.port = chrome.extension.connect({ name: "extensionUIPort" });
      this.port.onMessage.addListener(this.message.bind(this));
      this.port.postMessage({ action: 'extensionInited', tabId: chrome.devtools.inspectedWindow.tabId});

      this.onMessage('contentScriptInited', this.injectScript, this);

      this.injectScript();
    },
    call: function(funcName){
      var args = Array.from(arguments).slice(1).map(JSON.stringify);

      chrome.devtools.inspectedWindow.eval(
        '(function(){ try { if (basis.appCP) basis.appCP.' + funcName + "(" + (args.length ? args.join(", ") : '') + "); return true;} catch(e){ console.warn(e.toString()) }})();"
      );
    },
    injectScript: function(){
      var pageScript = resource('pageScript.js');
      if (pageScript)
      {
        var port = this.port;
        chrome.devtools.inspectedWindow.eval(pageScript(), function(result){
          if (result)
            port.postMessage({ action: 'pageScriptInited' });
          else
          {
            new basis.ui.Node({
              cssClassName: 'BasisNotSupported',
              container: document.body,
              content: 'Basis not found'
            });
          }
        });
      }
    }
  });

  //
  // SocketTransport
  //
  var SocketTransport = Transport.subclass({
    init: function(){
      Transport.prototype.init.call(this);

      var scriptEl = document.createElement('script');

      scriptEl.src = "/socket.io/socket.io.js";
      scriptEl.onload = this.onLoad.bind(this);
      scriptEl.onError = this.onError.bind(this);

      document.getElementsByTagName('head')[0].appendChild(scriptEl);
    },
    onLoad: function(){
      this.socket = io.connect('localhost:8001');

      var pageScript = resource('pageScript.js')();

      socket.on('connect', function(){
        this.socket.emit('injectScript', pageScript);
      });
      socket.on('clientContected', function(){
        this.socket.emit('injectScript', pageScript);
      });
      socket.on('message', function(message){
        this.message(message);
      });
    },
    onError: function(){
      console.warn('Error on loading socket.io');
    },
    call: function(funcName){
      this.socket.emit('call', funcName, basis.array.from(arguments).slice(1));
    }
  });

  //
  
  module.exports = {
    Transport: Transport,
    ChromePluginTransport: ChromePluginTransport,
    SocketTransport: SocketTransport
  };
  