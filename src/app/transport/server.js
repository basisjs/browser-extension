var Transport = require('./base.js');

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
          Client.all.sync(basis.array(data.clients).map(Client.reader));
        })
        .on('clientList', function(data){
          Client.all.sync(basis.array(data).map(Client.reader));
        })
        .on('devpanelPacket', function(data){
          console.log('devpanelPacket', arguments);
        });
    };

    basis.doc.head.add(script);
  },

  invoke: function(action, clientId, args, subject){
    var callback;

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
    }

    if (this.socket)
      this.socket.emit(action, clientId, args, callback);
    else
      basis.dev.warn('[basisjs-acp] No transport (socket), but action `' + action + '` called');
  }
});
