(function(){
  var transportInited = false;
  
  var port = chrome.extension.connect({name: "contentScriptPort"});
  port.onMessage.addListener(function(msg) {
    if (msg.action == 'appcpReady')
      initTransport();
  });

  document.body.addEventListener('devpanelInit', initTransport);

  function initTransport(){
    if (transportInited)
    {
      sendMessage('ready');
      return;
    }  

    var sharedDOM = document.getElementById('devpanelSharedDom');
    if (sharedDOM)
    {
      sharedDOM.addEventListener('devpanelData', function(){
        var action = sharedDOM.getAttribute('action');
        var data = sharedDOM.innerText;

        console.log('transfer data action:', action);
        //console.log('transfer data:', data);

        sendMessage(action, data);
      });
      
      sendMessage('ready');
      transportInited = true;
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
