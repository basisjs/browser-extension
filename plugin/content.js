var extensionReady = false;
var sendClientInfoTimer;
var devpanels = {};
var notifyChannelId =
      'basisjs-acp:connect-' +
      parseInt(10e12 * Math.random()).toString(36) +
      parseInt(performance.now()).toString(36);
var title_;
var location_;


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

//
// client info
//
function getTitle(){
  return title_ = document.title;
}
function getLocation(){
  return location_ = String(location);
}
function getClientInfo(){
  return {
    title: getTitle(),
    location: getLocation()
  };
}
function sendClientInfo(force){
  var hasChanges =
        force ||
        title_ != getTitle() ||
        location_ != getLocation();

  if (hasChanges)
    sendToPlugin('clientInfo', null, getClientInfo());
}


//
// devpanel stuff
//
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
  console.log('to content', packet.action, packet);

  switch (packet.action)
  {
    case 'extensionInit':
      if (!extensionReady)
      {
        extensionReady = true;

        // send client info and shedule changes notification
        sendClientInfo(true);
        sendClientInfoTimer = setInterval(sendClientInfo, 150);

        for (var channelId in devpanels)
          sendToPlugin('regDevpanel', channelId);
      }
      break;

    case 'extensionDestroy':
      extensionReady = false;
      clearInterval(sendClientInfoTimer);
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
// set up transport (basis.js 1.4+)
//
document.addEventListener(notifyChannelId, regDevpanel);
document.addEventListener('basisjs-devpanel:init', function(){
  sendToPage('basisjs-devpanel:connect', notifyChannelId);
});
sendToPage('basisjs-devpanel:connect', notifyChannelId);


//
// notify background page about content is ready
//
sendToPlugin('contentScriptInit');
