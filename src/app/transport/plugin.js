var Transport = require('./base.js');
var Client = require('app.type.client');
var inspectedWindow = chrome.devtools.inspectedWindow;

var commandSeed = 1;
var commands = {};
var clientId = basis.genUID();
var client;

var initClientListeners = basis.fn.runOnce(function(transport){
  transport
    .on('clientInfo', function(data){
      client.update(data);
    })
    .on('contentScriptDestroy', function(){
      client.update({
        online: false,
        channels: null
      });
    })
    .on('regDevpanel', function(data, message){
      // TODO: rework to support multiple
      client.set('channels', [message.channelId]);
    });
});

module.exports = new Transport({
  port: chrome.extension.connect({
    name: 'basisjsExtensionPort'
  }),

  init: function(){
    this.on('contentScriptInit', function(data){
      // init listeners that depends on client
      initClientListeners(this);

      // create client on first `contentScriptInit`
      client = Client({
        id: clientId,
        online: true
      });
    }, this);

    this.on('devpanelPacket', function(data){
      var id = data.id;
      var status = data.status;

      console.log('devpanelPacket in ext', data);

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
    }, this);

    this.port.onMessage.addListener(this.message.bind(this));
    this.port.postMessage({
      action: 'extensionInit',
      tabId: inspectedWindow.tabId
    });
  },

  invoke: function(action, clientId, channelId, args, subject){
    var id = commandSeed++;
    var callback;

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

    this.port.postMessage({
      action: 'command',
      data: {
        clientId: clientId,
        id: id,
        command: action,
        args: args
      }
    });
  }
});
