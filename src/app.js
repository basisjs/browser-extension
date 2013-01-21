
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
    // default transport
    var transport = resource('app/transport/static.js');

    // choose suitable transport
    if (global.chrome && global.chrome.extension)
      transport = resource('app/transport/plugin.js');
    else if (global.appcp_server)
      transport = resource('app/transport/server.js');

    // create transport
    app.transport = transport.fetch();

    // init interfaces
    initMainMenu();
  });

