
  var Transport = resource('transport.js').fetch();

  module.exports = new Transport({
    isReady: true/*,

    call: function(funcName){
      switch(funcName){
        case 'getCultureList':
        break;
      }
    }*/
  });
