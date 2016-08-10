var connections = {};

function getConnection(id) {
  if (id in connections === false) {
    connections[id] = {
      page: null,
      plugin: null
    };
  }

  return connections[id];
}

function sendToPage(connection, payload) {
  if (connection && connection.page) {
    console.log('-> page', payload);
    connection.page.postMessage(payload)
  } else {
    console.warn('-> page [not sent - no connection]', payload);
  }
}

function sendToPlugin(connection, payload) {
  if (connection && connection.plugin) {
    console.log('-> plugin', payload);
    connection.plugin.postMessage(payload)
  } else {
    console.warn('-> plugin [not sent - no connection]', payload);
  }
}

function connectPage(page) {
  var tabId = page.sender.tab && page.sender.tab.id;
  var connection = getConnection(tabId);

  connection.page = page;

  if (connection.plugin) {
    sendToPlugin(connection, { event: 'connect' });
    sendToPage(connection, { event: 'connect' });
  }

  page.onMessage.addListener(function(payload) {
    console.log('page -> plugin', payload);

    // proxy: page -> plugin
    sendToPlugin(connection, payload);
  });

  page.onDisconnect.addListener(function() {
    connection.page = null;
    sendToPlugin(connection, { event: 'disconnect' });
  });
}

function connectPlugin(plugin) {
  var connection;

  plugin.onMessage.addListener(function(payload) {
    console.log('plugin -> page', payload);

    if (payload.event == 'plugin:init') {
      connection = getConnection(payload.tabId);
      connection.plugin = plugin;
      //connection.tabId = plugin.sender.tab && plugin.sender.tab.id;

      if (connection.page) {
        sendToPlugin(connection, { event: 'connect' });
        sendToPage(connection, { event: 'connect' });
      }

      return;
    }

    // proxy: plugin -> page
    sendToPage(connection, payload);
  });

  plugin.onDisconnect.addListener(function() {
    if (connection) {
      console.log('plugin disconnect');
      connection.plugin = null;
      sendToPage(connection, { event: 'disconnect' });
    }
  });
}

chrome.extension.onConnect.addListener(function(port) {
  if (port.name == 'basisjsDevtool:page')
    connectPage(port);

  if (port.name == 'basisjsDevtool:plugin')
    connectPlugin(port);
});
