
  basis.require('basis.ui.field');

  function getCoord(node, y){
    var code = (node.data.Culture || '').split('-')[1];
    return code ? code.charCodeAt(y) - 65 : -1;
  }

  module.exports = new basis.ui.field.Combobox({
    title: 'Culture:',

    template: resource('template/cultureList.tmpl'),

    childClass: {
      template: resource('template/cultureListItem.tmpl'),

      titleGetter: basis.getter('data.Culture || ""'),
      valueGetter: basis.getter('data.Culture || ""'),
      
      binding: {
        spriteX: {
          events: 'update delegateChanged',
          getter: function(node){
            return 16 * getCoord(node, 0);
          }
        },
        spriteY: {
          events: 'update delegateChanged',
          getter: function(node){
            return 11 * getCoord(node, 1);
          }
        }
      }
    }
  });
