module.exports = basis.Class(null, {
  className: 'Transport',
  extendConstructor_: true,

  isReady: false,
  handlers: {},

  ready: function(handler, context){
    if (this.isReady)
      handler.call(context);

    this.onMessage('ready', handler, context);
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
  onMessage: function(){
    this.on.apply(this, arguments);
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

  invoke: function(){
    // should be override in subclasses
  }
});
