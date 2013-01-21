
  basis.require('basis.ui');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data.dataset');
  basis.require('app.ext.livememo');

  var getter = Function.getter;

  var Event = basis.dom.event;

  var livememo = app.ext.livememo;
  var l10nType = resource('type.js')();


  var Culture = l10nType.Culture;
  var Dictionary = l10nType.Dictionary;
  var DictionaryCulture = l10nType.DictionaryCulture;
  var usedCulturesDataset = l10nType.usedCulturesDataset;
  var dictionaryCultureDataset = l10nType.dictionaryCultureDataset;
  var resourceSplit = l10nType.resourceSplit;
  var tokenDataset = l10nType.tokenDataset;

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
        addCulture: function(event){
          //addCulture(this.data.culture);
          if (!this.isDisabled())
            l10nType.addCulture(this.data.Culture);
          //usedCulturesDataset.add([Culture(this.data.Culture)]);
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

    satellite: {
      addCulturePanel: addCulturePanel
    },

    binding: {
      addCulturePanel: 'satellite:'
    },

    sorting: getter('data.Position'),

    dataSource: dictionaryCultureDataset,
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
        even: {
          events: 'update',
          getter: function(object){
            return object.data.Position % 2 == 0 ? 'even' : '';
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
          //deleteCulture(this.data.Culture, this.data.Dictionary);
          //usedCulturesDataset.remove([app.type.l10n.Culture(this.data.Culture)]);
        } 
      }
    }
  });

    
  //columns
  var columnsContainer = new basis.ui.Node({
    id: 'ColumnBackgroundContainer',

    cssClassName: 'Table-Row',
    
    childClass: {
      template: resource('template/column.tmpl'),
      binding: {
        even: {
          events: 'update',
          getter: function(object){
            return object.data.Position % 2 == 0 ? 'even' : '';
          } 
        }
      }
    },
    dataSource: dictionaryCultureDataset,
    sorting: 'data.Position',
    handler: {
      childNodesModified: function(){
        livememo.updateMemos();
      }
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
            autoDelegate: basis.dom.wrapper.DELEGATE.OWNER,
            event_ownerChanged: function(oldOwner){
              livememo.LiveMemo.prototype.event_ownerChanged.call(this, oldOwner);
              if (this.owner && this.owner.data.Culture == 'base')
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
                this.owner.target.set('Value', this.tmpl.memo.value, true);        
              },
              keyup: function(event){
                livememo.LiveMemo.prototype.action.keyup.call(this, event);

                this.action.change.call(this, event);
                if (Event.key(event) == Event.KEY.F2)
                {
                  Dictionary(this.data.Dictionary).save();
                  //saveDictionary(property_CurrentDictionary.value);
                  
                }
              },
              change: function(){
                livememo.LiveMemo.prototype.action.change.call(this, event);

                var value = this.tmpl.memo.value;

                var tokenName = this.data.Token;
                var dictionaryName = this.data.Dictionary;
                var culture = this.data.Culture;

                this.owner.target.set('Value', value, true);

                app.transport.call('setTokenCultureValue', dictionaryName, tokenName, culture, value)  ;
              }
            }
          })
        }
      },

      binding: {
        memo: 'satellite:',
        empty: {
          events: 'update',
          getter: function(object){
            return object.data.Value ? '' : 'empty';
          }
        }
      },

      templateUpdate: function(object, delta){
        this.satellite.memo.setText(this.data.Value.replace(/\n/g, "\\n").replace(/\r/g, "\\r"));
      }
    },

    grouping: {
      groupGetter: function(item){ 
        return DictionaryCulture({ Culture: item.data.Culture, Dictionary: item.data.Dictionary });
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
    selection: {},
    template: resource('template/dictionaryEditor.tmpl'),

    satellite: {
      header: dictionaryEditorHeader,
      columns: columnsContainer
    },

    binding: {
      header: 'satellite:',
      columns: 'satellite:'
    },

    dataSource: tokenDataset,
    childClass: DictionaryEditorItem,
    sorting: 'data.Position'
  });

  usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      dictionaryEditor.tmpl.set('columnCount', object.itemCount + 1);
    }
  });
  
  /*dictionaryCultureDataSource.addHandler({
    datasetChanged: function(object, delta){
      var items = object.getItems();
      var oldCount = items.length + (delta.deleted ? delta.deleted.length : 0) - (delta.inserted ? delta.inserted.length : 0);
      oldCount += (oldCount < CULTURE_LIST.length ? 1 : 0);
      var newCount = items.length + (items.length < CULTURE_LIST.length ? 1 : 0);
      classList(dictionaryEditor.element).replace(oldCount, newCount, 'childCount_');
    }
  });*/
  
  dictionaryEditor.selectResource = function(tokenName, culture){
    var tokenItem = this.childNodes.search(tokenName, getter('data.Token'));
    if (tokenItem)
    {
      tokenItem.select();
      var resourceNode = tokenItem.childNodes.search(culture, getter('data.Culture'));
      if (resourceNode)
      {
        window.focus();

        var memo = resourceNode.satellite.memo.tmpl.memo;
        memo.selectionStart = memo.value.length;
        memo.selectionEnd = memo.value.length;
        memo.focus();
      }
    }
  }

  /*property_CurrentDictionary.addLink(dictionaryEditor, function(value){
    basis.cssom.display(this.element, !!value);
  });*/

  module.exports = dictionaryEditor;


