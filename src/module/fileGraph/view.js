var Node = require('basis.ui').Node;
var appProfile = require('app.type').AppProfile();
var graphView = basis.require('./lib/file-graph-viewer/src/module/view/index.js');

graphView.setActive(true);
graphView.addHandler({
  update: function(sender){
    this.dataType.loadMap(basis.object.slice(sender.data, ['files', 'links']));
  }
});
graphView.setDelegate(appProfile);

module.exports = new basis.ui.Node({
  template: resource('./template/view.tmpl'),
  binding: {
    graph: graphView
  }
});
