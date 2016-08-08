var extensionReady = false;
var sendClientInfoTimer;
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
  backgroundPort.postMessage({
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
// set up transport
//
var backgroundPort = chrome.extension.connect({
  name: 'basisjsContentScriptPort'
});

backgroundPort.onMessage.addListener(function(packet){
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
// connect to basis.js
//
document.addEventListener('basisjs-devpanel:init', function(){
  sendToPage('basisjs-devpanel:connect', notifyChannelId);
});
sendToPage('basisjs-devpanel:connect', notifyChannelId);


//
// notify background page about content is ready
//
sendToPlugin('contentScriptInit');
