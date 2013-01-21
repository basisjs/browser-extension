
  basis.require('basis.ui');

  module.exports = new basis.ui.Node({
    template: resource('template/dictionaryList.tmpl'),

    selection: true,
    sorting: 'data.Dictionary',

    childClass: {
      template: resource('template/dictionaryListItem.tmpl'),
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
    }
  });
