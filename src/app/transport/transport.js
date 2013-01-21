
  var Transport = basis.Class(null, {
    extendConstructor_: true,
    isReady: false,

    init: function(){
      this.handlers = {};
    },

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
          handler.handler.call(handler.context, message.data && message.data.toObject());
    },
    onMessage: function(message, handler, handlerContext){
      if (!this.handlers[message])
        this.handlers[message] = [];

      this.handlers[message].push({
        handler: handler,
        context: handlerContext
      });
    },
    
    call: function(){
    }
  });

  module.exports = Transport;
