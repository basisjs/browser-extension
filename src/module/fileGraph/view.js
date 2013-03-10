basis.require('basis.ui.button');

var graphView = basis.resource('lib/file-graph-viewer/src/module/view/index.js').fetch();
var controlPanel = new basis.ui.Node({
  template: resource('template/panel.tmpl'),
  binding: {
    refreshButton: new basis.ui.button.Button({
      autoDelegate: true,
      caption: 'Refresh',
      click: getFileGraph,
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

function getFileGraph(){
  app.transport.call('getFileGraph');
  controlPanel.setState(basis.data.STATE.PROCESSING);
}

app.transport.onMessage('fileGraph', function(data){
  if (data && !data.err && data.data)
  {
    controlPanel.setState(basis.data.STATE.READY);
    graphView.dataType.loadMap(data.data.toObject());
  }
  else
    controlPanel.setState(basis.data.STATE.ERROR, (data && data.err) || 'Wrong data from server');
});

getFileGraph();

module.exports = new basis.ui.Node({
  template: resource('template/view.tmpl'),
  binding: {
    graph: graphView,
    panel: controlPanel
  }
});