
  basis.require('basis.ui.tabs');


  var EXTENSION_LAST_TAB_STORAGE_KEY = 'BasisDevtoolLastTab';
  var localStorage = global.localStorage;

  module.exports = new basis.ui.tabs.PageControl({
    container: document.body,

    template: resource('template/pages.tmpl'),
    binding: {
      tabs: new basis.ui.tabs.TabControl({
        template: resource('template/tabs.tmpl'),

        handler: {
          ownerChanged: function(){
            this.setDataSource(this.owner && this.owner.getChildNodesDataset());
          }
        },

        autoSelectChild: false,
        childClass: {
          template: resource('template/tab.tmpl'),
          binding: {
            title: 'delegate.title',
            name: 'delegate.name'
          },
          action: {
            select: function(event){                       
              this.select();
            }
          },

          event_select: function(){
            basis.ui.tabs.Tab.prototype.event_select.call(this);
            this.delegate.select();
          },
          listen: {
            delegate: {
              select: function(){
                this.select();
              }
            }
          }
        }
      })
    },

    childClass: {
      template: resource('template/page.tmpl'),

      event_select: function(){
        basis.ui.tabs.Page.prototype.event_select.call(this);

        if (this.lazyContent)
        {
          this.appendChild(this.lazyContent());
          this.lazyContent = null;
        }
      }
    },

    autoSelectChild: false,
    selection: {
      handler: {
        datasetChanged: function(selection){
          var page = this.pick();
          if (page && localStorage)
            localStorage[EXTENSION_LAST_TAB_STORAGE_KEY] = page.name;        
        }
      }
    },
    selectPage: function(){
      var page = this.item(localStorage && localStorage[EXTENSION_LAST_TAB_STORAGE_KEY]) || this.firstChild;
      if (page)
        page.select();
    }
  });
