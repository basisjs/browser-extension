
var view = basis.resource('lib/file-graph-viewer/src/module/view/index.js').fetch();

view.dataType.loadMap(basis.resource('lib/file-graph-viewer/src/data/file-map.json').fetch());

module.exports = view;