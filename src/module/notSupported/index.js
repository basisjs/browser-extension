basis.require('basis.dom');
basis.require('basis.ui');

module.exports = new basis.ui.Node({
  template: resource('template/view.tmpl'),
  container: document.body
});

app.transport.ready(basis.fn.runOnce(function(){
  basis.dom.remove(module.exports.element);
}));