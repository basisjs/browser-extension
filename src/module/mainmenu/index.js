var tabs = require('basis.ui.tabs');
var Node = require('basis.ui').Node;
var Button = require('basis.ui.button').Button;
var appProfile = require('app.type').AppProfile();
var Client = require('app.type').Client;
var transport = require('app.transport');

var EXTENSION_LAST_TAB_STORAGE_KEY = 'BasisDevtoolLastTab';
var localStorage = global.localStorage;

//
// inspect menu
//
var inspectPanel = new Node({
  inspectMode: '',
  template: resource('./template/inspectPanel.tmpl'),
  binding: {
    inspectMode: 'inspectMode'
  },
  inspect: function(mode){
    var inspected = this.inspectMode == mode;
    var opositeMode = mode == 'template' ? 'l10n' : 'template';

    if (this.inspectMode == opositeMode)
      transport.invoke(opositeMode + 'EndInspect');

    if (inspected)
      transport.invoke(mode + 'EndInspect');
    else
      transport.invoke(mode + 'StartInspect');

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
transport.onMessage('startInspect', function(mode){
  if (inspectPanel.inspectMode != mode)
    inspectPanel.inspect(mode);
});
transport.onMessage('endInspect', function(mode){
  if (inspectPanel.inspectMode == mode)
    inspectPanel.inspect(mode);
});
transport.ready(function(){
  if (inspectPanel.inspectMode)
    transport.invoke(inspectPanel.inspectMode + 'StartInspect');
  else
    transport.invoke('getInspectMode');
});

//
// app profile control panel
//
var appProfilePanel = new Node({
  active: true,
  delegate: appProfile,
  template: resource('./template/appProfilePanel.tmpl'),
  binding: {
    refreshButton: new Button({
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
module.exports = new tabs.PageControl({
  container: document.body,

  template: resource('./template/pages.tmpl'),
  binding: {
    inspectPanel: inspectPanel,
    appProfilePanel: appProfilePanel,
    clients: new basis.ui.Node({
      dataSource: Client.all,
      childClass: {
        template: '<li>{title} {location}</li>',
        binding: {
          title: 'data:',
          location: 'data:'
        }
      }
    }),
    tabs: new tabs.TabControl({
      template: resource('./template/tabs.tmpl'),

      handler: {
        ownerChanged: function(){
          this.setDataSource(this.owner && this.owner.getChildNodesDataset());
        }
      },

      autoSelectChild: false,
      childFactory: function(config){
        if (config.delegate.tabExt)
          config = [config.delegate.tabExt, config].merge();
        return new this.childClass(config);
      },
      childClass: {
        template: resource('./template/tab.tmpl'),
        binding: {
          title: 'delegate.title',
          name: 'delegate.name'
        },
        event_enable: function(){
          tabs.Tab.prototype.event_enable.call(this);
          if (this.delegate.selected)
            this.select();
        },
        event_select: function(){
          tabs.Tab.prototype.event_select.call(this);
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
    template: resource('./template/page.tmpl'),

    event_select: function(){
      tabs.Page.prototype.event_select.call(this);

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
