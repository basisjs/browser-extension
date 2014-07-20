var contentScriptPorts = {};
var extensionUIPorts = {};
var extensionTabIdTab = {};

function attachContentScriptPort(port){
  var tabId = port.sender.tab && port.sender.tab.id;
  contentScriptPorts[tabId] = port;

  port.onMessage.addListener(function(payload){
    if (extensionUIPorts[tabId])
    {
      // proxy: content.js -> extension
      extensionUIPorts[tabId].postMessage(payload);

      var action = payload.action;
      if (action == 'token' || action == 'pickTemplate')
        chrome.tabs.update(extensionTabIdTab[tabId], {
          active: true
        });
    }
  });

  port.onDisconnect.addListener(function(){
    delete contentScriptPorts[tabId];
  });
}

function attachExtensionUIPort(port){
  var extensionTabId = port.sender.tab && port.sender.tab.id;
  var inspectedTabId;

  port.onMessage.addListener(function(payload){
    console.log('extension ->', payload);
    var action = payload.action;

    // save references
    if (action == 'extensionInit')
    {
      inspectedTabId = payload.tabId;
      extensionUIPorts[inspectedTabId] = port;

      if (extensionTabId)
        extensionTabIdTab[inspectedTabId] = extensionTabId;
    }

    // proxy: extension -> content.js
    if (contentScriptPorts[inspectedTabId])
      contentScriptPorts[inspectedTabId].postMessage(payload);
  });

  port.onDisconnect.addListener(function(){
    delete extensionUIPorts[inspectedTabId];
  });
}

chrome.extension.onConnect.addListener(function(port){
  if (port.name == 'basisjsContentScriptPort')
    attachContentScriptPort(port);

  if (port.name == 'basisjsExtensionPort')
    attachExtensionUIPort(port);
});


/*chrome.contextMenus.create({
  type: 'separator'
});*/

/*chrome.contextMenus.create({
  title: 'Translate',
  contexts: ["all"],
  onclick: function(info, tab){
    if (extensionUIPorts[tab.id])
      extensionUIPorts[tab.id].postMessage({ action: 'contextMenuTranslate' });
  }
});*/
