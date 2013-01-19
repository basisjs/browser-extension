
  basis.require('basis.l10n');
  basis.require('basis.dom.wrapper');
  basis.require('basis.data.dataset');
  basis.require('basis.ui.tabs');

  var mainMenu = new basis.ui.tabs.PageControl({
    container: document.body,

    template: resource('template/pages.tmpl'),

    binding: {
      tabs: 'satellite:',
      pageSelected: function(control){
        return control.selection.pick() ? 'pageSelected' : '';
      }
    },

    autoSelectChild: false,

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

    listen: {
      selection: {
        datasetChanged: function(selection){
          this.updateBind('pageSelected');
        }
      }
    },

    satelliteConfig: {
      tabs: {
        hook: {},
        dataSource: function(owner){
          return new basis.data.dataset.Subset({
            source: new basis.dom.wrapper.ChildNodesDataset({
              sourceNode: owner
            }),
            rule: 'title'
          })
        },
        instanceOf: basis.ui.tabs.TabControl.subclass({
          template: resource('template/tabs.tmpl'),

          autoSelectChild: false,

          childClass: {
            template: resource('template/tab.tmpl'),

            listen: {
              delegate: {
                select: function(){
                  this.select();
                }
              }
            },

            action: {
              select: function(event){                       
                this.select();
                basis.dom.event.kill(event);
              }
            },

            binding: {
              title: {
                events: 'delegateChanged',
                getter: function(tab){
                  return tab.delegate ? tab.delegate.title: '';
                }
              },
              name: {
                events: 'delegateChanged',
                getter: function(tab){
                  return tab.delegate ? tab.delegate.name: '';
                }
              }
            },

            event_select: function(){
              basis.ui.tabs.Tab.prototype.event_select.call(this);

              this.delegate.select();
            }
          }
        })
      }
    }
  });

  module.exports = mainMenu;

