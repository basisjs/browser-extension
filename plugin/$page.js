var connected = false;
var sendClientInfoTimer;
var title_;
var location_;
var outputChannelId;
var inputChannelId = 'basisjsDevtool:connect-' +
                      parseInt(10e12 * Math.random()).toString(36) +
                      Date.now().toString(36);


//
// helpers
//
function sendToPlugin(event, data){
  plugin.postMessage({
    event: event,
    data: data
  });
}

function sendToPage(channelId){
  console.log('$page', arguments);
  document.dispatchEvent(new CustomEvent(channelId, {
    detail: Array.prototype.slice.call(arguments, 1)
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
    sendToPlugin('clientInfo', getClientInfo());
}

//
// set up transport
//
var plugin = chrome.extension.connect({
  name: 'basisjsDevtool:page'
});

plugin.onMessage.addListener(function(packet){
  console.log('plugin -> page', packet.event, packet);

  switch (packet.event)
  {
    case 'connect':
      indy.style.background = 'green';
      if (!connected)
      {
        connected = true;

        // send client info and shedule changes notification
        sendClientInfo(true);
        sendClientInfoTimer = setInterval(sendClientInfo, 150);
      }
      break;

    case 'disconnect':
      indy.style.background = 'blue';
      connected = false;
      clearInterval(sendClientInfoTimer);
      break;

    case 'data':
    case 'callback':
      plugin.postMessage(packet);
      break;
  }
});


//
// connect to basis.js
//

document.addEventListener('basisjs-devpanel:init', function(e){
  if (outputChannelId)
    return;
  console.log('[plugin $page] connected');
  outputChannelId = e.detail;
  sendToPage('basisjs-devpanel:connect', inputChannelId);
});

document.addEventListener(inputChannelId, function(e){
  // var packet = JSON.parse(e.detail);
  console.info('[plugin $page] recieve', e.detail);
  plugin.postMessage(e.detail);
});

sendToPage('basisjs-devpanel:connect', inputChannelId);

//
// notify background page about content is ready
//

var indy = document.createElement('div');
indy.style = 'position:fixed;top:10px;left:10px;background:red;width:20px;height:20px;'
document.body.appendChild(indy);
