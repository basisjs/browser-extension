
  basis.require('basis.ui');

  module.exports = new basis.ui.Node({
    template: resource('template/list.tmpl'),

    selection: true,
    sorting: 'data.Dictionary',

    childClass: {
      template: resource('template/item.tmpl'),
      binding: {
        title: 'data:Dictionary'
      },
      action: {
        select: function(){
          this.select();
        }
      }
    },

    setValue: function(dictionaryName){
      var dict = this.getChild(dictionaryName, 'data.Dictionary');

      if (dict)
        dict.select();
      else
        this.selection.clear();
    }
  });
