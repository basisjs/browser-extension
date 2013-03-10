
var view = basis.resource('lib/file-graph-viewer/src/module/view/index.js').fetch();

app.transport.onMessage('fileGraph', function(data){
  if (!data.err && data.data)
    view.dataType.loadMap(data.data.toObject());
});
app.transport.call('getFileGraph');

module.exports = view;