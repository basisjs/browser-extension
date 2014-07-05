var Node = require('basis.ui').Node;
var transport = require('app.transport');

var view = new Node({
  container: document.body,
  template: resource('./template/view.tmpl'),
  action: {
    add: function(){
      chrome.devtools.inspectedWindow.eval(
        'if (basis)' +
        '  basis.require("basis.devpanel");'
      );
    }
  }
});

transport.ready(basis.fn.runOnce(function(){
  basis.doc.remove(view.element);
}));

module.exports = view;
