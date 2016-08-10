var DEBUG = false;
var pluginConnected = false;
var devtoolConnected = false;
var features = [];
var debugIndicator = DEBUG ? createIndicator() : null;
var outputChannelId;
var inputChannelId = 'basisjsDevtool:' + genUID();

function updateIndicator(){
  if (debugIndicator) {
    debugIndicator.style.background = [
      'blue',   // once disconnected
      'orange', // pluginConnected but no a page
      'green'   // all connected
    ][pluginConnected + devtoolConnected];
  }
}

function sendToPlugin(event, data) {
  plugin.postMessage({
    event: event,
    data: data
  });
}

function emitPageEvent(channelId, data) {
  if (DEBUG) {
    console.log('[devtool plugin] send to page', channelId, data);
  }

  document.dispatchEvent(new CustomEvent(channelId, {
    detail: data
  }));
}

function sendToPage(data){
  emitPageEvent(outputChannelId, data);
}

function handshake() {
  emitPageEvent('basisjs-devpanel:connect', {
    input: inputChannelId,
    output: outputChannelId
  });
}

//
// set up transport
//

var plugin = chrome.runtime.connect({
  name: 'basisjsDevtool:page'
});

plugin.onMessage.addListener(function(packet) {
  if (DEBUG) {
    console.log('[devtool plugin] from plugin', packet.event, packet);
  }

  switch (packet.event) {
    case 'connect':
      if (!pluginConnected && devtoolConnected) {
        sendToPlugin('devtool:connect', [features]);
        sendToPage({
          event: 'connect'
        });
      }

      pluginConnected = true;
      updateIndicator();

      break;

    case 'disconnect':
      if (pluginConnected && devtoolConnected) {
        sendToPage({
          event: 'disconnect'
        });
      }

      pluginConnected = false;
      updateIndicator();
      break;

    case 'getInspectorUI':
    case 'callback':
    case 'data':
      sendToPage(packet);
      break;
  }
});


//
// connect to basis.js devpanel
//

document.addEventListener('basisjs-devpanel:init', function(e) {
  if (outputChannelId)
    return;

  var packet = e.detail;
  outputChannelId = packet.input;
  devtoolConnected = true;
  updateIndicator();

  if (!packet.output) {
    handshake();
  }

  if (pluginConnected) {
    sendToPlugin('devtool:connect', [packet.features || features]);
    sendToPage({
      event: 'connect'
    });
  }
});

document.addEventListener(inputChannelId, function(e) {
  var packet = e.detail;

  if (DEBUG) {
    console.log('[devtool plugin] page -> plugin', packet);
  }

  if (packet.event === 'features') {
    features = packet.data[0];
  }

  plugin.postMessage(packet);
});

handshake();
