
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.data');
  basis.require('basis.cssom');
  basis.require('basis.entity');
  basis.require('basis.ui');
  basis.require('basis.ui.field');
  basis.require('basis.ui.button');
  basis.require('basis.data.property');
  basis.require('basis.net');
  basis.require('basis.ui.resizer');

  var STATE = basis.data.STATE;

  var FLAG_PATH = 'img/flags';
  var BASE_CULTURE = 'base';
  var CULTURE_LIST;
  //var dictionaries;

  var l10nType = resource('type.js')();
  app.l10nType = l10nType;

  var Dictionary = l10nType.Dictionary;
  var Token = l10nType.Token;
  var Resource = l10nType.Resource;
  var Culture = l10nType.Culture;
  var DictionaryCulture = l10nType.DictionaryCulture;

  var property_CurrentCulture = new basis.data.property.Property(null);
  var property_CurrentDictionary = new basis.data.property.Property(null);
  var property_CurrentToken = new basis.data.property.Property(null);

  property_CurrentCulture.addHandler({
    change: function(property){
      //app.transport.invoke('setCulture', property.value);
    }
  });

  // current dictionary changed
  property_CurrentDictionary.addHandler({
    change: function(property){
      var value = property.value;

      l10nType.dictionaryCultureDataset.setSource(value ? l10nType.dictionaryCultureSplit.getSubset(value, true) : null);
      l10nType.tokenDataset.setSource(value ? l10nType.tokenSplit.getSubset(value, true) : null);

      if (value)
      {
        var cultures = l10nType.usedCulturesDataset.getItems();

        for (var i = 0, culture; culture = cultures[i]; i++)
        {
          l10nType.DictionaryCulture({
            Dictionary: value,
            Culture: culture.data.Culture,
            Position: i
          });

          var tokens = l10nType.tokenDataset.getItems();
          for (var j = 0, token; token = tokens[j]; j++)
          {
            Resource({ 
              Dictionary: property_CurrentDictionary.value, 
              Token: token.data.Token,
              Culture: culture.data.Culture
            });
          }
        }
      }

      l10nType.resourceDictionaryCultureMerge.clear();

      if (value)
      {
        var cultures = l10nType.usedCulturesDataset.getItems();
        for (var i = 0, culture; culture = cultures[i]; i++)
          l10nType.resourceDictionaryCultureMerge.addSource(l10nType.resourceDictionaryCultureSplit.getSubset(value + '_' + culture.data.Culture, true));
      }

      l10nType.resourceModifiedDataset.setSource(value ? l10nType.resourceModifiedSplit.getSubset(value, true) : null);
    }
  });

  l10nType.usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      if (delta.inserted)
        for (var i = 0, culture; culture = delta.inserted[i]; i++)
        {
          l10nType.resourceDictionaryCultureMerge.addSource(l10nType.resourceDictionaryCultureSplit.getSubset(property_CurrentDictionary.value + '_' + culture.data.Culture, true));

          var tokens = l10nType.tokenDataset.getItems();
          for (var j = 0, token; token = tokens[j]; j++)
          {
            Resource({ 
              Dictionary: property_CurrentDictionary.value, 
              Token: token.data.Token,
              Culture: culture.data.Culture
            });
          }
        }

      if (delta.deleted)
        for (var i = 0, culture; culture = delta.deleted[i]; i++)
          l10nType.resourceDictionaryCultureMerge.removeSource(l10nType.resourceDictionaryCultureSplit.getSubset(property_CurrentDictionary.value + '_' + culture.data.Culture, true));
    }
  });

  l10nType.tokenDataset.addHandler({
    datasetChanged: function(object, delta){
      if (delta.inserted)
      {
        var cultures = l10nType.usedCulturesDataset.getItems();
        for (var i = 0, culture; culture = cultures[i]; i++)
        {
          for (var j = 0, token; token = delta.inserted[j]; j++)
          {
            Resource({ 
              Dictionary: property_CurrentDictionary.value, 
              Token: token.data.Token,
              Culture: culture.data.Culture
            });
          }
        }
      }
    }
  })

  l10nType.addCulture('base');

  //load resource for current dictionary and added culture
  var resourcesLoaded = {};
  l10nType.dictionaryCultureDataset.addHandler({
    datasetChanged: function(object, delta){
      if (delta.inserted)
        for (var i = 0, dictCulture; dictCulture = delta.inserted[i]; i++)
        {
          var key = dictCulture.data.Dictionary + '_' + dictCulture.data.Culture;
           if (!resourcesLoaded[key])
           {
             app.transport.invoke('loadDictionaryResource', dictCulture.data.Dictionary, dictCulture.data.Culture);
             resourcesLoaded[key] = true;
           }
        }
    }
  });

  //
  // listen page script
  //
  var lastDictionary;
  app.transport.ready(function(){
    for (var i in resourcesLoaded)
      delete resourcesLoaded[i];

    lastDictionary = property_CurrentDictionary.value;
    property_CurrentDictionary.set(null);

    app.transport.invoke('loadCultureList');
    app.transport.invoke('loadDictionaryList');
  });

  app.transport.onMessage({
    cultureList: function(data){
      data.cultureList.push('base')

      Culture.all.sync(data.cultureList);

      property_CurrentCulture.set(data.currentCulture);
    },
    
    cultureChanged: function(data){  
      property_CurrentCulture.set(data);
    },
    
    dictionaryList: function(data){
      data.map(Dictionary);
    
      if (lastDictionary)
      {
        property_CurrentDictionary.set(lastDictionary);
        lastDictionary = null;
      }
    },

    dictionaryResource: function(data){
      l10nType.processDictionaryData(data.dictionaryName, data.tokens);

      if (property_CurrentToken.value)
      {  
        dictionaryEditor.selectResource(property_CurrentToken.value, property_CurrentCulture.value);
        property_CurrentToken.reset();
      }
    },

    newDictionary: function(data){
      Dictionary(data.dictionaryName);
    },
          
    token: function(data){
      property_CurrentDictionary.set(data.dictionaryName);

      var dc = DictionaryCulture.get({ Dictionary: data.dictionaryName, Culture: property_CurrentCulture.value });
      if (!dc)
        l10nType.addCulture(property_CurrentCulture.value);

      property_CurrentToken.set(data.selectedToken);
      dictionaryEditor.selectResource(property_CurrentToken.value, property_CurrentCulture.value);
    },

    saveDictionary: function(data){
      if (data.result == 'success')
      {
        Dictionary(data.dictionaryName).setState(STATE.READY);
        l10nType.processDictionaryData(data.dictionaryName, data.tokens);
      }
      else 
        Dictionary(data.dictionaryName).setState(STATE.ERROR, data.errorText);
    }
  });


  //
  // Layout
  //

  //save button
  var saveButtonPanel = resource('module/saveButtonPanel/index.js').fetch();
  property_CurrentDictionary.addLink(saveButtonPanel, function(value){
    this.setDelegate(Dictionary(value));
  });

  //dictionary list
  var dictionaryList = resource('module/dictionaryList/index.js').fetch();
  dictionaryList.setDataSource(Dictionary.all);
  property_CurrentDictionary.addLink(dictionaryList, function(value){
    this.setValue(value);
  });
  dictionaryList.selection.addHandler({
    datasetChanged: function(){
      var item = this.pick();
      property_CurrentDictionary.set(item && item.data.Dictionary);
    }
  });

  var dictionaryListMatchInput = new basis.ui.field.MatchInput({
    template: resource('template/dictionaryListMatchInput.tmpl'),
    matchFilter: {
      node: dictionaryList,
      startPoints: '^|\\.',
      textNodeGetter: 'tmpl.title'
    },
    binding: {
      example: cancelFilterButton
    }
  });
  
  var cancelFilterButton = new basis.ui.Node({
    container: dictionaryListMatchInput.element,
    template: resource('template/cancelFilterButton.tmpl'),
    action: {
      click: function(){
        dictionaryListMatchInput.setValue('');
      }
    }
  });
  dictionaryListMatchInput.matchFilter.addLink(cancelFilterButton, function(value){
    basis.cssom.display(this.element, !!value);
  });


  //dictionary editor 

  var dictionaryEditor = resource('module/editor/index.js')();
  property_CurrentDictionary.addLink(dictionaryEditor, function(value){
    basis.cssom.display(this.element, !!value);
  });

  // layout

  var layout = new basis.ui.Node({
    template: resource('template/layout.tmpl'),

    binding: {
      matchInput: dictionaryListMatchInput,
      dictionaryList: dictionaryList,
      dictionaryEditor: dictionaryEditor,
      saveButtonPanel: saveButtonPanel
    }
  });

  new basis.ui.resizer.Resizer({
    element: layout.tmpl.sidebar
  });

  module.exports = layout;

