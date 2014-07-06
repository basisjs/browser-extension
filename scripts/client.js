;(function(global){
  var sessionStorage = global.sessionStorage || {};
  var online = false;
  var title_ = getTitle();
  var location_ = getLocation();
  var socket;

  if (typeof io != 'undefined')
  {
    socket = io.connect('{SELF_HOST}', { transports: ['websocket', 'polling'] });
    console.log('basisjs-acp: connected');
  }
  else
  {
    console.warn('basisjs-acp: socket.io is not defined');
    return;
  }

  function getTitle(){
    return title_ = document.title;
  }
  function getLocation(){
    return location_ = String(location);
  }
  function getSelfInfo(){
    return {
      clientId: sessionStorage['basisjs-acp-clientId'],
      title: getTitle(),
      location: getLocation()
    };
  }

  setInterval(function(){
    if (online && (title_ != getTitle() || location_ != getLocation()))
      socket.emit('info', getSelfInfo());
  }, 200);

  // connection events
  socket.on('connect', function(){
    online = true;
    socket.emit('handshake', getSelfInfo());
  });
  socket.on('disconnect', function(){
    online = false;
  });
  socket.on('handshake', function(data){
    if ('clientId' in data)
      sessionStorage['basisjs-acp-clientId'] = data.clientId;
  });

  socket.on('clientList', function(data){
    data.forEach(function(i){ console.log(i); });
  });
})(this);
