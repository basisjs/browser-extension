
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.layout');
  basis.require('basis.ui');
  basis.require('basis.ui.form');
  basis.require('basis.ui.field');
  basis.require('basis.ui.button');


  //
  // import names
  //

  var getter = Function.getter;
  var wrapper = Function.wrapper;
  var classList = basis.cssom.classList;

  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;

  var nsTemplate = basis.template;
  var nsEvent = basis.dom.event;
  var nsProperty = basis.data.property;
  var nsLayout = basis.layout;
  var nsButton = basis.ui.button;
  var nsForm = basis.ui.form;
  var nsField = basis.ui.field;

  //
  // Main part
  //

  var Editor = resource('Editor.js')();
  var tokenView = resource('tokenView.js');


  resource('../templates/editor/style.css')().startUse();


  var tmplSource = new nsProperty.Property('');
  //var cssSource = new nsProperty.Property('');

  // .tmpl
  var tmplEditor = new Editor({
    autoDelegate: DELEGATE.PARENT,

    id: 'TmplEditor',
    //sourceProperty: tmplSource,
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

  // .css
  /*var cssEditor = new Editor({
    id: 'CssEditor',
    sourceProperty: cssSource,
    fileExt: 'css',
    active: true
  });*/



  //
  // Editor
  //

  var widget = new basis.ui.Node({//new nsLayout.VerticalPanelStack({
    id: 'Editor',

    childNodes: [
      {
        id: 'EditorToolbar',
        childNodes: [
          new nsButton.ButtonPanel({
            delegate: tmplEditor,
            disabled: true,
            childNodes: [
              {
                delegate: tmplEditor,
                caption: 'Save',
                click: function(){
                  this.target.save();
                }
              },
              {
                delegate: tmplEditor,
                caption: 'Rollback',
                click: function(){
                  this.target.rollback();
                }
              }
            ],
            syncDisableState: function(){
              if (this.target && this.target.modified)
                this.enable();
              else
                this.disable();
            },
            handler: {
              targetChanged: function(){
                this.syncDisableState();
              }
            },
            listen: {
              target: {
                rollbackUpdate: function(){
                  this.syncDisableState();
                }
              }
            }
          })
        ]
      },
      tmplEditor,
      tokenView()	
      /*{
        flex: 1,
        autoDelegate: DELEGATE.PARENT,
        childNodes: tmplEditor
      },
      {
        flex: 1,
        //autoDelegate: DELEGATE.PARENT,
        childNodes: tokenView()//cssEditor
      }*/
    ]
  });

  //
  // export names
  //

  exports = module.exports = widget;
  //exports.tmplSource = tmplSource;
  //exports.tmplEditor = tmplEditor;
  exports.setSource = function(source){
    tmplEditor.setDelegate();
    tmplEditor.update({ content: source });
  }
  /*exports.setSourceFile = function(file){
    var filename;

    if (file instanceof basis.data.DataObject)
      filename = file.data.filename;
    else
      filename = file;

    if (filename && /.tmpl$/.test(filename))
    {
      var tmplFilename = filename;
      //var tmplFilename = filename.replace(/\.[a-z0-9]+$/, '.tmpl');
      //var cssFilename = filename.replace(/\.[a-z0-9]+$/, '.css');
      tmplEditor.setDelegate(app.type.file.File.getSlot({ filename: filename, content: '' }));
      //cssEditor.setDelegate(app.type.File.getSlot({ filename: cssFilename, content: '' }));
    }
    else
    {
      tmplEditor.setDelegate();
      //cssEditor.setDelegate();
    }
  }*/
