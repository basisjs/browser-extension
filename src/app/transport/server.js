var Transport = require('./base.js');

var commandSeed = 1;
var commands = {};

module.exports = new Transport({
  init: function(){
    var self = this;
    var script = document.createElement('script');

    script.src = '/acp';
    script.onerror = function(){
      basis.dev.warn('[basisjs-acp] Error on loading socket.io');
    };
    script.onload = function(){
      var Client = require('app.type').Client;
      var profile = require('app.type').Profile();

      self.socket = global.basisjsAcpSocket
        .on('connect', function(){
          profile.set_online(true);
          this.emit('handshake');
        })
        .on('disconnect', function(){
          profile.set_online(false);
        })
        .on('handshake', function(data){
          console.log('handshake', data);
          Client.all.setAndDestroyRemoved(basis.array(data.clients).map(Client.reader));
        })
        .on('clientList', function(data){
          Client.all.setAndDestroyRemoved(basis.array(data).map(Client.reader));
        })
        .on('devpanelPacket', function(data){
          var id = data.id;
          var status = data.status;

          console.log('devpanelPacket in acp', data);

          if (commands.hasOwnProperty(id))
          {
            var callback = commands[id];
            delete commands[id];

            if (typeof callback == 'function')
            {
              if (status == 'error')
                callback(data.data);
              else
                callback(null, data.data);
            }
          }
        });
    };

    basis.doc.head.add(script);
  },

  initChannel: function(clientId){
    if (this.socket)
      this.socket.emit('init-devpanel', clientId);
    else
      basis.dev.warn('[basisjs-acp] No transport (socket), but `initChannel` called');
  },
  invoke: function(action, clientId, channelId, args, subject){
    var id = commandSeed++;
    var callback;

    console.log('invoke', arguments);

    if (Array.isArray(args))
      args = args.map(JSON.stringify);
    else
      args = null;

    if (subject)
    {
      if (subject instanceof basis.data.AbstractData)
      {
        subject.setState(basis.data.STATE.PROCESSING);
        callback = function(err, data){
          if (!err)
          {
            subject.setState(basis.data.STATE.READY);
            subject.update(data);
          }
          else
            subject.setState(basis.data.STATE.ERROR, err);
        };
      }

      if (typeof subject == 'function')
        callback = subject;

      if (typeof callback == 'function')
      {
        commands[id] = callback;
        setTimeout(function(){
          if (commands.hasOwnProperty(id))
          {
            delete commands[id];
            callback('Timeout');
          }
        }, 10000);
      }
    }

    if (this.socket)
      this.socket.emit('command', clientId, channelId, id, action, args);
    else
      basis.dev.warn('[basisjs-acp] No transport (socket), but action `' + action + '` called');
  }
});
