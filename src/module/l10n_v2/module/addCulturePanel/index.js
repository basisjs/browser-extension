  //header
  var l10nType = resource('../../type.js').fetch();
  var Culture = l10nType.Culture;
  var usedCulturesDataset = l10nType.usedCulturesDataset;
  var currentDictionary = l10nType.currentDictionary;

  var view = new basis.ui.Node({
    template: resource('template/view.tmpl'),

    binding: {
      invisible: 'invisible'
    },

    dataSource: new basis.data.dataset.Subtract({
      minuend: Culture.all,
      subtrahend: usedCulturesDataset
    }),

    childClass: {
      template: resource('template/item.tmpl'),

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

  currentDictionary.addLink(view, function(value){
    view.invisible = !value;
    view.updateBind('invisible');
  });

  usedCulturesDataset.addHandler({
    datasetChanged: function(object, delta){
      if (object.itemCount > 4)
        view.disable();
      else
        view.enable();
    }
  });  

  module.exports = view;