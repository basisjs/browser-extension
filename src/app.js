
  basis.require('basis.dom.event');
  basis.require('app.transport');

  var domEvent = basis.dom.event;

  function initMainMenu(){
    var mainMenu = resource('module/mainmenu/index.js').fetch();

    app.transport.onMessage('startInspect', function(mode){
      mainMenu.item(mode).select();
    });

    app.transport.onMessage('version', function(version){
      mainMenu.setChildNodes([
        resource('module/l10n/index.js').fetch(),
        resource('module/templater/index.js').fetch(),
        resource('module/warnings/index.js').fetch(),
        resource('module/fileGraph/index.js').fetch()
      ], true);

      mainMenu.selectPage();
    });
  }


  //
  // init
  //
  basis.ready(function(){
    // create transport
    app.transport.init();

    // init interfaces
    app.transport.ready(basis.fn.runOnce(initMainMenu));

    app.transport.ready(function(){
      app.transport.invoke('getVersion', function(){
        app.transport.message({
          action: 'version', 
          data: '{}'
        });
      });
    });

    // add global key bindings
    domEvent.addGlobalHandler('keydown', function(event){
      var key = domEvent.key(event);
      var sender = domEvent.sender(event);
      if (key == domEvent.KEY.BACKSPACE && sender.tagName != 'INPUT' && sender.tagName != 'TEXTAREA')
        domEvent.cancelDefault(event);
    });

    // notSupported panel
    resource('module/notSupported/index.js').fetch();
  });

