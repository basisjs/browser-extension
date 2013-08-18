
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
      TokenParent: basis.entity.CalculateField('Token', function(token){
        return token.search(/\./) != -1 ? token.split('.').shift() : '';
      }),
      TokenKey: basis.entity.CalculateField('Token', function(token){
        return token.search(/\./) != -1 ? token.split('.').pop() : '';
      }),
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
      Value: String,
      Deleted: Boolean
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
      Title: String,
      PluralFormCount: Number,
      PluralFormComment: Array.from
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

  //var resourceDataset = new Subset({});
  var resourceSplit = new Split({
    source: Resource.all,
    wrapper: Resource,
    rule: basis.getter('data.Dictionary')
  });

  var resourceDictionaryCultureMerge = new Merge({});
  var resourceSplitByDictionaryCulture = new Split({
    source: new Subset({
      source: Resource.all,
      rule: function(object){
        return !object.data.Deleted;
      }
    }),
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
  var resourceAllSplitByToken = new Split({
    source: Resource.all,
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

  // current dictionary changed
  property_CurrentDictionary.addHandler({
    change: function(property){
      var value = property.value;

      // load dictionary data
      if (value)
      {
        //dictionaryFile.setDelegate(app.type.File.get(value));
        app.transport.invoke('loadDictionaryTokens', value);
      }

      // prepare collections
      dictionaryCultureDataset.setSource(value ? dictionaryCultureSplit.getSubset(value, true) : null);
      tokenDataset.setSource(value ? tokenSplit.getSubset(value, true) : null);

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

      adjustPlurals();
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

      adjustPlurals();
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
              token.set('Token', newToken + '.' + token.data.TokenKey, true);
          }

          var resourcesSet = resourceAllSplitByToken.getSubset([this.data.Dictionary, oldToken].join('_'));
          var resources = resourcesSet && resourcesSet.getItems() || [];
          for (var i = 0, res; res = resources[i]; i++)
            res.set('Token', newToken, true);
        }

        createEmptyResource(this);
      }
      
      if ('TokenType' in delta)
      {
        createEmptyResource(this);

        if (/object|array/.test(delta.TokenType) && /object|array/.test(this.data.TokenType))
        {
          if (this.data.TokenType == 'object' && this.data.IsPlural)
            this.set('IsPlural', false, true);

          var tokens = tokenSplitByParent.getSubset(this.data.Token, true).getItems();
          for (var i = 0, token; token = tokens[i]; i++)
            token.set('TokenType', this.data.TokenType == 'array' ? 'index' : 'key', true);
        }

        // hack: remove from list and paste again to change token node class
        this.set('Deleted', true, true);
        this.set('Deleted', false, true);
      }

      if ('IsPlural' in delta)
        adjustPlurals();      
    }
  }

  function createEmptyResource(token){
    if (/string|key|index/.test(token.data.TokenType))
    {
      var cultures = usedCulturesDataset.getItems();
      for (var i = 0, culture; culture = cultures[i]; i++)
      {
        var resourceId = { 
          Dictionary: property_CurrentDictionary.value, 
          Token: token.data.Token,
          Culture: culture.data.Culture
        }
        var resource = Resource.get(resourceId);
        if (!resource)
          Resource(resourceId);
      }    
    }
  }    

  function clearEmptyResource(token){
    if (/string|key|index/.test(token.data.TokenType))
    {    
      var cultures = usedCulturesDataset.getItems();
      for (var i = 0, culture; culture = cultures[i]; i++)
      {
        var resource = Resource.get({ 
          Dictionary: property_CurrentDictionary.value, 
          Token: token.data.Token,
          Culture: culture.data.Culture
        });

        if (resource)
        {
          if (resource.modified && resource.modified.Value === '')
            resource.destroy();
        }
      }
    }    
  }

  function adjustPlurals(){
    var cultures = usedCulturesDataset.getItems();
    var maxPluralFormCount = Math.max.apply(null, cultures.map(basis.getter('data.PluralFormCount')));

    var pluralTokens = tokenDataset.getItems().filter(function(token){
      return token.data.IsPlural;
    });

    for (var i = 0, token; token = pluralTokens[i]; i++)
    {

      for (var j = 0; j < maxPluralFormCount; j ++)
      {
        var tokenId = {
          Dictionary: token.data.Dictionary,
          Token: token.data.Token + '.' + j,
          TokenType: 'index'
        };
        var tkn = Token.get(tokenId);
        if (!tkn)
          Token(tokenId);
        else if (tkn.data.Deleted)
          tkn.set('Deleted', false);
      }
    }

    var indexTokens = tokenDataset.getItems().filter(function(token){
      return token.data.TokenType == 'index';
    });

    for (var i = 0, token; token = indexTokens[i]; i++)
    {
      var parentToken = Token.get({
        Dictionary: token.data.Dictionary,
        Token: token.data.TokenParent
      });
      
      if (parentToken && parentToken.data.IsPlural)
      {
        if (Number(token.data.TokenKey) >= maxPluralFormCount)
          token.set('Deleted', true);
        else
        {
          for (var j = 0, culture; culture = cultures[j]; j++)
          {
            var resource = Resource.get({ 
              Dictionary: property_CurrentDictionary.value, 
              Token: token.data.Token,
              Culture: culture.data.Culture,
            });
            if (resource && Number(token.data.TokenKey) >= culture.data.PluralFormCount)
              resource.set('Deleted', true);
          }
        }
      }
      else
      {
        if (token.data.Deleted)
          token.set('Deleted', false);

        for (var j = 0, culture; culture = cultures[j]; j++)
        {
          var resource = Resource.get({ 
            Dictionary: property_CurrentDictionary.value, 
            Token: token.data.Token,
            Culture: culture.data.Culture
          });
          if (resource)
            resource.set('Deleted', false);
        }
      }
    }
  }

  //
  // modified
  //
  var MODIFIED_HANDLER = {
    datasetChanged: function(object, delta){
      var modifiedDict = {};

      if (delta.inserted)
        for (var i = 0, item; item = delta.inserted[i]; i++)
        {
          item.addHandler(MODIFIED_ITEM_HANDLER);
          modifiedDict[item.data.Dictionary] = 1;
          var dict = Dictionary.get(item.data.Dictionary);
          if (dict)
            dict.set('ModificationCount', dict.data.ModificationCount + 1, true);
        }

      if (delta.deleted)
        for (var i = 0, item; item = delta.deleted[i]; i++)
        {
          item.removeHandler(MODIFIED_ITEM_HANDLER);
          modifiedDict[item.data.Dictionary] = 1;
          var dict = Dictionary.get(item.data.Dictionary);
          if (dict)
            dict.set('ModificationCount', dict.data.ModificationCount - 1, true);
        }      

      for (var dict in modifiedDict) 
        app.transport.invoke('updateDictionary', exportDictionary(dict));
    }
  }
  var MODIFIED_ITEM_HANDLER = {
    update: function(){
      app.transport.invoke('updateDictionary', exportDictionary(this.data.Dictionary));
    },
    destroy: function(){
      var dict = Dictionary.get(this.data.Dictionary);
      if (dict)
        dict.set('ModificationCount', dict.data.ModificationCount - 1, true);
    }
  }

  var tokenModified = new Subset({
    source: Token.all,
    handler: MODIFIED_HANDLER,
    ruleEvents: {
      update: true,
      rollbackUpdate: true
    },
    rule: function(object){
      return !!object.modified;
    }
  });

  var resourceModified = new Subset({
    source: Resource.all,
    handler: MODIFIED_HANDLER,
    ruleEvents: {
      update: true,
      rollbackUpdate: true
    },
    rule: function(object){
      return !!object.modified && (object.modified.Value || object.data.Value);
    }
  });  
  
  var tokenModifiedSplit = new Split({
    source: tokenModified,
    wrapper: Token,
    rule: 'data.Dictionary'
  });

  var resourceModifiedSplit = new Split({
    source: resourceModified,
    wrapper: Resource,
    rule: 'data.Dictionary'
  });  


  //
  // extend Dictionary
  //
  var eventUpdate = Dictionary.entityType.entityClass.prototype.event_update;

  Object.extend(Dictionary.entityType.entityClass.prototype, {
    save: function(){
      if (isServerOnline && this.modified && this.state != STATE.PROCESSING)
      {
        app.transport.invoke('saveDictionary', exportDictionary(this.data.Dictionary));
        this.setState(STATE.PROCESSING);
      }
    },
    reset: function(){
      this.setState(STATE.READY);
      tokenModifiedSplit.getSubset(this.data.Dictionary, true).getItems().forEach(function(token){
        if ('Token' in token.modified && !token.modified.Token)
          token.destroy();
        else
          token.rollback();
      });
      resourceModifiedSplit.getSubset(this.data.Dictionary, true).getItems().forEach(basis.getter('rollback()'));
      //adjustPlurals();
    }
  });

  function exportDictionary(dictionary){
    var tokens = tokenSplit.getSubset(dictionary, true).getItems();
    var cultures = Culture.all.getItems().map(basis.getter('data.Culture'));
    
    var tokenKeys = [];
    var tokenTypes = {};
    var cultureValues = {};
    for (var i = 0, culture; culture = cultures[i]; i++)
      cultureValues[culture] = {};

    for (var i = 0, token; token = tokens[i]; i++)
    {
      if (token.data.Deleted)
        continue;

      tokenKeys.push(token.data.Token);

      if (token.data.IsPlural)
        tokenTypes[token.data.Token] = 'plural';

      if (token.data.IsMarkup)
        tokenTypes[token.data.Token] = 'markup';

      if (/object|array/.test(token.data.TokenType))
        continue;

      var tokenParent = token.data.TokenParent;///index|key/.test(token.data.TokenType) ? token.data.Token.split('.').shift() : ''
      var tokenKey = token.data.Token.split('.').pop();

      for (var j = 0, culture; culture = cultures[j]; j++)
      {
        var resource = Resource.get({
          Dictionary: dictionary,
          Token: token.data.Token,
          Culture: culture
        });
        
        if (resource)
        {
          if (tokenParent)
          {
            if (!cultureValues[culture][tokenParent])
              cultureValues[culture][tokenParent] = token.data.TokenType == 'index' ? [] : {};

            if (token.data.TokenType == 'index')
              tokenKey = cultureValues[culture][tokenParent].length;

            cultureValues[culture][tokenParent][tokenKey] = resource.data.Value;
          }
          else
            cultureValues[culture][tokenKey] = resource.data.Value;
        }
      }
    }

    return {
      dictionary: dictionary,
      tokenKeys: tokenKeys,
      tokenTypes: tokenTypes,
      cultureValues: cultureValues
    }
  }

  //
  // process resources
  //

  function processDictionary(dictionary, tokenKeys, tokenTypes, cultureValues){
    var resources = [];
    var tokens = [];

    var tokenTypeMap = {};
    tokenKeys.forEach(function(token){
      tokenTypeMap[token] = 'string';
    });

    for (var culture in cultureValues)
    {
      for (var token in cultureValues[culture])
      {
        if (token.indexOf('.') != -1)
          continue;

        var value = cultureValues[culture][token];
        var tokenType = typeof value == 'string' ? 'string' : (Array.isArray(value) ? 'array' : 'object');

        if (!tokenTypeMap[token] || tokenTypeMap[token] == 'string')
          tokenTypeMap[token] = tokenType;

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
              if (tokenTypes[token] == 'plural')
              {
                var formCount = Culture(culture).data.PluralFormCount;
                for (var i = 0; i < formCount; i++)
                  values[i] = '';

                value.forEach(function(value, index){
                  if (index < formCount)
                    values[index] = value;
                });
              }
              else
              {
                value.forEach(function(value, index){
                  values[index] = value;
                });
              }
              break;

            case 'object':
              values = value
              break;
          }

          for (var key in values)
          {
            var tokenKey = token + (key ? '.' + key : '');
            tokenTypeMap[tokenKey] = tokenType == 'object' ? 'key' : (tokenType == 'array' ? 'index' : '');

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

    for (var token in tokenTypeMap)
    {
      var tokenType = tokenTypeMap[token];
      tokens.push({
        Dictionary: dictionary,
        Token: token,
        TokenType: tokenType,
        IsMarkup: tokenTypes[token] == 'markup',
        IsPlural: tokenTypes[token] == 'plural'
      });
    }

    resourceSplit.getSubset(dictionary, true).sync(resources);
    tokenSplit.getSubset(dictionary, true).sync(tokens);
  }

  function gatherDictionaryDelta(dictionary){
    var delta = [];
    var tokensModified = tokenModifiedSplit.getSubset(dictionary, true).getItems();
    var resourcesModified = resourceModifiedSplit.getSubset(dictionary, true).getItems();
    
    [].concat(tokensModified, resourcesModified).forEach(function(object){
      delta.push({
        type: object.entityType,
        data: basis.object.extend(object.data, object.modified),
        modified: basis.object.slice(object.data, basis.object.keys(object.modified))
      });
    });

    return delta;
  }

  function applyDictionaryDelta(delta){
    for (var i = 0, object; object = delta[i]; i++)
    {
      var obj = object.type(object.data);
      obj.update(object.modified, true);
    }
  }

  var dictionaryFile = new basis.data.DataObject({
    active: true,
    handler: {
      update: function(){
        if (!this.data.content)
          return;

        app.transport.invoke('loadDictionaryTokens', this.data.filename);
      }
    }
  });  

  property_CurrentDictionary.addLink(dictionaryFile, function(value){
    this.setDelegate(app.type.File(value));
  });

  //
  // message handlers
  //
  var isServerOnline = false;

  app.transport.ready(function(){
    app.transport.invoke('serverStatus');
    app.transport.invoke('loadCultureList');
    app.transport.invoke('loadDictionaryList');

    if (property_CurrentDictionary.value)
      app.transport.invoke('loadDictionaryTokens', property_CurrentDictionary.value);
  });

  app.transport.onMessage({
    serverStatus: function(isOnline){
      isServerOnline = isOnline;
    },

    cultureList: function(data){
      Culture.all.sync(data.cultureList);

      var plurals = [
        {
          Culture: 'ru-RU',
          PluralFormCount: 3,
          PluralFormComment: ['1, 21, 31...', '2, 3, 4, 22...', '5-20, 25...']
        },
        {
          Culture: 'en-US', 
          PluralFormCount: 2,
          PluralFormComment: ['one', 'not one']
        }
      ];
      plurals.map(Culture);
    },
    
    dictionaryList: function(data){
      data.map(Dictionary);
    },

    dictionaryTokens: function(data){
      var delta = gatherDictionaryDelta(data.dictionary);
      processDictionary(data.dictionary, data.tokenKeys, data.tokenTypes, data.cultureValues);
      applyDictionaryDelta(delta);
    },

    newDictionary: function(data){
      Dictionary(data.dictionaryName);
    },
          
    saveDictionary: function(data){
      if (data.result == 'success')
      {
        Dictionary(data.dictionary).setState(STATE.READY);
        processDictionary(data.dictionary, data.tokenKeys, data.tokenTypes, data.cultureValues);
      }
      else 
        Dictionary(data.dictionary).setState(STATE.ERROR, data.errorText);
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

    tokenSplit: tokenSplit,
    tokenDataset: tokenDataset,
    tokenSplitByParent: tokenSplitByParent,

    resourceSplit: resourceSplit,
    resourceSplitByToken: resourceSplitByToken,

    usedCulturesDataset: usedCulturesDataset,

    addCulture: function(culture){ 
      usedCulturesDataset.add([Culture(culture)]);
    },
    deleteCulture: function(culture){ 
      usedCulturesDataset.remove([Culture(culture)]);
    }
  }
