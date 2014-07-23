var extensionReady = false;
var devpanelExists = false;
var devpanels = {};
var notifyChannel = 'acp:connect-' +
                    parseInt(10e12 * Math.random()).toString(36) +
                    parseInt(performance.now()).toString(36);


//
// helpers
//
function sendToPlugin(action, id, data){
  port.postMessage({
    action: action,
    channelId: id,
    data: data
  });
}

function sendToPage(channelId, data){
  document.dispatchEvent(new CustomEvent(channelId, {
    detail: data
  }));
}

function regDevpanel(e){
  var channels = e.detail;
  var channelId = channels.output;

  if (!devpanels.hasOwnProperty(channelId))
  {
    console.log('regDevpanel', channelId);

    devpanels[channelId] = channels;

    document.addEventListener(channels.input, function(event){
      var payload = event.detail || {};

      console.log('devpanel:channel(' + channelId + ') -> plugin:', payload);

      sendToPlugin('devpanelPacket', channelId, payload);
    });

    if (extensionReady)
      sendToPlugin('regDevpanel', channelId);
  }
}


//
// set up port
//
var port = chrome.extension.connect({
  name: 'basisjsContentScriptPort'
});

port.onMessage.addListener(function(packet){
  console.log('to content', packet);

  switch (packet.action)
  {
    case 'extensionInit':
      if (!extensionReady)
      {
        extensionReady = true;
        for (var channelId in devpanels)
          sendToPlugin('regDevpanel', channelId);
      }
      break;

    case 'command':
      if (packet.clientId)
        sendToPage(packet.clientId, {
          type: 'command',
          id: packet.id,
          command: packet.command,
          args: packet.args
        });
      break;
  }
});


//
// set up transport
//
document.addEventListener(notifyChannel, regDevpanel);
document.addEventListener('devpanel:init', function(){
  sendToPage('devpanel:connect', notifyChannel);
});
sendToPage('devpanel:connect', notifyChannel);


//
// transport for basis.js prior 1.4
//
// document.addEventListener('devpanelData', function(event){
//   var action = event.target.getAttribute('action');
//   var data = event.target.firstChild;

//   if (action)
//     sendToPlugin(action, data && JSON.parse(data.nodeValue || 'null'));
// });
// document.addEventListener('devpanelInit', regDevpanel);


// notify about ready
sendToPlugin('contentScriptInit');
