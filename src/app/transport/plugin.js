
  basis.require('basis.dom');

  var Transport = resource('transport.js').fetch();
  var inspectedWindow = chrome.devtools.inspectedWindow;

  module.exports = new Transport({
    port: null,

    init: function(){
      Transport.prototype.init.call(this);

      this.port = chrome.extension.connect({
        name: 'extensionUIPort'
      });
      this.port.onMessage.addListener(this.message.bind(this));
      this.port.postMessage({
        action: 'extensionInited',
        tabId: inspectedWindow.tabId
      });

      this.onMessage('contentScriptInited', this.injectScript, this);

      this.injectScript();
    },
    call: function(funcName){
      var args = basis.array.from(arguments, 1).map(JSON.stringify);

      inspectedWindow.eval(
        '(function(){\n' +
        '  try {\n' +
        '    if (basis.appCP)\n' +
        '      basis.appCP.' + funcName + '(' + args.join(', ') + ');\n' +
        '    return true;\n' +
        '  } catch(e){ console.warn(e.message, e); }\n' +
        '})();'
      );
    },
    injectScript: function(){
      var port = this.port;

      inspectedWindow.eval(resource('pageScript.js').fetch(), function(result){
        if (result)
          port.postMessage({
            action: 'pageScriptInited'
          });
        else
          document.body.appendChild(
            basis.dom.createElement('.BasisNotSupported', 'basis.js not found')
          );
      });
    }
  });
