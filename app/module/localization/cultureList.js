
  basis.require('basis.ui.field');
  
  /*module.exports = new basis.ui.field.Combobox({
    title: 'Culture: ',
    cssClassName: 'CultureList',

    childClass: {
      template:
        '<div class="CultureList-Item Basis-Combobox-Item {selected} {disabled}" event-click="select"><img{imgElement} src="" event-error="error" event-load="load"/>{title}</div>',

      action: {
        load: function(){
          basis.cssom.show(this.tmpl.imgElement);
        },
        error: function(){
          basis.cssom.hide(this.tmpl.imgElement);
        }
      },

      titleGetter: getter('title'),
      valueGetter: getter('value'),

      templateUpdate: function(){
        var culture = this.getValue();
        if (culture)
        {
          var country = culture.substr(culture.indexOf('-') + 1).toLowerCase();

          var object = this;
          var img = new Image();
          img.onload = function(){ 
            object.tmpl.imgElement.src = img.src; 
            basis.cssom.show(object.tmpl.imgElement) 
          }
          img.onerror = function(){ 
            basis.cssom.hide(object.tmpl.imgElement) 
          }
          img.src = FLAG_PATH + '/' + country + '.png';
        }
      }
    }
  }); */

  module.exports = new basis.ui.field.Combobox({
    title: 'Culture:',
    cssClassName: 'CultureList',
    childClass: {
      template: resource('template/cultureComboboxItem.tmpl'),

      titleGetter: Function.getter('data.Culture || ""'),
      valueGetter: Function.getter('data.Culture || ""'),
      
      binding: {
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
      }
    }
  });


