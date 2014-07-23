var Node = require('basis.ui').Node;
var transport = require('app.transport');

function initMainMenu(){
  
}


//
// init
//
// basis.ready(function(){
// });

module.exports = require('basis.app').create({
  init: function(){
    var mainMenu = require('./module/mainmenu/index.js');

    // create transport
    //transport.init();

    // init interfaces
    transport.ready(basis.fn.runOnce(initMainMenu));
    transport.ready(function(){
      transport.invoke('getVersion', null, null, function(){
        transport.message({
          action: 'version',
          data: '{}'
        });
      });
    });

    // add global key bindings
    // TODO: investigate why here???
    var domEvent = require('basis.dom.event');
    domEvent.addGlobalHandler('keydown', function(event){
      var key = domEvent.key(event);
      var sender = domEvent.sender(event);
      if (key == domEvent.KEY.BACKSPACE && sender.tagName != 'INPUT' && sender.tagName != 'TEXTAREA')
        domEvent.cancelDefault(event);
    });

    // notSupported panel
    require('./module/notSupported/index.js');

    transport.onMessage('startInspect', function(mode){
      mainMenu.item(mode).select();
    });

    transport.on('version', function(version){
      // mainMenu.setChildNodes([
      //   version.l10n > 1
      //     ? require('./module/l10n_v2/index.js')
      //     : require('./module/l10n/index.js'),
      //   require('./module/templater/index.js'),
      //   require('./module/warnings/index.js'),
      //   require('./module/fileGraph/index.js')
      // ], true);

      // mainMenu.selectPage();
    });

    return mainMenu;
  }
});
