
  basis.require('basis.ui.field');


  var dictionaryList = new basis.ui.Node({
    cssClassName: 'DictionaryList',

    childClass: {
      template: resource('template/dictionaryListItem.tmpl'),

      binding: {
        title: 'data:Dictionary'
      },

      action: {
        select: function(){
          this.select()
        }
      }
    },

    selection: {},
    sorting: 'data.Dictionary',

    setValue: function(dictionaryName){
      var dict = this.childNodes.search(dictionaryName, 'data.Dictionary');

      if (dict)
        dict.select();
    }
  });

  module.exports = dictionaryList;

  /*module.exports = new basis.ui.field.Combobox({
    title: 'Dictionary: ',
    cssClassName: 'DictionaryList',

    childClass: {          
      binding: {
        modified: {
          getter: function(object){
            return object.target && object.target.modified ? 'modified' : '';
          },
          events: 'rollbackUpdate update'
        }
      },

      titleGetter: Function.getter('data.Dictionary'),
      valueGetter: Function.getter('data.Dictionary')
    },
    sorting: 'data.Dictionary'
  }); */
