var inspectedWindow = chrome.devtools.inspectedWindow;
var commandSeed = 1;
var commands = {};
var clientId = 'id:' + parseInt(Math.random()*1e10);
var client;

var initClientListeners = function runOnce(){
  var inited = false;
  return function(transport){
    if (inited)
      return;

    inited = true;
    transport
      .on('clientInfo', function(data){
        //
      })
      .on('contentScriptDestroy', function(){
        //
      });
  }
};

var transport = {
  port: chrome.extension.connect({
    name: 'basisjsExtensionPort'
  }),

  isReady: false,
  handlers: {},

  ready: function(handler, context){
    if (this.isReady)
      handler.call(context);

    this.on('ready', handler, context);
  },

  message: function(message){
    console.log('data to ext:', message);

    if (message.action == 'ready')
      this.isReady = true;

    var handlers = this.handlers[message.action];
    if (handlers)
      for (var i = 0, handler; handler = handlers[i]; i++)
        handler.handler.call(handler.context, message.data, message);
  },
  on: function(messageNameOrHandlers, handlerOrContext, handlerContext){
    var handlers;
    var handlerContext;

    if (typeof messageNameOrHandlers == 'string')
    {
      handlers = {};
      handlers[messageNameOrHandlers] = handlerOrContext;
    }
    else
    {
      handlers = messageNameOrHandlers;
      handlerContext = handlerOrContext;
    }

    for (var message in handlers)
    {
      var handler = handlers[message];

      if (!this.handlers[message])
        this.handlers[message] = [];

      this.handlers[message].push({
        handler: handler,
        context: handlerContext
      });
    }

    return this;
  },

  send: function(action, clientId, channelId, args){
    var id = commandSeed++;
    var callback;

    if (Array.isArray(args))
      args = args.map(JSON.stringify);
    else
      args = null;

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
};

transport.on('contentScriptInit', function(data){
  // init listeners that depends on client
  initClientListeners(transport);
}, transport);

transport.on('devpanelPacket', function(data){
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
}, transport);

transport.port.onMessage.addListener(transport.message.bind(transport));
transport.port.postMessage({
  action: 'extensionInit',
  tabId: inspectedWindow.tabId
});
