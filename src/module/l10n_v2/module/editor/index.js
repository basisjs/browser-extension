
  basis.require('basis.dom');
  basis.require('basis.ui');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data.dataset');
  basis.require('app.ext.livememo');


  var getter = basis.getter;
  var Event = basis.dom.event;
  var livememo = app.ext.livememo;
  var l10nType = resource('../../type.js').fetch();

  var Culture = l10nType.Culture;
  var Dictionary = l10nType.Dictionary;
  var DictionaryCulture = l10nType.DictionaryCulture;
  var usedCulturesDataset = l10nType.usedCulturesDataset;
  var dictionaryCultureDataset = l10nType.dictionaryCultureDataset;
  var resourceSplit = l10nType.resourceSplit;
  var tokenDataset = l10nType.tokenDataset;

  var editorTokenDataset = new basis.data.dataset.Subset({
    source: tokenDataset,
    rule: function(object){
      return /string|index|key/.test(object.data.TokenType) && !object.data.Deleted;
    }
  });

  var KEY_S = 'S'.charCodeAt(0);


  //header
  var addCulturePanel = new basis.ui.Node({
    template: resource('template/addCulturePanel.tmpl'),

    dataSource: new basis.data.dataset.Subtract({
      minuend: Culture.all,
      subtrahend: usedCulturesDataset
    }),

    childClass: {
      template: resource('template/addCulturePanelItem.tmpl'),

      binding: {
        culture: 'data:Culture',
        spriteX: {
          events: 'update delegateChanged',
          getter: function(object){
            var value = object.data.Culture;
            if (value)
            {
              var code = value.split('-')[1];
              return code ? 16 * (code.charCodeAt(0) - 65) : 1000;
            }
          }
        },
        spriteY: {
          events: 'update delegateChanged',
          getter: function(object){
            var value = object.data.Culture;
            if (value)
            {
              var code = value.split('-')[1];
              return code ? 11 * (code.charCodeAt(1) - 65) : 1000;
            }
          }
        }
      },

      action: {
        addCulture: function(){
          if (!this.isDisabled())
            l10nType.addCulture(this.data.Culture);
        }
      }
    }
  });

  usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      if (object.itemCount > 4)
        this.disable();
      else
        this.enable();
    }
  }, addCulturePanel);


  var dictionaryEditorHeader = new basis.ui.Node({
    template: resource('template/header.tmpl'), 
    binding: {
      addCulturePanel: 'satellite:'
    },

    satellite: {
      addCulturePanel: addCulturePanel
    },

    dataSource: dictionaryCultureDataset,
    sorting: getter('data.Position'),

    childClass: {
      template: resource('template/headerItem.tmpl'), 
      binding: {
        title: 'data:Culture',
        isBase: {
          events: 'update',
          getter: function(object){
            return object.data.Culture == 'base' ? 'isBase' : '';
          }
        },
        spriteX: {
          events: 'update delegateChanged',
          getter: function(object){
            var value = object.data.Culture;
            if (value)
            {
              var code = value.split('-')[1];
              return code ? 16 * (code.charCodeAt(0) - 65) : 1000;
            }
          }
        },
        spriteY: {
          events: 'update delegateChanged',
          getter: function(object){
            var value = object.data.Culture;
            if (value)
            {
              var code = value.split('-')[1];
              return code ? 11 * (code.charCodeAt(1) - 65) : 1000;
            }
          }
        }
      },
      action: {
        deleteCulture: function(event){
          l10nType.deleteCulture(this.data.Culture);
        } 
      }
    }
  });

    
  //columns
  var columnsContainer = new basis.ui.Node({
    template: resource('template/columnBackgroundContainer.tmpl'),
    
    dataSource: dictionaryCultureDataset,
    sorting: 'data.Position',

    childClass: {
      template: resource('template/column.tmpl')
    },

    handler: {
      childNodesModified: livememo.syncAll
    }
  });


  //
  // resource editor
  //

  var ResourceEditor = basis.ui.Node.subclass({
    template: resource('template/resource.tmpl'),

    satelliteConfig: {
      memo: {
        instanceOf: livememo.LiveMemo.subclass({
          autoDelegate: true,
          templateUpdate: function(){
            if (this.data.Culture == 'base')
              this.disable();
          },
          action: {
            focus: function(event){
              livememo.LiveMemo.prototype.action.focus.call(this, event);
              basis.cssom.classList(this.owner.element).remove('empty');
              this.owner.parentNode.select();
            },
            blur: function(event){
              livememo.LiveMemo.prototype.action.blur.call(this, event);
              var memo = Event.sender(event);
              this.owner.parentNode.unselect();
              this.target.set('Value', this.value, true);        
            },
            keydown: function(event){
              livememo.LiveMemo.prototype.action.keydown.call(this, event);

              var key = Event.key(event);
              if (key == Event.KEY.F2 || ((event.ctrlKey || event.metaKey) && key == KEY_S))
              {
                Event.kill(event);
                Dictionary(this.data.Dictionary).save();
              }
            },
            keyup: function(event){ // live update
              livememo.LiveMemo.prototype.action.keyup.call(this, event);
              this.action.change.call(this, event);
            },
            change: function(){
              livememo.LiveMemo.prototype.action.change.call(this, event);

              var value = this.value;
              var tokenName = this.data.Token;
              var dictionaryName = this.data.Dictionary;
              var culture = this.data.Culture;

              // set resource value with modified
              this.target.set('Value', value, true);
            }
          }
        })
      }
    },

    binding: {
      memo: 'satellite:',
      empty: {
        events: 'update',
        getter: function(node){
          return node.data.Value ? '' : 'empty';
        }
      }
    },

    templateUpdate: function(object, delta){
      this.satellite.memo.setText(this.data.Value.replace(/\n/g, "\\n").replace(/\r/g, "\\r"));
    }
  });

  //
  // token editor
  //

  var TokenEditor = basis.ui.Node.subclass({
    template: resource('template/token.tmpl'),

    binding: {
      title: 'data:Token'
    },

    childClass: ResourceEditor,

    grouping: {
      groupGetter: function(item){ 
        return DictionaryCulture({
          Culture: item.data.Culture,
          Dictionary: item.data.Dictionary
        });
      },

      dataSource: dictionaryCultureDataset,
      sorting: getter('data.Position'),
      
      childClass: {
        template: resource('template/resourceGroup.tmpl')
      }
    },

    templateUpdate: function(object, delta){
      if (this.data.Dictionary)
        this.setDataSource(resourceSplit.getSubset([this.data.Dictionary, this.data.Token].join('_'), true))
    }
  });

  //
  // composite token editor
  //
  
  var CompositeTokenEditor = TokenEditor.subclass({
    editMode: false,
    template: resource('template/compositeToken.tmpl'),
    binding: {
      editMode: 'editMode',
      type: 'data:TokenType',
      title: {
        events: 'update',
        getter: function(object){
          return object.data.Token.split('.').pop();
        }
      }
    },
    action: {
      edit: function(){
        this.setEditMode(true);
      },
      delete: function(object){
        this.remove();
      },
      submit: function(event){
        this.submit();
        event.die();
      },
      cancel: function(){
        this.reset();
      },
      keyup: function(event){
        if (event.key == basis.dom.event.KEY.ESC)
          this.reset();

        if (event.key == basis.dom.event.KEY.ENTER)
          this.submit();
      }
    },
    submit: function(){
      var tokenKey = this.data.TokenParent + '.' + this.tmpl.editor.value;
      var token = l10nType.Token.get({
        Dictionary: this.data.Dictionary,
        Token: tokenKey
      });

      if (token)
        this.remove();
      else
      {
        var resources = l10nType.resourceSplit.getSubset([this.data.Dictionary, this.data.Token].join('_'), true).getItems();
        for (var i = 0, res; res = resources[i]; i++)
          res.set('Token', tokenKey, true);
        
        this.target.set('Token', tokenKey, true);
      }

      this.setEditMode(false);
    },
    reset: function(){
      this.tmpl.editor.value = this.data.Token.split('.').pop();
      this.setEditMode(false);
    },
    remove: function(){
      this.target.set('Deleted', true, true);
    },
    setEditMode: function(editMode){
      this.editMode = editMode;
      this.updateBind('editMode');
      this.tmpl.editor.value = this.data.Token.split('.').pop();
      this.tmpl.editor.focus();
    }
  });

  //
  // composite token group
  //
  var CompositTokenGroup = basis.ui.PartitionNode.subclass({
    template: resource('template/tokenGroup.tmpl'),
    binding: {
      type: 'data:TokenType',
      title: 'data:Token'
    },
    action: {
      addKey: function(){
        var res = l10nType.Token({
          Dictionary: this.data.Dictionary,
          Token: this.data.Token + '.newKey',
          TokenParent: this.data.Token,
          TokenType: 'key'
        });

        var cultures = usedCulturesDataset.getItems();
        for (var i = 0; i < cultures.length; i++)
        {
          l10nType.Resource({
            Dictionary: this.data.Dictionary,
            Token: this.data.Token + '.newKey',
            Culture: cultures[i].data.Culture
          });
        }
      }
    }
  });

  //
  // editor
  //
  var dictionaryEditor = new basis.ui.Node({
    active: true,
    template: resource('template/editor.tmpl'),
    binding: {
      header: dictionaryEditorHeader,
      columns: columnsContainer
    },

    selection: true,

    dataSource: editorTokenDataset,
    sorting: 'data.Token',

    childClass: TokenEditor,
    childFactory: function(config){
      var childClass = config.delegate.data.TokenType == 'string' ? TokenEditor : CompositeTokenEditor;
      return new childClass(config);
    },

    grouping: {
      groupGetter: function(object){
        return l10nType.Token({
          Dictionary: object.data.Dictionary,
          Token: object.data.TokenParent || object.data.Token
        })
      },
      childClass: CompositTokenGroup,
      sorting: 'data.Token'
    },

    selectResource: function(resource){
      var tokenItem = this.childNodes.search(resource.data.Token, 'data.Token');
      if (tokenItem)
      {
        tokenItem.select();

        var resourceNode = tokenItem.childNodes.search(resource, 'delegate');
        if (resourceNode)
          resourceNode.satellite.memo.focus();
      }
      else
        this.currentResource = resource;
    },
    handler: {
      childNodesModified: function(){
        if (this.currentResource)
        {
          this.selectResource(this.currentResource);
          this.currentResource = null;
        }
      }
    }
  });

  usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      dictionaryEditor.tmpl.set('columnCount', object.itemCount + 1);
    }
  });

  module.exports = dictionaryEditor;
