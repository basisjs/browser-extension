
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
    template: resource('template/dictionaryEditorHeader.tmpl'), 
    binding: {
      addCulturePanel: 'satellite:'
    },

    satellite: {
      addCulturePanel: addCulturePanel
    },

    dataSource: dictionaryCultureDataset,
    sorting: getter('data.Position'),

    childClass: {
      template: resource('template/dictionaryEditorHeaderItem.tmpl'), 
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
  // Dictionary Editor Item
  //
  var DictionaryEditorItem = basis.ui.Node.subclass({
    template: resource('template/dictionaryEditorItem.tmpl'),

    binding: {
      title: getter('data.Token')
    },

    childClass: {
      template: resource('template/dictionaryEditorItemResource.tmpl'),

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

                this.target.set('Value', value, true);

                app.transport.call('setTokenCultureValue', dictionaryName, tokenName, culture, value);
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
    },

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
        template: resource('template/dictionaryEditorItemResourceGroup.tmpl')
      }
    },

    templateUpdate: function(object, delta){
      if (this.data.Dictionary)
        this.setDataSource(resourceSplit.getSubset([this.data.Dictionary, this.data.Token].join('_'), true))
    }
  });

  //result
  var dictionaryEditor = new basis.ui.Node({
    template: resource('template/dictionaryEditor.tmpl'),
    binding: {
      header: dictionaryEditorHeader,
      columns: columnsContainer
    },

    selection: true,

    dataSource: tokenDataset,
    sorting: 'data.Position',
    childClass: DictionaryEditorItem,

    selectResource: function(tokenName, culture){
      var tokenItem = this.childNodes.search(tokenName, 'data.Token');
      if (tokenItem)
      {
        tokenItem.select();
        var resourceNode = tokenItem.childNodes.search(culture, 'data.Culture');
        if (resourceNode)
          resourceNode.satellite.memo.focus();
      }
    }
  });

  usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      dictionaryEditor.tmpl.set('columnCount', object.itemCount + 1);
    }
  });

  module.exports = dictionaryEditor;
