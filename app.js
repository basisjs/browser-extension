
  basis.require('basis.l10n');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.ui');

  //
  // Transports
  //

  var Transport = basis.Class(null, {
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

      for (var i = 0, handler; handler = this.handlers[message.action][i]; i++)
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
    
    call: Function.$undef
  });
  
  //
  // Plugin transport
  //
  var ChromePluginTransport = Transport.subclass({
    port: null,

    init: function(){
      Transport.prototype.init.call(this);

      this.port = chrome.extension.connect({ name: "extensionUIPort" });
      this.port.onMessage.addListener(this.message.bind(this));
      this.port.postMessage({ action: 'extensionInited', tabId: chrome.devtools.inspectedWindow.tabId});

      this.onMessage('transportInited', function(){
        this.message({ action: 'ready' });
      }, this);
      this.onMessage('contentScriptInited', this.injectScript, this);

      this.injectScript();
    },
    call: function(funcName){
      var args = Array.from(arguments).slice(1).map(JSON.stringify);

      chrome.devtools.inspectedWindow.eval(
        '(function(){ try { if (window.pageScript) window.pageScript.' + funcName + "(" + (args.length ? args.join(", ") : '') + "); return true;} catch(e){ console.warn(e.toString()) }})();"
      );
    },
    injectScript: function(){
      var pageScript = resource('pageScript.js');
      if (pageScript)
      {
        var port = this.port;
        chrome.devtools.inspectedWindow.eval(pageScript(), function(result){
          if (result)
            port.postMessage({ action: 'pageScriptInited' });
          else
          {
            new basis.ui.Node({
              cssClassName: 'BasisNotSupported',
              container: document.body,
              content: 'Basis not found'
            });
          }
        });
      }
    }
  });
  //
  // pageScript
  //

  /*var port;
  var missedHandlers = [];
  var isServerOnline = new Property(false);
  var isPageScriptReady = new Property(false);

  function initPageScript(){
    port = chrome.extension.connect({ name: "extensionUIPort" });

    port.onMessage.addListener(function(msg) {
      if (msg.action == 'contentScriptInited')
      {
        isPageScriptReady.set(false);
        injectScript();
      }
      else if (msg.action == 'transportInited')
      {
        callPageScriptFunction('checkFsObserverState');
        isPageScriptReady.set(true);
      }
      else if (msg.action == 'fsobserverState')
      {
        isServerOnline.set(msg.data.toObject().state);
      }
      else if (msg.action == 'contextMenuTranslate')
      {
        mainMenu.item('Localization').select();
        callPageScriptFunction('getTokenByContextMenu');
      }
    });

    for (var i = 0, handler; handler = missedHandlers[i]; i++)
      port.onMessage.addListener(handler);

    port.postMessage({ action: 'extensionInited', tabId: chrome.devtools.inspectedWindow.tabId});

    injectScript();
  }

  function injectScript(){
    var pageScript = resource('pageScript.js');
    if (pageScript)
    {
      //var tabId = chrome.devtools.inspectedWindow.tabId;

      chrome.devtools.inspectedWindow.eval(pageScript(), function(result){
        if (result)
          port.postMessage({ action: 'pageScriptInited' });
        else
        {
          new uiNode({
            cssClassName: 'BasisNotSupported',
            container: document.body,
            content: 'Basis not found'
          });
        }
      });
    }
  }

  function callPageScriptFunction(funcName){
    if (!chrome.devtools)
      return;

    var args = Array.from(arguments).slice(1).map(JSON.stringify);

    chrome.devtools.inspectedWindow.eval(
      '(function(){ try { if (window.pageScript) window.pageScript.' + funcName + "(" + (args.length ? args.join(", ") : '') + "); return true;} catch(e){ console.warn(e.toString()) }})();"
    );
  }

  function onPageScriptMessage(handler){
    if (port)
      port.onMessage.addListener(handler);
    else
      missedHandlers.push(handler);
  }*/

  //
  // main menu
  //


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
    var transportClass = chrome && chrome.extension ? ChromePluginTransport : Transport;

    app.transport = new transportClass({});

    initMainMenu();
  });


  //
  // extend
  //

  /*module.exports = {
    onPageScriptMessage: onPageScriptMessage,
    callPageScriptFunction: callPageScriptFunction,
    isServerOnline: isServerOnline,
    isPageScriptReady: isPageScriptReady
  };*/

