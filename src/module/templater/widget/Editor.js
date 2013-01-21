
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.layout');
  basis.require('basis.ui');
  basis.require('basis.ui.form');
  basis.require('basis.ui.field');


  //
  // import names
  //

  var ace = resource('ace.min.js').fetch();

  var getter = Function.getter;
  var wrapper = Function.wrapper;
  var classList = basis.cssom.classList;

  var DELEGATE = basis.dom.wrapper.DELEGATE;
  var STATE = basis.data.STATE;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;

  var nsTemplate = basis.template;
  var nsEvent = basis.dom.event;
  var nsProperty = basis.data.property;
  var nsLayout = basis.layout;
  var nsButton = basis.ui.button;
  var nsForm = basis.ui.form;
  var nsField = basis.ui.field;

  var KEY_S = 'S'.charCodeAt(0);

  function onEnter(editor){
    var textarea = editor.tmpl.field;
    var curValue = editor.getValue();//textarea.value;
    var insertPoint = basis.dom.getSelectionStart(textarea);
    var chrPos = curValue.lastIndexOf('\n', insertPoint - 1) + 1;
    var spaces = '';
    var chr;

    while (chrPos < insertPoint)
    {
      chr = curValue.charAt(chrPos++);
      if (chr == ' ' || chr == '\t')
        spaces += chr;
      else
        break;
    }

    if (spaces)
    {
      textarea.value = textarea.value.substr(0, insertPoint) + '\n' + spaces + textarea.value.substr(insertPoint);
      insertPoint += spaces.length + 1;
      basis.dom.setSelectionRange(textarea, insertPoint, insertPoint);
      nsEvent.kill(event);
    }
  }

  //
  // Editor class
  //

  var editorContentChangedHandler = function(){
    var value = this.getValue() || '';
    var newContent = value.replace(/\r/g, '');

    if (this.target)
      this.target.update({ content: newContent }, true);

    if (this.sourceProperty)
      this.sourceProperty.set(newContent);
  }

 /**
  *
  */
  var Editor = basis.ui.Node.subclass({
    cssClassName: 'SourceEditor',

    autoDelegate: DELEGATE.PARENT,

    template: resource('../templates/editor/editor.tmpl'),
    binding: {
      filename: {
        events: 'targetChanged update',
        getter: function(node){
          return (node.target && node.target.data.filename) || '';
        }
      },
      modified: {
        events: 'targetChanged rollbackUpdate update',
        getter: function(node){
          return node.target && node.target.modified ? 'modified' : '';
        }
      }/*,
      createFilePanel: 'satellite:'*/
    },

    templateSync: function(noRecreate){
      basis.ui.Node.prototype.templateSync.call(this, noRecreate);

      var editor = ace.edit(this.tmpl.editor);
      var self = this;
      this.editor = editor;
      editor.setTheme("ace/theme/monokai");
      editor.getSession().setMode("ace/mode/html");
      editor.on('change', function(event){
        /*self.update({
          content: editor.getValue()
        });*/
      });
    },

    listen: {
      target: {
        rollbackUpdate: function(){
          this.updateBind('modified');
        }
      }
    },

    handler: {
      /*fieldInput: editorContentChangedHandler,
      fieldChange: editorContentChangedHandler,
      fieldKeyup: editorContentChangedHandler,
      fieldKeydown: function(sender, event){
        var key = nsEvent.key(event);

        if (key == nsEvent.KEY.F2 || (event.ctrlKey && key == KEY_S))
        {
          
          if (this.target)
            this.target.save();

          nsEvent.kill(event);

          return;
        }

        if (key == nsEvent.KEY.ESC)
        {
          if (this.target)
            this.target.rollback();

          nsEvent.kill(event);

          return;
        }

        if (key == nsEvent.KEY.ENTER)
          onEnter(this);
      },*/
      update: function(object, delta){
        if ('content' in delta)
        {
          var content = this.data.content || '';
          this.editor.setValue(content, -1);

          if (this.sourceProperty)
            this.sourceProperty.set(content);
        }
      },
      stateChanged: function(){
        activityHandler.call(this);
      },
      targetChanged: function(){
        classList(this.tmpl.content).bool('modified', this.target && this.target.modified);

        activityHandler.call(this);
      }
    }
  });

  function activityHandler(){
    if (this.target && this.state != STATE.PROCESSING)
      this.enable();
    else
    {
      if (!this.target)
        this.update({ content: '' });

      this.disable();
    }    
  }


  //
  // export names
  //

  exports = module.exports = Editor;
