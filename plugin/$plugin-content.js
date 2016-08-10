var DEBUG = false;
var inspectedWindow = chrome.devtools.inspectedWindow;
var debugIndicator = DEBUG ? createIndicator() : null;
var contentConnected = false;
var pageConnected = false;
var listeners = {};
var callbacks = {};
var subscribers = [];
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
  updateConnectionStateIndicator('connection-to-basisjs', pageConnected);
  $('state-banner').style.display = contentConnected && pageConnected ? 'none' : 'block';

  if (DEBUG) {
    debugIndicator.style.background = [
      'gray',   // once disconnected
      'orange', // contentConnected but no a page
      'green'   // all connected
    ][contentConnected + pageConnected];
  }
}

function initSandbox() {
  clearTimeout(dropSandboxTimer);
  dropSandbox();
  sandbox = document.createElement('iframe');
  sandbox.srcdoc = '<div id="sandbox-splashscreen" style="padding:20px;color:#888;">Fetching UI...</div>';
  document.documentElement.appendChild(sandbox);
}

function sandboxError(message) {
  sandbox.srcdoc = '<div style="padding:20px;color:#D00;">' + message + '</div>';
}

function initUI(code) {
  var apiId = genUID();
  
  subscribers = [];
  window[apiId] = function createAPI() {
    return {
      send: transport.send,
      subscribe: function(fn){
        subscribers.push(fn);
      }
    }
  };

  sandbox.contentWindow.location.hash = apiId;
  sandbox.contentWindow.eval(code + ';document.getElementById("sandbox-splashscreen").style.display="none"');
}

function dropSandbox() {
  if (sandbox) {
    sandbox.parentNode.removeChild(sandbox);
    sandbox.setAttribute('srcdoc', '');
    sandbox.setAttribute('src', '');
    sandbox = null;
  }
}

page.onMessage.addListener(function(packet) {
  if (DEBUG) console.log('[basisjs.plugin] Recieve:', packet);

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
      // console.log('[plugin] send callback', callback, args);
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
  .on('page:connect', function() {
    pageConnected = true;
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
    pageConnected = false;
    updateIndicator();
    dropSandboxTimer = setTimeout(dropSandbox, 2000);
  })
  .on('data', function() {
    if (DEBUG) {
      console.log('[basisjs.plugin] recieve data', arguments);
    }

    var args = slice(arguments);
    subscribers.forEach(function(fn){
      fn.apply(null, args);
    })
  });

page.postMessage({
  event: 'plugin:init',
  tabId: inspectedWindow.tabId
});
