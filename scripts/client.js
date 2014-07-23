;(function(global){
  var document = global.document;
  var sessionStorage = global.sessionStorage || {};
  var clientId = sessionStorage['basisjs-acp-clientId'];
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var online = false;
  var title_ = getTitle();
  var location_ = getLocation();
  var devpanel_ = getDevpanel();
  var devpanels = {};
  var sendInfoTimer;
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
    var result = [];
    for (var key in devpanels)
      result.push(key);

    if (String(result) == devpanel_)
      return devpanel_;

    devpanel_ = result.length ? result : false;
    return devpanel_;
  }
  function getSelfInfo(){
    return {
      clientId: clientId,
      title: getTitle(),
      location: getLocation(),
      devpanel: getDevpanel()
    };
  }
  function sendInfo(){
    if (online && (
          title_ != getTitle() ||
          location_ != getLocation() ||
          devpanel_ != getDevpanel()
       ))
      socket.emit('info', getSelfInfo());
  }

  // connection events
  socket.on('connect', function(){
    online = true;
    socket.emit('handshake', getSelfInfo());
    clearInterval(sendInfoTimer);
    sendInfoTimer = setInterval(sendInfo, 150);
  });
  socket.on('disconnect', function(){
    clearInterval(sendInfoTimer);
    online = false;
  });
  socket.on('handshake', function(data){
    if ('clientId' in data)
      clientId = sessionStorage['basisjs-acp-clientId'] = data.clientId;
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

  //
  // communication with basis/devpanel
  //

  var emitEvent;
  var notifyChannel = 'basisjs-acp:connect-' +
                      parseInt(10e12 * Math.random()).toString(36) +
                      parseInt(performance.now()).toString(36);

  function regDevpanel(e){
    var channels = e.detail;
    var channelId = channels.input;

    if (hasOwnProperty.call(devpanels, channelId) == false)
    {
      devpanels[channelId] = channels;
      document.addEventListener(channelId, function(e){
        socket.emit('devpanelPacket', channelId, e.detail);
      });
      sendInfo();
    }
  }

  if (document.createEvent)
  {
    var EventClass = global.CustomEvent;
    if (EventClass || document.createEvent('CustomEvent').initCustomEvent);
    {
      // polyfil CustomEvent
      if (!EventClass)
      {
        EventClass = function(name, params){
          var event = document.createEvent('CustomEvent');

          params = basis.object.extend({
            bubbles: false,
            cancelable: false,
            detail: undefined
          }, params);

          event.initCustomEvent(name, params.bubbles, params.cancelable, params.detail);

          return event;
        };

        EventClass.prototype = global.Event.prototype;
      }

      emitEvent = function(name, data){
        console.log('[acp] ' + name, data);
        document.dispatchEvent(new EventClass(name, {
          detail: data
        }));
      };
    }
  }

  if (emitEvent)
  {
    document.addEventListener(notifyChannel, regDevpanel);
    document.addEventListener('basisjs-devpanel:init', function(){
      emitEvent('basisjs-devpanel:connect', notifyChannel);
    });
    emitEvent('basisjs-devpanel:connect', notifyChannel);
  }
  else
  {
    console.log('[acp] Communication with basis/devpanel is not supported by your browser');
  }

})(this);
