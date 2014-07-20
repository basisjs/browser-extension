;(function(global){
  var socket;

  if (typeof io != 'undefined')
  {
    global.basisjsAcpSocket = io.connect('{SELF_HOST}', { transports: ['websocket', 'polling'] });
    console.log('basisjs-acp: connected');
  }
  else
  {
    console.warn('basisjs-acp: socket.io is not defined');
    return;
  }

})(this);
