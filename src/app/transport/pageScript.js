
  var func = function(){
    basis.require('basis.dom');
    basis.require('basis.ui');
    basis.require('basis.ui.popup');
    basis.require('basis.dom.wrapper');
    basis.require('basis.data');
    basis.require('basis.data.property');

    var DOM = basis.dom;
    var STATE = basis.data.STATE;
    var DataObjectSet = basis.data.property.DataObjectSet;    

    //
    // Share DOM
    //
    var transferDataEvent = document.createEvent('Event');
    transferDataEvent.initEvent('transferData', true, true);

    var transferDiv = document.body.appendChild(
      DOM.createElement('pre#transferDiv[style="position: absolute; left: -2000px"]')
    );

    function sendData(action, data){
      transferDiv.setAttribute('action', action);
      transferDiv.innerHTML = '';
      transferDiv.appendChild(document.createTextNode(JSON.stringify(data || {})));
      transferDiv.dispatchEvent(transferDataEvent);
      transferDiv.innerHTML = '';
    }

    //
    // l10n context menu
    //
    var nodePickedByContextMenu;
    document.addEventListener('contextmenu', contextMenuHandler);

    function contextMenuHandler(event){
      nodePickedByContextMenu = basis.dom.event.sender(event);
    }

    function getTokenByContextMenu(){
      if (nodePickedByContextMenu)
      {
        var node = nodePickedByContextMenu;
        var basisObjectId = node.basisObjectId;

        while (!basisObjectId && node.parentNode)
        {
          node = node.parentNode;
          basisObjectId = node.basisObjectId;
        }

        if (basisObjectId)
        {
          var basisNode = basis.template.resolveObjectById(basisObjectId);
          if (basisNode)
          {
            bindings = (basisNode.tmpl.set.debug && basisNode.tmpl.set.debug()) || [];
            for (var j = 0, binding; binding = bindings[j]; j++)
            {
              if (binding.attachment && binding.dom.nodeType == basis.dom.TEXT_NODE && nodePickedByContextMenu.contains(binding.dom))
              {
                loadToken(binding.attachment);
              }
            }
          }
        }
      }
    }

    //
    // l10n Inspect
    //
    var inspectMode;
    var elements = [];

    var overlay = DOM.createElement({
      description: 'DIV[style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(128,128,128,.0.05)"]',
      click: function(event){
        var sender = basis.dom.event.sender(event);

        var token = sender.token;
        if (token)
        {
          endInspect();
          loadToken(token);
        } 
      }
    });

    // dom mutation observer

    var observerConfig = {
      subtree: true,
      attributes: true,
      characterData: true
    };
    var observer = (function(){
      var names = ['MutationObserver', 'WebKitMutationObserver'];
      
      for (var i = 0, name; name = names[i]; i++)
        if (name in global)
          return new global[name](function(mutations){
            unhighlight();
            highlight();  
          });
    })();

    function startInspect(){ 
      if (!inspectMode)
      {
        inspectMode = true;
        highlight();
        if (observer)
          observer.observe(document.body, observerConfig);
      }
    }
    function endInspect(){
      if (inspectMode)
      {
        if (observer)
          observer.disconnect();
        unhighlight();
        inspectMode = false;
      }
    }

    function highlight(){
      DOM.insert(document.body, overlay);
      domTreeHighlight(document.body);
    }

    function unhighlight(){
      var node;

      while (node = elements.pop())
      {
        node.token = null;
        DOM.remove(node);
      }

      DOM.remove(overlay);
    }

    function domTreeHighlight(root){
      var range = document.createRange();

      for (var i = 0, child; child = root.childNodes[i]; i++)
      {
        if (child.nodeType == basis.dom.ELEMENT_NODE) 
        {
          if (child.basisObjectId)
          {
            var node = basis.template.resolveObjectById(child.basisObjectId);
            if (node)
            {
              var bindings = (node.tmpl.set.debug && node.tmpl.set.debug()) || [];
              for (var j = 0, binding; binding = bindings[j]; j++)
              {
                if (binding.attachment && binding.dom.nodeType == basis.dom.TEXT_NODE/* && child.contains(binding.dom)*/)
                {
                  //nodes.push(binding.dom);
                  range.selectNodeContents(binding.dom);
                  var rect = range.getBoundingClientRect();
                  if (rect)
                  {
                    var color = getColorForDictionary(binding.attachment.dictionary.namespace);
                    var bgColor = 'rgba(' + color.join(',') + ', .3)';
                    var borderColor = 'rgba(' + color.join(',') + ', .6)';
                    var element = overlay.appendChild(basis.dom.createElement({
                      css: {
                        backgroundColor: bgColor,
                        outline: '1px solid ' + borderColor,
                        zIndex: 65000,
                        position: 'fixed',
                        cursor: 'pointer',
                        top: rect.top + 'px',
                        left: rect.left + 'px',
                        width: rect.width + 'px', 
                        height: rect.height + 'px'
                      }
                    }));

                    element.token = binding.attachment;

                    elements.push(element);
                  }
                }
              }
            }
          }

          domTreeHighlight(child);
        }  
      }
    }

    var dictionaryColor = {};
    function getColorForDictionary(dictionaryName){
      if (!dictionaryColor[dictionaryName])
        dictionaryColor[dictionaryName] = getColor();

      return dictionaryColor[dictionaryName];
    }

    //
    // L10n functions
    //

    function loadCultureList(){
      var data = {
        currentCulture: basis.l10n.getCulture(),
        cultureList: basis.l10n.getCultureList()
      }
      sendData('cultureList', data);
    }

    function loadDictionaryList(){
      var dictionaries = basis.l10n.getDictionaries();
      var data = [];

      for (var dictionaryName in dictionaries)
        if (dictionaries[dictionaryName].location)
          data.push({
            Dictionary: dictionaryName,
            Location: dictionaries[dictionaryName].location
          });

      sendData('dictionaryList', data);
    }

    function loadDictionaryResource(dictionaryName, culture){
      var dict = basis.l10n.getDictionary(dictionaryName);
      if (dict)
      {
        basis.l10n.loadCultureForDictionary(basis.l10n.getDictionary(dictionaryName), culture);

        var data = {
          dictionaryName: dictionaryName,
          tokens: {}
        };

        for (var tokenName in dict.resources['base'])
        {
          if (!data.tokens[tokenName])
          {
            data.tokens[tokenName] = {};
            dict.getToken(tokenName);
          }
          
          data.tokens[tokenName][culture] = dict.resources[culture] && dict.resources[culture][tokenName] || '';
        }

        sendData('dictionaryResource', data);
      }
    }
    
    function loadToken(token){
      var dictionary = token.dictionary;
      var cultureList = basis.l10n.getCultureList();

      var data = { 
        cultureList: cultureList,
        selectedToken: token.name,
        dictionaryName: dictionary.namespace, 
        tokens: {}
      };

      for (var key in dictionary.tokens)
      {
        var tkn = dictionary.tokens[key];
        data.tokens[tkn.name] = {};
        for (var j = 0, culture; culture = cultureList[j]; j++)
          data.tokens[tkn.name][culture] = dictionary.getCultureValue(culture, tkn.name);
      }
      
      sendData('token', data);        
    }

    function setTokenCultureValue(namespace, name, culture, value){
      var token = basis.l10n.getToken(namespace + '.' + name);
      token.dictionary.setCultureValue(culture, name, value);
    }

    function setCulture(culture){
      basis.l10n.setCulture(culture);

      if (inspectMode)
      {
        unhighlight();
        highlight();
      }
    }

    function saveDictionary(dictionaryName, cultureList){
      if (!basis.devtools)
        return;

      var dict = basis.l10n.getDictionary(dictionaryName);
      var location = dict.location;

      var dictionaryData = {};
      var dictContent;
      var resourceParts;

      var fileDataObjectSet = new DataObjectSet({
        handler: {
          stateChanged: function(){
            if (this.state == STATE.READY)
              sendData('saveDictionary', { result: 'success', dictionaryName: dictionaryName, tokens: dictionaryData });
            else if (this.state == STATE.ERROR)
              sendData('saveDictionary', { result: 'error', dictionaryName: dictionaryName, errorText: this.state.data });

            if (this.state == STATE.READY || this.state == STATE.ERROR)
              setTimeout(function(){
                fileDataObjectSet.destroy();
              }, 0);
          }
        }
      });

      var dictionaries;
      var resourceParts;      
      var dictParts;
      var filename;
      var file;
      var newContent;

      for (var i = 0, culture; culture = cultureList[i]; i++)
      {
        filename = '/' + basis.path.relative(location + '/' + culture + '.json');
        file = basis.devtools.getFile(filename);

        if (file)
        {
          dictionaries = Object.extend({}, basis.resource(filename)());
          dictionaries[dictionaryName] = dict.resources[culture];
          dictParts = [];
          for (var dName in dictionaries)
          {
            resourceParts = [];

            if (dName == dict.namespace)
            {
              for (var tokenName in dict.resources['base'])
              {
                if (dict.resources[culture][tokenName])
                  resourceParts.push('    "' + tokenName + '": "' + dict.resources[culture][tokenName] + '"');

                if (!dictionaryData[tokenName])
                  dictionaryData[tokenName] = {};

                dictionaryData[tokenName][culture] = dict.resources[culture][tokenName] || '';
              }
            }
            else
            {
              for (var tokenName in dictionaries[dName])
                resourceParts.push('    "' + tokenName + '": "' + dictionaries[dName][tokenName] + '"');
            }

            dictParts.push('\r\n  "' + dName + '": {\r\n' + resourceParts.join(',\r\n') + '\r\n  }');
          }

          newContent = '{' + dictParts.join(', ') + '\r\n}';	

          file.setState(STATE.UNDEFINED);
          fileDataObjectSet.add(file);
          file.update({ content: newContent });
          file.save();
        }
        else
          sendData('saveDictionary', { result: 'error', dictionaryName: dictionaryName, errorText: 'File ' + filename + ' not found' });
      }
    }

    basis.l10n.addCreateDictionaryHandler(function(dictionaryName){
      sendNewDictionary(dictionaryName);
    }); 

    function sendNewDictionary(dictionaryName){
      sendData('newDictionary', { dictionaryName: dictionaryName });
    }


    //
    // Template Inspect
    //

    var templateInspector = (function(){
      var inspectMode;
      var inspectDepth = 0;

      function startInspect(){ 
        if (!inspectMode)
        {
          basis.dom.event.addGlobalHandler('mousemove', mousemoveHandler);
          basis.dom.event.addGlobalHandler('mousewheel', mouseWheelHandler);
          inspectMode = true;
        }
      }
      function endInspect(){
        if (inspectMode)
        {
          basis.dom.event.removeGlobalHandler('mousemove', mousemoveHandler);
          basis.dom.event.removeGlobalHandler('mousewheel', mouseWheelHandler);
          inspectMode = false;
          pickupTarget.set();
        }
      }

      var lastMouseX;
      var lastMouseY;
      var DEPTH_MODE_MOVE_THRESHOLD = 15;

      function mousemoveHandler(){
        var mouseX = basis.dom.event.mouseX(event);
        var mouseY = basis.dom.event.mouseY(event);

        if (inspectDepth)
        {
          var realMove = !lastMouseX || Math.abs(mouseX - lastMouseX) > DEPTH_MODE_MOVE_THRESHOLD || Math.abs(mouseY - lastMouseY) > DEPTH_MODE_MOVE_THRESHOLD;

          if (!realMove)
            return;
        }

        lastMouseX = mouseX;
        lastMouseY = mouseY;


        var sender = basis.dom.event.sender(event);
        var cursor = sender;
        var refId;
        do {
          if (refId = cursor.basisObjectId)
          { 
            inspectDepth = 0;
            return pickupTarget.set(basis.template.resolveObjectById(refId));
          }
        } while (cursor = cursor.parentNode);

        pickupTarget.set();
      }

      function mouseWheelHandler(){
        var delta = basis.dom.event.wheelDelta(event);
        var sender = basis.dom.event.sender(event);
        var cursor = sender;

        var tempDepth = inspectDepth + delta;

        var curDepth = 0;
        var lastRefId;
        var lastDepth;

        var refId;
        do {
          if (refId = cursor.basisObjectId)
          {
            lastRefId = refId;
            lastDepth = curDepth;
            if (tempDepth < 0 || curDepth == tempDepth)
              break;

            curDepth++;
          }
        } while (cursor = cursor.parentNode);

        pickupTarget.set(basis.template.resolveObjectById(lastRefId));
        inspectDepth = lastDepth;

        basis.dom.event.kill(event);
      }

      var pickupTarget = new basis.data.property.Property(null, {
        change: function(value, oldValue){
          updatePickupElement(value, oldValue);
        }
      }, function(value){
        return value && value.element && value.template instanceof basis.template.Template ? value : null;
      });

      function updatePickupElement(property, oldValue){
        var node = property.value;
        if (node)
        {
          //range.selectNodeContents(value.element);
          //var rect = node.element.getBoundingClientRect();
          var rect = getOffsetRect(node.element);
          if (rect)
          {
            basis.cssom.setStyle(overlay, {                              
              left: rect.left + 'px',
              top: rect.top + 'px',
              width: rect.width + 'px',
              height: rect.height + 'px'
            });
            document.body.appendChild(overlay);
            basis.dom.event.captureEvent('mousedown', basis.dom.event.kill);
            basis.dom.event.captureEvent('mouseup', basis.dom.event.kill);
            basis.dom.event.captureEvent('click', clickHandler);
          }
        }
        else
        {
          document.body.removeChild(overlay);
          basis.dom.event.releaseEvent('mousedown');
          basis.dom.event.releaseEvent('mouseup');
          basis.dom.event.releaseEvent('click');
          inspectDepth = 0;
        }

        nodeInfoPopup().setDelegate(node);
      }

      var nodeInfoPopup = basis.fn.lazyInit(function(){
        var panel = new basis.ui.Node({
          template: '<div>{title}</div>',
          binding: {
            title: {
              events: 'delegateChanged update',
              getter: function(object){
                if (object.delegate)
                {
                  var el = object.delegate.element;
                  return object.delegate.constructor.className + '#' + el.basisObjectId + ', ' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : (el.className ? '.' + el.className.split(' ').join('.') : ''));
                }
              }
            }
          }
        });

        var popup = new basis.ui.popup.Balloon({
          dir: 'left bottom left top',
          autorotate: [
            'left top left bottom', 
            'left bottom left bottom', 
            'left top left top', 
            'right bottom right top', 
            'right top right bottom',
            'right bottom right bottom',
            'right top right top' 
          ],
          childNodes: panel,
          handler: {
            delegateChanged: function(){
              if (this.delegate)
                this.show(this.delegate.element);
              else
                this.hide();

              panel.setDelegate(this.delegate);
            },
            hide: function(){
              this.setDelegate();
            }
          }
        });

        return popup;
      });
       

      var overlay = DOM.createElement('DIV[style="pointer-events: none; position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(110,163,217,0.7)"]');

      function clickHandler(event){
        basis.dom.event.kill(event);

        var node = pickupTarget.value;
        if (node)
        {
          var url = node.template.source.url;

          if (url)
            sendData('pickTemplate', {
              filename: url.substr((location.protocol + '//' + location.host).length)
            });
          else
            sendData('pickTemplate', {
              content: node.template.source
            });
        } 
      }

      return {
        start: startInspect,
        end: endInspect
      }
    })();

    function startTemplateInspect(){
      templateInspector.start();
    }
    function endTemplateInspect(){
      templateInspector.end();
    }

    function getOffsetRect(elem){
      var box = elem.getBoundingClientRect();

      var body = document.body;
      var docElem = document.documentElement;

      var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
      var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

      var clientTop = docElem.clientTop || body.clientTop || 0;
      var clientLeft = docElem.clientLeft || body.clientLeft || 0;

      var top  = box.top + scrollTop - clientTop;
      var left = box.left + scrollLeft - clientLeft;

      return { 
        top: Math.round(top), 
        left: Math.round(left),
        width: box.width,
        height: box.height
      }
    }


    //
    // Files
    //
    function getFileList(){
      if (basis.devtools)
        sendData('filesChanged', { 
          inserted: basis.devtools.files.getItems().map(function(file){ 
            return {
              filename: file.data.filename
            };
          }) 
        });
    }
    function sendFile(file){
      var data = basis.object.slice(file.data);

      if (basis.path.extname(file.data.filename) == '.tmpl' && file.data.content)
      {
        data.declaration = basis.template.makeDeclaration(file.data.content, basis.path.dirname(basis.path.resolve(file.data.filename)) + '/');
        data.resources = data.declaration.resources.map(function(item){
          return item.substr((location.protocol + '//' + location.host).length)/*'/' + basis.path.relative(item)*/
        });
      }  
        
      sendData('updateFile', data);
    }

    function createFile(filename){
      basis.devtools.createFile(filename);
    }
    function readFile(filename){
      var file = basis.devtools.getFile(filename);
      if (file)
      {
        if (file.data.content)
          sendFile(file);
        else
          file.read();
      }
    }
    function saveFile(filename, content){
      var file = basis.devtools.getFile(filename);
      if (file)
      {
        file.update({ content: content });
        file.save();
      }
    }

    // Sync

    var FILE_HANDLER = {
      update: function(object, delta){
        sendFile(object);
      }
    };
    var FILE_LIST_HANDLER = {
      datasetChanged: function(dataset, delta){
        var data = {};
        if (delta.inserted)
        {
          data.inserted = [];
          var fileData;
          for (var i = 0, object; object = delta.inserted[i]; i++)
          {
            if (/\.(tmpl|css)$/.test(object.data.filename))
            {
              fileData = basis.object.slice(object.data);
              delete fileData.content;

              data.inserted.push(fileData);
              object.addHandler(FILE_HANDLER);
            }
          }
        }
            
        if (delta.deleted)
        {
          data.deleted = [];

          for (var i = 0, object; object = delta.deleted[i]; i++)
          {
            if (/\.(tmpl|css)$/.test(object.data.filename))
            {
              data.deleted.push(object.getId());
              object.removeHandler(FILE_HANDLER);
            }
          }
        }
        
        if ((data.inseted && data.inseted.length) || (data.deleted && data.deleted.length))
          sendData('filesChanged', data);
      }
    }

    if (basis.devtools)
    {
      var files = basis.devtools.files;
      files.addHandler(FILE_LIST_HANDLER);
      FILE_LIST_HANDLER.datasetChanged.call(files, files, {
        inserted: files.getItems()
      });
    }

    //
    //check server state 
    //

    var serverStateChangedHandler = {
      update: function(object, delta){
        if ('isOnline' in delta)
          sendData('fsobserverState', {
            state: this.data.isOnline
          });
      } 
    }

    function checkFsObserverState(){
      if (basis.devtools)
        sendData('fsobserverState', {
          state: basis.devtools.serverState.data.isOnline
        });
    }
    
    if (basis.devtools)
      basis.devtools.serverState.addHandler(serverStateChangedHandler);
    
    //
    // Color staff
    //
    function getColor(){
      var golden_ratio_conjugate = 0.618033988749895;

      var h = Math.random();
      h += golden_ratio_conjugate;
      h %= 1;

      return hsv_to_rgb(h, 0.7, 0.95);
    }
    function hsv_to_rgb(h, s, v){
      var h1 = h * 6;
      var c = v * s;
      var x = c * (1 - Math.abs(h1 % 2 - 1));
      var rgb;
      switch(Math.floor(h1))
      { 
        case 0: rgb = [c, x, 0]; break;
        case 1: rgb = [x, c, 0]; break;
        case 2: rgb = [0, c, x]; break;
        case 3: rgb = [0, x, c]; break;
        case 4: rgb = [x, 0, c]; break;
        case 5: rgb = [c, 0, x]; break;
      }
      var m = v - c; 
      return [
        Math.floor((rgb[0] + m) * 256), 
        Math.floor((rgb[1] + m) * 256), 
        Math.floor((rgb[2] + m) * 256) 
      ];
    }

    basis.appCP = {
      checkFsObserverState: checkFsObserverState,

      loadDictionaryList: loadDictionaryList,
      loadDictionaryResource: loadDictionaryResource,
      setTokenCultureValue: setTokenCultureValue,
      setCulture: setCulture,
      startInspect: startInspect,
      endInspect: endInspect,
      saveDictionary: saveDictionary,
      loadCultureList: loadCultureList,

      getFileList: getFileList,
      readFile: readFile,
      saveFile: saveFile,
      createFile: createFile,
      startTemplateInspect: startTemplateInspect,
      endTemplateInspect: endTemplateInspect,
      getTokenByContextMenu: getTokenByContextMenu
    }
  }

  module.exports = "(function(global){" +
    "if (basis){" +
      "if (!basis.appCP){" +
        "try{" +
          "(" + func.toString() + ")();" +
        "}catch(e){" +
          "console.warn(e.toString())" +
        "}" +
      "}" +
      "return true;" +
    "}" +
    "else return false;"+
  "})(this)";
