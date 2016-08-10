var DEBUG = false;
var inspectedWindow = chrome.devtools.inspectedWindow;
var debugIndicator = DEBUG ? createIndicator() : null;
var contentConnected = false;
var devtoolConnected = false;
var devtoolFeatures = [];
var listeners = {};
var callbacks = {};
var subscribers = createSubscribers();
var dropSandboxTimer;
var sandbox;
var page = chrome.extension.connect({
  name: 'basisjsDevtool:plugin'
});

function $(id) {
  return document.getElementById(id);
}

function updateConnectionStateIndicator(id, state) {
  $(id).innerHTML = state ? 'OK' : 'pending...';
  $(id).className = 'state ' + (state ? 'ok' : 'pending');
}

function updateIndicator() {
  updateConnectionStateIndicator('connection-to-page', contentConnected);
  updateConnectionStateIndicator('connection-to-basisjs', devtoolConnected);
  $('state-banner').style.display = contentConnected && devtoolConnected ? 'none' : 'block';

  if (DEBUG) {
    debugIndicator.style.background = [
      'gray',   // once disconnected
      'orange', // contentConnected but no a page
      'green'   // all connected
    ][contentConnected + devtoolConnected];
  }
}

function sandboxError(message) {
  sandbox.srcdoc = '<div style="padding:20px;color:#D00;">' + message + '</div>';
}

function initSandbox() {
  clearTimeout(dropSandboxTimer);
  dropSandbox();
  sandbox = document.createElement('iframe');
  sandbox.srcdoc = '<div id="sandbox-splashscreen" style="padding:20px;color:#888;">Fetching UI...</div>';
  document.documentElement.appendChild(sandbox);
}

function notify(type, args) {
  for (var i = 0; i < subscribers[type].length; i++) {
    subscribers[type][i].apply(null, args);
  }
}

function createSubscribers() {
  return {
    data: [],
    connection: [],
    features: []
  };
}

function initUI(code) {
  var apiId = genUID();
  
  subscribers = createSubscribers();

  window[apiId] = function createAPI() {
    return {
      send: transport.send,
      subscribe: function(channel, fn) {
        if (typeof channel === 'function') {
          fn = channel;
          channel = 'data';
        }

        if (!subscribers.hasOwnProperty(channel)) {
          return console.warn('[remote inspector] Unknown channel name: ' + channel);
        }

        subscribers[channel].push(fn);

        switch (channel) {
          case 'connection':
            fn(devtoolConnected);
            break;
          case 'features':
            fn(devtoolFeatures);
            break;
        }

        return this;
      }
    }
  };

  sandbox.contentWindow.location.hash = apiId;
  sandbox.contentWindow.eval(code + ';document.getElementById("sandbox-splashscreen").style.display="none"');
}

function dropSandbox() {
  if (sandbox) {
    subscribers = createSubscribers();
    sandbox.parentNode.removeChild(sandbox);
    sandbox.setAttribute('srcdoc', '');
    sandbox.setAttribute('src', '');
    sandbox = null;
  }
}

page.onMessage.addListener(function(packet) {
  if (DEBUG) {
    console.log('[basisjs.plugin] Recieve:', packet);
  }

  var args = packet.data;
  var callback = packet.callback;

  if (packet.event === 'callback') {
    if (callbacks.hasOwnProperty(callback)) {
      callbacks[callback].apply(null, args);
      delete callbacks[callback];
    }
    return;
  }

  if (callback)
    args = args.concat(function() {
      if (DEBUG) {
        console.log('[plugin] send callback', callback, args);
      }

      page.postMessage({
        event: 'callback',
        callback: callback,
        data: slice(arguments)
      });
    });

  var list = listeners[packet.event];
  if (list)
    for (var i = 0, item; item = list[i]; i++)
      item.fn.apply(item.context, args);
});

var transport = {
  on: function(eventName, fn, context) {
    if (!listeners[eventName])
      listeners[eventName] = [];

    listeners[eventName].push({
      fn: fn,
      context: context
    });

    return this;
  },

  send: function() {
    var args = slice(arguments);
    var callback = false;

    if (args.length && typeof args[args.length - 1] === 'function') {
      callback = genUID();
      callbacks[callback] = args.pop();
    }

    if (DEBUG) {
      console.log('[basisjs.plugin] send data', callback, args);
    }

    page.postMessage({
      event: 'data',
      data: args,
      callback: callback
    });
  }
};

transport
  .on('connect', function() {
    contentConnected = true;
    updateIndicator();
  })
  .on('devtool:connect', function(features) {
    devtoolConnected = true;
    notify('connection', [devtoolConnected]);
    devtoolFeatures = features;
    notify('features', [devtoolFeatures]);
    updateIndicator();

    // send interface UI request
    // TODO: run once
    initSandbox();
    var callback = genUID();
    callbacks[callback] = function(err, type, content) {
      if (err) {
        return sandboxError('Fetch UI error: ' + err);
      }

      if (type !== 'script') {
        return sandboxError('Unsupported UI content: ' + type);
      }

      initUI(content);
    };
    page.postMessage({
      event: 'getInspectorUI',
      callback: callback
    });
  })
  .on('disconnect', function() {
    contentConnected = false;
    devtoolConnected = false;
    notify('connection', [devtoolConnected]);
    devtoolFeatures = [];
    notify('features', [devtoolFeatures]);
    updateIndicator();
    dropSandboxTimer = setTimeout(dropSandbox, 2000);
  })
  .on('features', function(features) {
    devtoolFeatures = features;
    notify('features', [devtoolFeatures]);
  })
  .on('data', function() {
    if (DEBUG) {
      console.log('[basisjs.plugin] recieve data', arguments);
    }

    notify('data', arguments);
  });

page.postMessage({
  event: 'plugin:init',
  tabId: inspectedWindow.tabId
});
