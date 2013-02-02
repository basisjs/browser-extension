(function(){
  var port = chrome.extension.connect({name: "contentScriptPort"});
  port.onMessage.addListener(function(msg) {
    if (msg.action == 'pageScriptInited')
      initTransport();
  });
  port.postMessage({ action: 'contentScriptInited' });

  function initTransport(){
    var transferDiv = document.getElementById('transferDiv');
    if (transferDiv)
    {
      transferDiv.addEventListener('transferData', function(){
        var action = transferDiv.getAttribute('action');
        var data = transferDiv.innerText;

        console.log('transfer data action:', action);
        //console.log('transfer data:', data);

        sendMessage({ action: action, data: data });
      });
      sendMessage({ action: 'ready' });
    }
  }

  function sendMessage(message){
    port.postMessage(message);
  }

  console.log('content script inited');
})();
