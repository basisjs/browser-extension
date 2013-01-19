
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

      for (var i = 0, handler; handler = this.handlers[message.action][i]; i++)
        handler.handler.call(handler.context, message.data && message.data.toObject());
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
  // Plugin transport
  //
  var ChromePluginTransport = Transport.subclass({
    port: null,

    init: function(){
      Transport.prototype.init.call(this);

      this.port = chrome.extension.connect({ name: "extensionUIPort" });
      this.port.onMessage.addListener(this.message.bind(this));
      this.port.postMessage({ action: 'extensionInited', tabId: chrome.devtools.inspectedWindow.tabId});

      this.onMessage('transportInited', function(){
        this.message({ action: 'ready' });
      }, this);
      this.onMessage('contentScriptInited', this.injectScript, this);

      this.injectScript();
    },
    call: function(funcName){
      var args = Array.from(arguments).slice(1).map(JSON.stringify);

      chrome.devtools.inspectedWindow.eval(
        '(function(){ try { if (window.pageScript) window.pageScript.' + funcName + "(" + (args.length ? args.join(", ") : '') + "); return true;} catch(e){ console.warn(e.toString()) }})();"
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

  var transportClass = chrome && chrome.extension ? ChromePluginTransport : Transport;

  module.exports = new transportClass({});
