
  basis.require('basis.data.property');
  basis.require('basis.ui');

  function initMainMenu(){
    var mainMenu = resource('module/mainmenu/mainmenu.js').fetch();
    
    mainMenu.setChildNodes([
      resource('module/localization/localization.js')(),
      resource('module/templater/templater.js')()
    ]);

    mainMenu.selectPage();

    app.transport.onMessage('contextMenuTranslate', function(){
      mainMenu.item('Localization').select();
      app.transport.call('getTokenByContextMenu');
    });
  }

  //
  // init
  //

  basis.ready(function(){
    // create transport
    app.transport = resource('app/transport/transport.js').fetch();

    // init interfaces
    initMainMenu();
  });

