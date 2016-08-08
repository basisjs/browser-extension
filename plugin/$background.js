var connections = {};

function getConnection(id){
  if (id in connections == false)
    connections[id] = {
      page: null,
      plugin: null
    };

  return connections[id];
}

function attachPagePort(port){
  var tabId = port.sender.tab && port.sender.tab.id;
  var connection;

  console.log('page connected');
  port.onMessage.addListener(function(payload){
    console.log('content -> plugin', payload);
    var action = payload.action;

    if (action == 'contentScriptInit' && !connection)
    {
      console.log('page init');
      connection = getConnection(tabId);
      connection.page = port;

      if (connection.plugin)
        connection.page.postMessage({
          action: 'extensionInit'
        });
    }

    // proxy: page -> plugin
    if (connection && connection.plugin)
    {
      console.log('page -> plugin', payload);
      connection.plugin.postMessage(payload);
    }
    else
      console.log('page -> plugin not sent - no connection', payload);
  });

  port.onDisconnect.addListener(function(){
    if (connection)
    {
      console.log('page disconnect');
      connection.page = null;

      if (connection.plugin)
        connection.plugin.postMessage({
          action: 'contentScriptDestroy'
        });
    }
  });
}

function attachPluginPort(port){
  var connection;

  console.log('plugin connect');
  port.onMessage.addListener(function(payload){
    var action = payload.action;

    // save references
    if (action == 'extensionInit' && !connection)
    {
      console.log('plugin init');
      connection = getConnection(payload.tabId);
      connection.plugin = port;
      //connection.tabId = port.sender.tab && port.sender.tab.id;

      if (connection.page)
        connection.plugin.postMessage({
          action: 'contentScriptInit'
        });
    }

    // proxy: plugin -> page
    
    if (connection && connection.page)
    {
      console.log('plugin -> page', payload);
      connection.page.postMessage(payload);
    }
    else
      console.log('plugin -> page not sent - no connection', payload);
  });

  port.onDisconnect.addListener(function(){
    if (connection)
    {
      console.log('plugin disconnect');
      connection.plugin = null;
      if (connection.page)
        connection.page.postMessage({
          action: 'extensionDestroy'
        });
    }
  });
}

chrome.extension.onConnect.addListener(function(port){
  if (port.name == 'basisjsContentScriptPort')
    attachPagePort(port);

  if (port.name == 'basisjsExtensionPort')
    attachPluginPort(port);
});
