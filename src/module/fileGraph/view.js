basis.require('basis.data');
basis.require('basis.ui');
basis.require('basis.ui.button');
basis.require('app.type');

var appProfile = app.type.AppProfile();

var graphView = basis.resource('lib/file-graph-viewer/src/module/view/index.js').fetch();
appProfile.addHandler({
  update: function(sender){
    graphView.dataType.loadMap(basis.object.slice(sender.data, ['files', 'links']));
  }
});

var controlPanel = new basis.ui.Node({
  active: true,
  delegate: appProfile,
  template: resource('template/panel.tmpl'),
  binding: {
    refreshButton: new basis.ui.button.Button({
      autoDelegate: true,
      caption: 'Refresh',
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

module.exports = new basis.ui.Node({
  template: resource('template/view.tmpl'),
  binding: {
    graph: graphView,
    panel: controlPanel
  }
});
