
  var Transport = resource('transport.js')();

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
      var pageScript = resource('../pageScript.js');
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

  module.exports = ChromePluginTransport;
