basis.require('basis.data');
basis.require('basis.ui');
basis.require('app.type');

var appProfile = app.type.AppProfile();

var graphView = basis.resource('lib/file-graph-viewer/src/module/view/index.js').fetch();
graphView.setActive(true);
graphView.addHandler({
  update: function(sender){
    this.dataType.loadMap(basis.object.slice(sender.data, ['files', 'links']));
  }
});
graphView.setDelegate(appProfile);

module.exports = new basis.ui.Node({
  template: resource('template/view.tmpl'),
  binding: {
    graph: graphView
  }
});
