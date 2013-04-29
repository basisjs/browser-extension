
  // default
  var config = resource('transport/static.js');

  // choose suitable config
  if (global.chrome && global.chrome.extension)
    config = resource('transport/plugin.js');
  else if (global.appcp_server)
    config = resource('transport/server.js');

 /**
  * transport
  */
  (module.exports = basis.object.complete(config(), {
    isReady: false,
    handlers: {},

    ready: function(handler, context){
      if (this.isReady)
        handler.call(context);

      this.onMessage('ready', handler, context);
    },

    message: function(message){
      if (message.action == 'ready')
        this.isReady = true;

      var handlers = this.handlers[message.action];
      if (handlers)
        for (var i = 0, handler; handler = handlers[i]; i++)
          handler.handler.call(handler.context, message.data && JSON.parse(message.data));
    },
    onMessage: function(messageNameOrHandlers, handlerOrContext, handlerContext){
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
    },
    
    invoke: function(){
    }
  }));
