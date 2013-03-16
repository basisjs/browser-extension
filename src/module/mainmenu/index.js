basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.ui.button');
basis.require('app.type');


var EXTENSION_LAST_TAB_STORAGE_KEY = 'BasisDevtoolLastTab';
var localStorage = global.localStorage;

//
// inspect menu
//
var inspectPanel = new basis.ui.Node({
  inspectMode: '',
  template: resource('template/inspectPanel.tmpl'),
  binding: {
    inspectMode: 'inspectMode'
  },
  inspect: function(mode){
    var inspected = this.inspectMode == mode;
    var opositeMode = mode == 'template' ? 'l10n' : 'template';

    if (this.inspectMode == opositeMode)
      app.transport.call(opositeMode + 'EndInspect');

    if (inspected)
      app.transport.call(mode + 'EndInspect')
    else 
      app.transport.call(mode + 'StartInspect');

    this.inspectMode = !inspected ? mode : '';
    this.updateBind('inspectMode');

    if (this.inspectMode)
      this.owner.disable();
    else
      this.owner.enable();
  },
  action: {
    l10nInspect: function(){
      this.inspect('l10n');
    },
    templateInspect: function(){
      this.inspect('template');
    }
  }
});
app.transport.onMessage('startInspect', function(mode){
  if (inspectPanel.inspectMode != mode)
    inspectPanel.inspect(mode);
});
app.transport.onMessage('endInspect', function(mode){
  if (inspectPanel.inspectMode == mode)
    inspectPanel.inspect(mode);
});

//
// app profile control panel
//
var appProfilePanel = new basis.ui.Node({
  active: true,
  delegate: app.type.AppProfile(),
  template: resource('template/appProfilePanel.tmpl'),
  binding: {
    refreshButton: new basis.ui.button.Button({
      autoDelegate: true,
      caption: 'Refresh app profile',
      click: function(){
        this.deprecate();
      },
      handler: {
        stateChanged: function(){
          if (this.state == basis.data.STATE.PROCESSING)
            this.disable();
          else
            this.enable();
        }
      }
    }),
    error: {
      events: 'stateChanged',
      getter: function(node){
        return node.state.data;
      }
    }
  }
});

//
// main
//
module.exports = new basis.ui.tabs.PageControl({
  container: document.body,

  template: resource('template/pages.tmpl'),
  binding: {
    inspectPanel: inspectPanel,
    appProfilePanel: appProfilePanel,
    tabs: new basis.ui.tabs.TabControl({
      template: resource('template/tabs.tmpl'),

      handler: {
        ownerChanged: function(){
          this.setDataSource(this.owner && this.owner.getChildNodesDataset());
        }
      },

      autoSelectChild: false,
      childFactory: function(config){
        if (config.delegate.tabExt)
          config = [config.delegate.tabExt, config].merge()
        return new this.childClass(config);
      },
      childClass: {
        template: resource('template/tab.tmpl'),
        binding: {
          title: 'delegate.title',
          name: 'delegate.name'
        },
        event_enable: function(){
          basis.ui.tabs.Tab.prototype.event_enable.call(this);
          if (this.delegate.selected)
            this.select();
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
