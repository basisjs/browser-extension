
  var Transport = resource('transport.js')();

  var StaticTransport = Transport.subclass({
    isReady: true,
    call: function(funcName){
      switch(funcName){
        case 'getCultureList': 

        break;
      }
    }
  });

  module.exports = ServerSocketTransport;