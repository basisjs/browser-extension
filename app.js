
  basis.require('basis.l10n');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.ui');

  function initMainMenu(){
    var EXTENSION_LAST_TAB_STORAGE_KEY = 'BasisDevtoolLastTab';

    var mainMenu = basis.resource('app/module/mainmenu/mainmenu.js')();
    
    mainMenu.setChildNodes([
      basis.resource('app/module/localization/localization.js')(),
      basis.resource('app/module/templater/templater.js')()
    ]);

    var tabName = localStorage[EXTENSION_LAST_TAB_STORAGE_KEY];
    if (tabName)
    {
      var tab = mainMenu.item(tabName);
      if (tab)
        tab.select();
    }
    mainMenu.selection.addHandler({
      datasetChanged: function(){
        var tab = this.pick();
        if (tab)
          localStorage[EXTENSION_LAST_TAB_STORAGE_KEY] = tab.name;        
      }
    });

    app.transport.onMessage('contextMenuTranslate',function(){
      mainMenu.item('Localization').select();
      app.transport.call('getTokenByContextMenu');
    });
  }


  //
  // init
  //

  basis.ready(function(){
    // init transport

    var transportClass;
    if (chrome && chrome.extension)
    {
      transportClass = resource('transport/plugin.js')();
    }
    else if (window.appcp_server)
    {
      transportClass = resource('transport/server.js')();
    }
    else
      transportClass = resource('transport/static.js')();

    app.transport = new transportClass({});

    // init interfaces
    initMainMenu();
  });

