
  basis.require('basis.data.property');
  basis.require('basis.ui');

  function initMainMenu(){
    var mainMenu = basis.resource('app/module/mainmenu/mainmenu.js').fetch();
    
    mainMenu.setChildNodes([
      basis.resource('app/module/localization/localization.js')(),
      basis.resource('app/module/templater/templater.js')()
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
    var transport = resource('transport/static.js');

    // choose suitable transport
    if (global.chrome && global.chrome.extension)
      transport = resource('transport/plugin.js');
    else if (global.appcp_server)
      transport = resource('transport/server.js');

    // create transport
    app.transport = transport.fetch();

    // init interfaces
    initMainMenu();
  });

