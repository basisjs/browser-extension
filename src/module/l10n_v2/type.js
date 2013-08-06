
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
      ModificationCount: Number
    }
  });

  var Token = new EntityType({
    name: 'Token',
    fields: {
      Dictionary: nsEntity.StringId,
      Token: nsEntity.StringId,
      TokenParent: String,
      TokenKey: String,
      TokenType: String,
      IsMarkup: Boolean,
      IsPlural: Boolean,
      Deleted: Boolean
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
  /*var resourceDictionarySplit = new Split({
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
  });*/

  // dictionary culture
  var dictionaryCultureSplit = new Split({
    source: DictionaryCulture.all,
    wrapper: DictionaryCulture,
    rule: getter('data.Dictionary')
  });
  var dictionaryCultureDataset = new Subset({
    rule: basis.fn.$true
  });

  //var resourceDataset = new Subset({});
  var resourceSplit = new Split({
    source: Resource.all,
    wrapper: Resource,
    rule: basis.getter('data.Dictionary')
  });

  var resourceDictionaryCultureMerge = new Merge({});
  var resourceSplitByDictionaryCulture = new Split({
    source: Resource.all,
    wrapper: Resource,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Culture;
    }
  });
  var resourceSplitByToken = new Split({
    source: resourceDictionaryCultureMerge,
    wrapper: Resource,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Token;
    }
  });

  var tokenDataset = new Subset({});
  var tokenSplit = new Split({
    source: Token.all,
    rule: getter('data.Dictionary'),
    wrapper: Token
  });
  var tokenSplitByParent = new Split({
    wrapper: Token,
    rule: getter('data.TokenParent'),
    source: new Subset({
      source: tokenDataset,
      rule: function(object){
        return !object.data.Deleted;
      }
    })
  });
  

  //
  // modified
  //
  var MODIFIED_HANDLER = {
    datasetChanged: function(object, delta){
      if (delta.inserted)
        for (var i = 0, item; item = delta.inserted[i]; i++)
        {
          item.addHandler(MODIFIED_ITEM_HANDLER)
          var dict = Dictionary.get(item.data.Dictionary);
          if (dict)
            dict.set('ModificationCount', dict.data.ModificationCount + 1, true);
        }

      if (delta.deleted)
        for (var i = 0, item; item = delta.deleted[i]; i++)
        {
          item.removeHandler(MODIFIED_ITEM_HANDLER);
          
          var dict = Dictionary.get(item.data.Dictionary);
          if (dict)
            dict.set('ModificationCount', dict.data.ModificationCount - 1, true);
        }      
    }
  }
  var MODIFIED_ITEM_HANDLER = {
    destroy: function(){
      var dict = Dictionary.get(this.data.Dictionary);
      if (dict)
        dict.set('ModificationCount', dict.data.ModificationCount - 1, true);
    }
  }

  var tokenModified = new Subset({
    source: Token.all,
    handler: MODIFIED_HANDLER,
    rule: function(object){
      return !!object.modified;
    },
  });

  var resourceModified = new Subset({
    source: Resource.all,
    handler: MODIFIED_HANDLER,
    rule: function(object){
      return !!object.modified;
    }
  });

  // observe resource changes datasets
  /*var resourceModifiedSubset = new Subset({ 
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
  });*/

  //
  // extend Dictionary
  //
  var isServerOnline = false;

  Object.extend(Dictionary.entityType.entityClass.prototype, {
    save: function(){
      if (isServerOnline && this.modified && this.state != STATE.PROCESSING)
      {
        /*var modifiedCultures = {};
        var modifiedResources = resourceModifiedSplit.getSubset(this.data.Dictionary, true).getItems();
        for (var i = 0, resource; resource = modifiedResources[i]; i++) 
          modifiedCultures[resource.data.Culture] = true;

        var cultureList = [];
        for (var i in modifiedCultures)
          cultureList.push(i);*/

        app.transport.invoke('saveDictionary', this.data.Dictionary, this.data.Location, cultureList);
        this.setState(STATE.PROCESSING);
      }
    },
    reset: function(){
      this.setState(STATE.READY);
      /*resourceModifiedSplit.getSubset(this.data.Dictionary, true).getItems().forEach(function(token){
        token.rollback();
      });*/
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
  // dynamic
  //
  var property_CurrentDictionary = new basis.data.property.Property(null);

  var dictionaryFile = new basis.data.DataObject({
    active: true,
    handler: {
      update: function(){
        processDictionaryFile(this.data.filename, JSON.parse(this.data.content));
      }
    }
  });

  // current dictionary changed
  property_CurrentDictionary.addHandler({
    change: function(property){
      var value = property.value;

      // load dictionary data
      if (value)
      {
        dictionaryFile.setDelegate(app.type.File(value));
        app.transport.invoke('loadDictionaryTokens', value);      
      }

      // prepare collections
      dictionaryCultureDataset.setSource(value ? dictionaryCultureSplit.getSubset(value, true) : null);
      tokenDataset.setSource(value ? tokenSplit.getSubset(value, true) : null);
      //resourceDataset.setSource(value ? resourceSplit.getSubset(value, true) : '')
      resourceDictionaryCultureMerge.clear();      

      if (value)
      {
        var cultures = usedCulturesDataset.getItems();

        for (var i = 0, culture; culture = cultures[i]; i++)
        {
          DictionaryCulture({
            Dictionary: value,
            Culture: culture.data.Culture,
            Position: i
          });

          resourceDictionaryCultureMerge.addSource(resourceSplitByDictionaryCulture.getSubset(value + '_' + culture.data.Culture, true));        
        }
      }
    }
  });

  usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      var tokens = tokenDataset.getItems();

      if (delta.inserted)
      {
        for (var i = 0, token; token = tokens[i]; i++)
          createEmptyResource(token);

        for (var i = 0, culture; culture = delta.inserted[i]; i++)
          resourceDictionaryCultureMerge.addSource(resourceSplitByDictionaryCulture.getSubset(property_CurrentDictionary.value + '_' + culture.data.Culture, true));
      }
        
      if (delta.deleted)
      {
        for (var i = 0, token; token = tokens[i]; i++)
          clearEmptyResource(token);

        for (var i = 0, culture; culture = delta.deleted[i]; i++)
          resourceDictionaryCultureMerge.removeSource(resourceSplitByDictionaryCulture.getSubset(property_CurrentDictionary.value + '_' + culture.data.Culture, true));
      }
    }
  });

  tokenDataset.addHandler({
    datasetChanged: function(object, delta){
      if (delta.inserted)
      {
        for (var i = 0, token; token = delta.inserted[i]; i++)
        {
          token.addHandler(TOKEN_HANDLER);
          createEmptyResource(token);
        }
      }

      if (delta.deleted)
        for (var i = 0, token; token = delta.deleted[i]; i++)
        {
          token.removeHandler(TOKEN_HANDLER);
          clearEmptyResource(token);
        }
    }
  });

  var TOKEN_HANDLER = {
    destroy: function(){
      clearEmptyResource(this);
    },
    update: function(object, delta){
      if ('Token' in delta)
      {
        var newToken = this.data.Token;
        var oldToken = delta.Token;
        if (oldToken)
        {
          if (/object|array/.test(this.data.TokenType))
          {
            var tokens = tokenSplitByParent.getSubset(oldToken, true).getItems();
            for (var i = 0, token; token = tokens[i]; i++)
            {
              token.update({
                TokenParent: newToken,
                Token: newToken + '.' + token.data.Token.split('.').pop()
              }, true);
            }
          }

          var resourcesSet = resourceSplitByToken.getSubset([this.data.Dictionary, oldToken].join('_'));
          var resources = resourcesSet && resourcesSet.getItems() || [];
          for (var i = 0, res; res = resources[i]; i++)
            res.set('Token', newToken, true);
        }

        createEmptyResource(this);
      }

      if ('TokenType' in delta && this.data.TokenType == 'string')
        createEmptyResource(this);
    }
  }

  function createEmptyResource(token){
    var cultures = usedCulturesDataset.getItems();
    for (var i = 0, culture; culture = cultures[i]; i++)
    {
      if (/string|key|index/.test(token.data.TokenType))
        Resource({ 
          Dictionary: property_CurrentDictionary.value, 
          Token: token.data.Token,
          Culture: culture.data.Culture
        });
    }    
  }    

  function clearEmptyResource(token){
    var cultures = usedCulturesDataset.getItems();
    for (var i = 0, culture; culture = cultures[i]; i++)
    {
      if (/string|key|index/.test(token.data.TokenType))
      {
        var resource = Resource({ 
          Dictionary: property_CurrentDictionary.value, 
          Token: token.data.Token,
          Culture: culture.data.Culture
        });

        if (resource.modified && resource.modified.Value === '')
          resource.destroy();
      }
    }    
  }

  //
  //load resource for current dictionary and added culture
  //
  /*var resourcesLoaded = {};
  
  dictionaryCultureDataset.addHandler({
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
  });*/

  //
  // get dictionaries list from appProfile
  //
  /*var appProfile = app.type.AppProfile();

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

      processDictionaryData(dictName, data[dictName].tokens);
    }
  }*/

  //
  // process resources
  //
  /*function processDictionaryData(dictionary, culture, data){
    var resource;
    var tokens = [];
    var resources = [];    
    
    for (var token in data)
    {
      var value = data[token];
      var tokenType = Array.isArray(value) ? 'array' : (typeof value == 'object' ? 'object' : 'string');

      var existingToken = Token.get({
        Dictionary: dictionary, 
        Token: token
      });

      if (!existingToken || existingToken.data.TokenType == 'string')
      {
        tokens.push({ 
          Dictionary: dictionary, 
          Token: token,
          TokenType: tokenType
        });
      }

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

    //tokenSplit.getSubset(dictionary, true).sync(tokens);
    //resourceDictionarySplit.getSubset(dictionary, true).sync(resources);
    tokens.map(Token);
    resources.map(Resource);
  }  */

  //
  // process resources
  //
  function processDictionaryFile(dictionary, data){
    if (!data)
      return;

    var resources = [];
    var tokens = [];

    var tokenTypes = data['_meta'] && data['_meta'].type;

    for (var culture in data){
      if (/^_/.test(culture))
        continue;

      for (var token in data[culture])
      {
        var value = data[culture][token];
        var tokenType = typeof value == 'string' ? 'string' : 
          (Array.isArray(value) ? 'array' : 'object');

        tokens.push({ 
          Dictionary: dictionary, 
          Token: token,
          TokenType: tokenType,
          IsMarkup: tokenTypes[token] == 'markup',
          IsPlural: tokenTypes[token] == 'plural'
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
            var tokenKey = token + (key ? '.' + key : '');
            
            tokens.push({ 
              Dictionary: dictionary, 
              Token: tokenKey,
              TokenParent: key ? token : '',
              TokenType: tokenType == 'object' ? 'key' : (tokenType == 'array' ? 'index' : ''),
              IsMarkup: tokenTypes[tokenKey] == 'markup'
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
    resourceSplit.getSubset(dictionary, true).sync(resources);
  }

  function processDictionaryTokens(){

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
    },

    dictionaryTokens: function(data){
      processDictionaryTokens(data.dictionaryName, data.tokens);
    },

    dictionaryResource: function(data){
      processDictionaryData(data.dictionaryName, data.culture, data.tokens);
    },
    
    newDictionary: function(data){
      Dictionary(data.dictionaryName);
    },
          
    saveDictionary: function(data){
      if (data.result == 'success')
      {
        Dictionary(data.dictionaryName).setState(STATE.READY);
        processDictionaryData(data.dictionaryName, data.tokens);
      }
      else 
        Dictionary(data.dictionaryName).setState(STATE.ERROR, data.errorText);
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

    currentDictionary: property_CurrentDictionary,

    //datasets
    dictionaryCultureSplit: dictionaryCultureSplit,
    dictionaryCultureDataset: dictionaryCultureDataset,

    /*resourceDictionaryCultureSplit: resourceDictionaryCultureSplit,
    resourceDictionaryCultureMerge: resourceDictionaryCultureMerge,*/

    tokenSplit: tokenSplit,
    tokenDataset: tokenDataset,
    tokenSplitByParent: tokenSplitByParent,

    /*resourceModifiedSplit: resourceModifiedSplit,
    resourceModifiedSubset: resourceModifiedSubset,
    resourceModifiedDataset: resourceModifiedDataset,*/
    resourceSplit: resourceSplit,
    resourceSplitByToken: resourceSplitByToken,

    usedCulturesDataset: usedCulturesDataset,

    //saveDictionary: saveDictionary,
    addCulture: function(culture){ 
      usedCulturesDataset.add([Culture(culture)]);
    },
    deleteCulture: function(culture){ 
      usedCulturesDataset.remove([Culture(culture)]);
    },
    processDictionaryFile: processDictionaryFile,
    processDictionaryTokens: processDictionaryTokens
  }
