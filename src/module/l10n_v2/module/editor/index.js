
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
  var resourceSplitByToken = l10nType.resourceSplitByToken;
  var tokenDataset = l10nType.tokenDataset;
  var tokenSplitByParent = l10nType.tokenSplitByParent;


  var compositeTokenDataset = new basis.data.dataset.Subset({
    source: tokenDataset,
    rule: function(object){
      return /object|array|string/.test(object.data.TokenType) && !object.data.Deleted;
    }
  });
  var optionTokenDataset = new basis.data.dataset.Subset({
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


  var tokenTypeSwitcher = basis.fn.lazyInit(function(){
    return new basis.ui.popup.Popup({
      childNodes: new basis.ui.Node({
        autoDelegate: true,
        template: resource('template/tokenTypeSwitcher.tmpl'),
        action: {
          switch: function(event){
            var newType = event.sender.getAttribute('data-type');

            var token = this.target;
            if (token.data.TokenType != newType)
            {
              token.set('Deleted', true, true);
              token.set('TokenType', newType, true);
              token.set('Deleted', false, true);
            }
          }
        }
      }),
      handler: {
        targetChanged: function(){
          if (!this.target)
            this.hide();
        },
        show: function(){
          this.delegate.typeSwitchMode = true;
          this.delegate.updateBind('typeSwitchMode');
        },
        hide: function(){
          this.delegate.typeSwitchMode = false;
          this.delegate.updateBind('typeSwitchMode');
          this.setDelegate();
        }
      }
    });
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


  var Token = basis.ui.Node.subclass({
    typeSwitchMode: false,
    editMode: false,
    template: resource('template/newtoken.tmpl'),

    binding: {
      editMode: 'editMode',
      title: 'data:Token',
      type: 'data:TokenType',
      isMarkup: 'data:IsMarkup',
      isPlural: 'data:IsPlural',
      typeSwitchMode: 'typeSwitchMode'
    },

    action: {
      edit: function(){
        if (this.data.TokenType != 'index')
          this.setEditMode(true);
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
      },
      togglePlural: function(){
        this.target.set('IsPlural', !this.data.IsPlural, true);
      },
      toggleMarkup: function(){
        this.target.set('IsMarkup', !this.data.IsMarkup, true);
      },
      switchType: function(){
        tokenTypeSwitcher().setDelegate(this);
        tokenTypeSwitcher().show(this.tmpl.switcher);
      },
      delete: function(){
        if (this.target.modified && this.target.modified.Token === '')
          this.target.destroy();
        else
          this.target.set('Deleted', true, true);
      }
    },
    submit: function(){
      var newToken = (/index|key/.test(this.data.TokenType) ? this.data.TokenParent + '.' : '') + this.tmpl.editor.value;

      var token = l10nType.Token.get({
        Dictionary: this.data.Dictionary,
        Token: newToken
      });

      if (token)
      {
        if (token.data.Deleted)
          token.set('Deleted', false, true);

        this.target.destroy();
        return;
      }

      this.target.set('Token', newToken, true);
      this.setEditMode(false);
    },
    reset: function(){
      var tokenKey = this.data.Token.split('.').pop();
      if (tokenKey)
        this.setEditMode(false);
      else
        this.target.destroy();
    },
    setEditMode: function(editMode){
      this.editMode = editMode;
      this.updateBind('editMode');
      this.tmpl.editor.value = this.data.Token.split('.').pop();
      this.tmpl.editor.focus();
    }
  });

  var OptionToken = Token.subclass({
    binding: {
      title: {
        events: 'update',
        getter: function(object){
          return object.data.Token.split('.').pop();
        }
      }
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
        this.setDataSource(resourceSplitByToken.getSubset([this.data.Dictionary, this.data.Token].join('_'), true))
    }
  });

  var ComplexToken = Token.subclass({
    sorting: 'data.Token',
    template: resource('template/complexToken.tmpl'),
    childClass: OptionToken,
    action: {
      addKey: function(){
        if (this.data.TokenType == 'object')
        {
          var token = l10nType.Token({
            Dictionary: this.data.Dictionary,
            Token: '',
            TokenParent: this.data.Token,
            TokenType: 'key'
          });

          var tokenNode = this.childNodes.search(token, 'delegate');
          tokenNode.setEditMode(true);
        }
        else
        {
          var newToken = this.data.Token + '.' + (this.lastChild ? Number(this.lastChild.data.Token.split('.').pop()) + 1 : 0);
          
          var token = l10nType.Token.get({
            Dictionary: this.data.Dictionary,
            Token: newToken,
            TokenParent: this.data.Token,
            TokenType: 'index'
          });

          if (token)
            token.set('Deleted', false, true);
          else
          {
            var token = l10nType.Token({
              Dictionary: this.data.Dictionary,
              Token: '',
              TokenType: 'index'
            });
            
            token.update({
              Token: newToken,
              TokenParent: this.data.Token
            }, true);
          }
        }
      }      
    },
    event_update: function(object, delta){
      Token.prototype.event_update.call(this, object, delta);
      this.setDataSource(tokenSplitByParent.getSubset(this.data.Token, true));
    },
    init: function(){
      Token.prototype.init.call(this);
      this.setDataSource(tokenSplitByParent.getSubset(this.data.Token, true));
    }
  });

  var IndexToken = OptionToken.subclass({
    binding: {
      title: 'index'
    }    
  });

  var ArrayToken = ComplexToken.subclass({
    childClass: IndexToken,

    event_childNodesModified: function(object, delta){
      ComplexToken.prototype.event_childNodesModified.apply(this, arguments);
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        child.index = i;
        child.updateBind('title');
      }
    }
  });

  var TOKEN_TYPE_CLASS = {
    'string': OptionToken,
    'object': ComplexToken,
    'array': ArrayToken
  }

  //
  // token editor
  //

  /*var TokenEditor = basis.ui.Node.subclass({
    template: resource('template/token.tmpl'),

    binding: {
      title: 'data:Token',
      isMarkup: 'data:IsMarkup'
    },

    action: {
      toggleMarkup: function(){
        this.target.set('IsMarkup', !this.data.IsMarkup);
      },
      delete: function(object){
        this.target.set('Deleted', true, true);
      }
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
  });*/

  //
  // composite token editor
  //
  /*var OptionTokenEditor = TokenEditor.subclass({
    binding: {
      type: 'data:TokenType',
      title: {
        events: 'update',
        getter: function(object){
          return object.data.Token.split('.').pop();
        }
      }
    }
  });

  var IndexTokenEditor = OptionTokenEditor.subclass({
    template: resource('template/indexToken.tmpl')
  });
  
  var KeyTokenEditor = OptionTokenEditor.subclass({
    editMode: false,
    template: resource('template/keyToken.tmpl'),
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
      var newToken = this.data.TokenParent + '.' + this.tmpl.editor.value;

      var token = l10nType.Token.get({
        Dictionary: this.data.Dictionary,
        Token: newToken
      });

      if (token)
      {
        if (token.data.Deleted)
          token.set('Deleted', false, true);

        this.target.destroy();
        return;
      }

      var resourcesSet = l10nType.resourceSplit.getSubset([this.data.Dictionary, this.data.Token].join('_'));
      var resources = resourcesSet && resourcesSet.getItems() || [];
      for (var i = 0, res; res = resources[i]; i++)
        res.set('Token', newToken, true);
      
      this.target.set('Token', newToken, true);
      this.setEditMode(false);
    },
    reset: function(){
      var tokenKey = this.data.Token.split('.').pop();
      if (tokenKey)
        this.setEditMode(false);
      else
        this.target.destroy();
    },
    setEditMode: function(editMode){
      this.editMode = editMode;
      this.updateBind('editMode');
      this.tmpl.editor.value = this.data.Token.split('.').pop();
      this.tmpl.editor.focus();
    }
  });*/

  //
  // composite token group
  //
  /*var CompositeToken = basis.ui.PartitionNode.subclass({
    template: resource('template/compositeToken.tmpl'),
    binding: {
      type: 'data:TokenType',
      title: 'data:Token',
      isPlural: 'data:IsPlural'
    },
    action: {
      addKey: function(){
        var token = l10nType.Token({
          Dictionary: this.data.Dictionary,
          Token: this.data.Token + '.' + (this.data.TokenType == 'array' ? this.nodes.length : ''),
          TokenParent: this.data.Token,
          TokenType: this.data.TokenType == 'object' ? 'key' : 'index'
        });
        
        if (token.data.Deleted)
          token.set('Deleted', false, true);

        if (this.data.TokenType == 'object')
        {
          var tokenNode = dictionaryEditor.childNodes.search(token, 'delegate');
          tokenNode.setEditMode(true);
        }
      },
      togglePlural: function(){
        this.target.set('IsPlural', !this.data.IsPlural);
      },
      delete: function(){
        var items = basis.array.from(this.nodes);
        for (var i = 0, item; item = items[i]; i++)
          item.target.set('Deleted', true, true);

        this.target.set('Deleted', true, true);
      }
    }
  });*/

  /*var TOKEN_TYPE_CLASS = {
    string: TokenEditor,
    key: KeyTokenEditor,
    index: IndexTokenEditor
  }*/

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

    dataSource: compositeTokenDataset,
    sorting: 'data.Token',

    childClass: Token,
    childFactory: function(config){
      var childClass = TOKEN_TYPE_CLASS[config.delegate.data.TokenType];
      return new childClass(config);
    },

    /*grouping: {
      dataSource: compositeTokenDataset,
      groupGetter: function(object){
        return l10nType.Token({
          Dictionary: object.data.Dictionary,
          Token: object.data.TokenParent || object.data.Token
        })
      },
      childClass: CompositeToken,
      sorting: 'data.Token'
    },*/

    selectResource: function(resource){
      var tokenItem = this.childNodes.search(resource.data.Token, 'data.Token');
      if (tokenItem)
      {
        tokenItem.select();

        var resourceNode = tokenItem.childNodes.search(resource, 'delegate');
        if (resourceNode)
        {
          resourceNode.satellite.memo.focus();
          return resourceNode
        }
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
