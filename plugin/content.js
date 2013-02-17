(function(){
  var port = chrome.extension.connect({name: "contentScriptPort"});
  port.onMessage.addListener(function(msg) {
    if (msg.action == 'appcpReady')
      initTransport();
  });

  var transportInited = false;

  function initTransport(){
    if (transportInited)
    {
      sendMessage('ready');
      return;
    }  

    var transferDiv = document.getElementById('transferDiv');
    if (transferDiv)
    {
      transferDiv.addEventListener('transferData', function(){
        var action = transferDiv.getAttribute('action');
        var data = transferDiv.innerText;

        console.log('transfer data action:', action);
        //console.log('transfer data:', data);

        sendMessage(action, data);
      });
      
      sendMessage('ready');
      transportInited = true;
    }
    else
    {
      console.warn('basis devpanel not found');
    }
  }

  function sendMessage(action, data){
    port.postMessage({
      action: action,
      data: data
    });
  }

  sendMessage('contentScriptInited');

  console.log('content script inited');
})();
