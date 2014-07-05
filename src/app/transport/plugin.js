var inspectedWindow = chrome.devtools.inspectedWindow;

module.exports = {
  init: function(){
    this.port = chrome.extension.connect({
      name: 'extensionUIPort'
    });
    this.port.onMessage.addListener(this.message.bind(this));
    this.port.postMessage({
      action: 'extensionInited',
      tabId: inspectedWindow.tabId
    });

    this.onMessage('contentScriptInited', function(){
      this.port.postMessage({ action: 'appcpReady' });
    }, this);

    this.port.postMessage({ action: 'appcpReady' });
  },

  invoke: function(funcName, onError){
    var args = basis.array.from(arguments, 1).map(JSON.stringify);

    inspectedWindow.eval(
      '(function(){\n' +
      '  try {\n' +
      '    if (basis.appCP)\n' +
      '      basis.appCP.' + funcName + '(' + args.join(', ') + ');\n' +
      '    return true;\n' +
      '  } catch(e){ console.warn(e.message, e); return false }\n' +
      '})();',
      (onError && typeof onError == 'function' ? function(isSuccessful){
        if (!isSuccessful)
          onError();
      } : undefined)
    );
  }
};
