
  basis.require('basis.data');
  basis.require('basis.data.dataset');
  basis.require('basis.entity');
  basis.require('app.type');

  var nsEntity = basis.entity;
  var EntityType = basis.entity.EntityType;

  var Split = basis.entity.Grouping;
  var Merge = basis.data.dataset.Merge;
  var Subset = basis.data.dataset.Subset;

  var getter = Function.getter;

  var STATE = basis.data.STATE;


  var Dictionary = new EntityType({
    name: 'Dictionary',
    fields: {
      Dictionary: nsEntity.StringId,
      Location: String,
      ResourceModified: Boolean
    }
  });

  var Token = new EntityType({
    name: 'Token',
    fields: {
      Dictionary: nsEntity.StringId,
      Token: nsEntity.StringId,
      TokenParent: String,
      TokenType: String
    }
  });

  var Resource = new EntityType({
    name: 'Resource',
    fields: {
      Dictionary: nsEntity.StringId,
      Token: nsEntity.StringId,
      Culture: nsEntity.StringId,
      Value: String
    }
  });

  var DictionaryCulture = new EntityType({
    name: 'DictionaryCulture',
    fields: {
      Dictionary: nsEntity.StringId,
      Culture: nsEntity.StringId,
      Position: Number
    }
  });

  var Culture = new EntityType({
    name: 'Culture',
    fields: {
      Culture: nsEntity.StringId,
      Title: String
    }
  });

  //
  // Datasets
  //
  var resourceDictionarySplit = new Split({
    source: Resource.all,
    wrapper: Resource,
    rule: basis.getter('data.Dictionary')
  });

  var resourceDictionaryCultureSplit = new Split({
    source: Resource.all,
    wrapper: Resource,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Culture;
    }
  });
  var resourceDictionaryCultureMerge = new Merge({});
  var resourceSplit = new Split({
    source: resourceDictionaryCultureMerge,
    wrapper: Resource,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Token;
    }
  });

  // dictionary culture
  var dictionaryCultureSplit = new Split({
    source: DictionaryCulture.all,
    wrapper: DictionaryCulture,
    rule: getter('data.Dictionary')
  });
  var dictionaryCultureDataset = new Subset({
    rule: basis.fn.$true
  });

  var tokenSplit = new Split({
    source: Token.all,
    rule: getter('data.Dictionary'),
    wrapper: Token
  });
  var tokenDataset = new Subset({});

  // observe resource changes datasets
  var resourceModifiedSubset = new Subset({ 
    source: Resource.all,
    ruleEvents: { 
      rollbackUpdate: true,
      update: true
    },
    rule: function(object){
      return !!object.modified;
    }
  });
  resourceModifiedSubset.addHandler({
    datasetChanged: function(object, delta){
      var objects = [].concat(delta.inserted || [], delta.deleted || []);
      for (var i = 0, object; object = objects[i]; i++)
        Dictionary(object.data.Dictionary).set('ResourceModified', resourceModifiedSplit.getSubset(object.data.Dictionary, true).itemCount > 0, true);
    }
  });
  var resourceModifiedSplit = new Split({
    source: resourceModifiedSubset,
    wrapper: Resource,
    rule: getter('data.Dictionary')
  });
  var resourceModifiedDataset = new Subset({
    rule: basis.fn.$true
  });

  //
  // extend Dictionary
  //
  var isServerOnline = false;

  Object.extend(Dictionary.entityType.entityClass.prototype, {
    save: function(){
      if (isServerOnline && this.modified && this.state != STATE.PROCESSING)
      {
        var modifiedCultures = {};
        var modifiedResources = resourceModifiedSplit.getSubset(this.data.Dictionary, true).getItems();
        for (var i = 0, resource; resource = modifiedResources[i]; i++) 
          modifiedCultures[resource.data.Culture] = true;

        var cultureList = [];
        for (var i in modifiedCultures)
          cultureList.push(i);

        app.transport.invoke('saveDictionary', this.data.Dictionary, this.data.Location, cultureList);
        this.setState(STATE.PROCESSING);
      }
    },
    reset: function(){
      this.setState(STATE.READY);
      resourceModifiedSplit.getSubset(this.data.Dictionary, true).getItems().forEach(function(token){
        token.rollback();
      });
    }
  });  


  //
  // add/remove culture
  //
  var usedCulturesDataset = new basis.data.Dataset({});  

  function addCulture(culture){
    var usedCulturesCount = usedCulturesDataset.getItems().length - 1;

    var dictionaries = Dictionary.all.getItems();
    for (var i = 0, dictionary; dictionary = dictionaries[i]; i++)
    { 
      DictionaryCulture({
        Dictionary: dictionary.data.Dictionary,
        Culture: culture,
        Position: usedCulturesCount
      });
    }
  }

  function deleteCulture(culture){
    var dictionaries = Dictionary.all.getItems();

    var culturePosition;
    if (dictionaries[0])
      culturePosition = DictionaryCulture({
        Culture: culture,
        Dictionary: dictionaries[0].data.Dictionary
      }).data.Position;

    for (var i = 0, dictionary; dictionary = dictionaries[i]; i++)
    {
      DictionaryCulture({ 
        Dictionary: dictionary.getId(), 
        Culture: culture 
      }).destroy();
    }

    if (culturePosition)
    {
      var cultures = DictionaryCulture.all.getItems().filter(function(item){ return item.data.Position > culturePosition }) || [];
      for (var i = 0, item; item = cultures[i]; i++)
        item.set('Position', item.data.Position - 1);
    }
  }

  usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      if (delta.inserted)
        for (var i = 0, culture; culture = delta.inserted[i]; i++)
          addCulture(culture.data.Culture);

      if (delta.deleted)
        for (var i = 0, culture; culture = delta.deleted[i]; i++)
          deleteCulture(culture.data.Culture);
    }
  });  

  //
  // process resources
  //
  function processDictionaryData(dictionary, data){
    var resources = [];
    var tokens = [];

    for (var culture in data){
      if (/^_/.test(culture))
        return;

      for (var token in data[culture])
      {
        var value = data[culture][token];
        var tokenType = typeof value == 'string' ? 'string' : 
          (Object.prototype.toString.call(value) == '[object Array]' ? 'array' : 'object');

        tokens.push({ 
          Dictionary: dictionary, 
          Token: token,
          TokenType: tokenType
        });        

        if (tokenType == 'string')
        {
          resources.push({
            Dictionary: dictionary, 
            Token: token,
            Culture: culture,
            Value: value
          });
        }
        else
        {
          var values = {};

          switch (tokenType){
            case 'array':
              value.forEach(function(value, index){
                values[index] = value;
              });
              break;

            case 'object':
              values = value
              break;
          }

          for (var key in values)
          {
            tokens.push({ 
              Dictionary: dictionary, 
              Token: token + (key ? '.' + key : ''),
              TokenParent: key ? token : '',
              TokenType: tokenType == 'object' ? 'key' : (tokenType == 'array' ? 'index' : '')
            });

            resources.push({
              Dictionary: dictionary, 
              Token: token + (key ? '.' + key : ''),
              Culture: culture,
              Value: values[key]
            });
          }          
        }
      }
    }

    tokenSplit.getSubset(dictionary, true).sync(tokens);
    resourceDictionarySplit.getSubset(dictionary, true).sync(resources);
  }  

  //
  // sync dictionaries from extractor
  // 
  var appProfile = app.type.AppProfile();

  appProfile.addHandler({
    targetChanged: function(object){
      if (object.data.l10n)
        processDictionaries(object.data.l10n);
    },
    update: function(object, delta){
      if (object.data.l10n)
        processDictionaries(object.data.l10n);
    }
  });
  
  if (appProfile.data.l10n)
    processDictionaries(appProfile.data.l10n);

  function processDictionaries(data){
    for (var dictName in data) {
      Dictionary({
        Dictionary: dictName,
        Location: data[dictName].path
      });

      //processDictionaryData(dictName, data[dictName].tokens);
    }
  }


  //
  // message handlers
  //
  app.transport.ready(function(){
    app.transport.invoke('serverStatus');
    app.transport.invoke('loadCultureList');
    app.transport.invoke('loadDictionaryList');
  });

  app.transport.onMessage({
    serverStatus: function(isOnline){
      isServerOnline = isOnline;
    },

    cultureList: function(data){
      Culture.all.sync(data.cultureList);
    },
    
    dictionaryList: function(data){
      data.map(Dictionary);
    }
  });  
  
  //
  // exports
  //
  module.exports = {
    Dictionary: Dictionary,
    Token: Token,
    Resource: Resource,
    DictionaryCulture: DictionaryCulture,
    Culture: Culture,

    //datasets
    dictionaryCultureSplit: dictionaryCultureSplit,
    dictionaryCultureDataset: dictionaryCultureDataset,

    resourceDictionaryCultureSplit: resourceDictionaryCultureSplit,
    resourceDictionaryCultureMerge: resourceDictionaryCultureMerge,
    resourceSplit: resourceSplit,

    tokenSplit: tokenSplit,
    tokenDataset: tokenDataset,

    resourceModifiedSplit: resourceModifiedSplit,
    resourceModifiedSubset: resourceModifiedSubset,
    resourceModifiedDataset: resourceModifiedDataset,

    usedCulturesDataset: usedCulturesDataset,

    //saveDictionary: saveDictionary,
    addCulture: function(culture){ 
      usedCulturesDataset.add([Culture(culture)]);
    },
    deleteCulture: function(culture){ 
      usedCulturesDataset.remove([Culture(culture)]);
    },
    processDictionaryData: processDictionaryData
  }
