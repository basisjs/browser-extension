
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
    active: true/*,

    value:
      '{resource:1.css}\n' +
      '<li class="devtools-templateNode {collapsed}">\n\
        <div{content} class="devtools-templateNode-Title devtools-templateNode-CanHaveChildren {selected} {disabled}">\n\
          <div class="devtools-templateNode-Expander" event-click="toggle" attr="{l10n:path.to.dict.token}"/>\n\
          <span{titleElement} class="devtools-templateNode-Caption" event-click="select">\n\
            {l10n:path.to.dict.token}\n\
            <!--{preTitle} sdf-->{title} ({childCount})<!--just a comment-->\n\
            <span{l10n:path.to.dict.token}/>\n\
          </span>\n\
        </div>\n\
        <ul{childNodesElement} class="devtools-templateNode-Content"/>\n\
      </li>'*/
  });


  //
  // Editor
  //

  var widget = new basis.ui.Node({
    template: resource('templates/view.tmpl'),

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
  