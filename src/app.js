
  basis.require('basis.dom.event');
  basis.require('basis.ui'); // ??

  var domEvent = basis.dom.event;

  function initMainMenu(){
    var mainMenu = resource('module/mainmenu/index.js').fetch();

    app.transport.onMessage('startInspect', function(mode){
      mainMenu.item(mode).select();
    });
    
    mainMenu.setChildNodes([
      resource('module/localization/index.js')(),
      resource('module/templater/index.js')()
    ]);

    mainMenu.selectPage();
  }



  //
  // init
  //
  basis.ready(function(){
    // create transport
    app.transport = resource('app/transport/transport.js').fetch();
    app.type = resource('app/type.js').fetch();

    // init interfaces
    app.transport.ready(basis.fn.runOnce(initMainMenu));

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

