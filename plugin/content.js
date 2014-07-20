(function(){
  var extensionReady = false;
  var devpanelExists = false;

  function sendMessage(action, data){
    port.postMessage({
      action: action,
      data: data
    });
  }

  function notifyReady(){
    if (extensionReady && devpanelExists)
      sendMessage('ready');
  }

  function setDevpanelExists(e){
    if (!devpanelExists)
    {
      devpanelExists = true;
      notifyReady();
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
        extensionReady = true;
        notifyReady();
        break;

      case 'command':
        document.dispatchEvent(new CustomEvent('devpanel:command', {
          detail: packet.data
        }));
        break;
    }
  });

  //
  // set up transport
  //
  document.addEventListener('devpanel:data', function(event){
    var payload = event.detail || {};

    console.log('devpanel -> plugin:', payload);

    if (payload.action)
      sendMessage(payload.action, payload.data);
  });

  document.addEventListener('devpanel:init', setDevpanelExists);
  document.addEventListener('devpanel:pong', setDevpanelExists);
  document.dispatchEvent(new CustomEvent('devpanel:ping'));

  //
  // transport for basis.js prior 1.4
  //
  document.addEventListener('devpanelData', function(event){
    var action = event.target.getAttribute('action');
    var data = event.target.firstChild;

    if (action)
      sendMessage(action, data && JSON.parse(data.nodeValue || 'null'));
  });
  document.addEventListener('devpanelInit', setDevpanelExists);

  // notify about ready
  sendMessage('contentScriptInit');
})();
