;(function(global){
  var sessionStorage = global.sessionStorage || {};
  var online = false;
  var title_ = getTitle();
  var location_ = getLocation();
  var devpanel_ = getDevpanel();
  var socket;

  if (typeof io != 'undefined')
  {
    socket = io.connect('{SELF_HOST}', { transports: ['websocket', 'polling'] });
    console.log('[basisjs-acp] Successful inited');
  }
  else
  {
    console.warn('[basisjs-acp] Init fault: socket.io is not defined');
    return;
  }

  function getTitle(){
    return title_ = document.title;
  }
  function getLocation(){
    return location_ = String(location);
  }
  function getDevpanel(){
    return devpanel_ = typeof basis != 'undefined' && !!basis.devpanel;
  }
  function getSelfInfo(){
    return {
      clientId: sessionStorage['basisjs-acp-clientId'],
      title: getTitle(),
      location: getLocation(),
      devpanel: getDevpanel()
    };
  }

  setInterval(function(){
    if (online && (
          title_ != getTitle() ||
          location_ != getLocation() ||
          devpanel_ != getDevpanel()
       ))
      socket.emit('info', getSelfInfo());
  }, 150);

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

  socket.on('init-devpanel', function(args, callback){
    if (typeof basis == 'undefined')
      return callback('basis.js is not found');
    if (!basis || typeof basis.require !== 'function')
      return callback('looks like isn\'t a basis.js');

    try {
      basis.require('basis.devpanel');
      callback();
    } catch(e) {
      callback(e);
    }
  });

})(this);
