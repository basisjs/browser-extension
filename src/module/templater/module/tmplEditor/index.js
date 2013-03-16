
  basis.require('basis.ui');
  basis.require('basis.ui.field');
  basis.require('basis.ui.button');
  basis.require('app.ext.editor');


  //
  // import names
  //

  var UINode = basis.ui.Node;
  var nsButton = basis.ui.button;

  //
  // Main part
  //

  var Editor = app.ext.editor.Editor;
  var tokenView = resource('../tokenView/index.js');
  var warnings = resource('../warnings/index.js');


  // .tmpl
  var tmplEditor = new Editor({
    autoDelegate: true,

    fileExt: 'tmpl',

    disabled: true,
    active: true
  });


  //
  // Editor
  //

  var widget = new basis.ui.Node({
    template: resource('template/view.tmpl'),

    setSource: function(source){
      tmplEditor.setDelegate();
      tmplEditor.update({ content: source });
    },

    childNodes: [
      tmplEditor,
      warnings()/*,
      tokenView()*/
    ]
  });


  //
  // export names
  //

  module.exports = widget;
  