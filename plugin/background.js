var connections = {};

function getConnection(id){
  if (id in connections == false)
    connections[id] = {
      content: null,
      extension: null
    };

  return connections[id];
}

function attachContentScriptPort(port){
  var tabId = port.sender.tab && port.sender.tab.id;
  var connection;

  port.onMessage.addListener(function(payload){
    console.log('content -> plugin', payload);
    var action = payload.action;

    if (action == 'contentScriptInit' && !connection)
    {
      connection = getConnection(tabId);
      connection.content = port;

      if (connection.extension)
        connection.content.postMessage('extensionInit');
    }

    // proxy: content.js -> extension
    if (connection && connection.extension)
      connection.extension.postMessage(payload);

    // chrome.windows.update(extensionUIPorts[tabId].sender.tab.windowId, {
    //   focused: true
    // });
    // chrome.tabs.update(tabId, {
    //   active: true
    // });
  });

  port.onDisconnect.addListener(function(){
    clearInterval(x);
    if (connection)
      connection.content = null;
  });
  var x = setInterval(function(){
    port.postMessage({
      action: 'xxx',
      connections: connections
    });
  }, 1000);
}

function attachExtensionUIPort(port){
  var connection;

  port.onMessage.addListener(function(payload){
    console.log('extension ->', payload);
    var action = payload.action;

    // save references
    if (action == 'extensionInit' && !connection)
    {
      connection = getConnection(payload.tabId);
      connection.extension = port;
      //connection.tabId = port.sender.tab && port.sender.tab.id;

      if (connection.content)
        connection.extension.postMessage('contentScriptInit');
    }

    // proxy: extension -> content.js
    if (connection && connection.content)
      connection.content.postMessage(payload);
  });

  port.onDisconnect.addListener(function(){
    if (connection)
      connection.extension = null;
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
