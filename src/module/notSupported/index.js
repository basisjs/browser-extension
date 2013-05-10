basis.require('basis.dom');
basis.require('basis.ui');

var view = new basis.ui.Node({
  template: resource('template/view.tmpl'),
  action: {
    add: function(){
      chrome.devtools.inspectedWindow.eval(
        'if (basis)' +
        '  basis.require("basis.devpanel");'
      );
    }
  },
  container: document.body
});

app.transport.ready(basis.fn.runOnce(function(){
  basis.dom.remove(view.element);
}));

module.exports = view;