
  basis.require('basis.dom');
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

  var getter = basis.fn.getter;
  var classList = basis.cssom.classList;

  var dom = basis.dom;
  var nsEvent = basis.dom.event;
  var nsProperty = basis.data.property;
  var nsLayout = basis.layout;
  var nsButton = basis.ui.button;
  var nsForm = basis.ui.form;
  var nsField = basis.ui.field;

  var STATE = basis.data.STATE;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;


  var KEY_S = 'S'.charCodeAt(0);


  //
  // Editor class
  //

  var editorContentChangedHandler = function(){
    var newContent = this.editor.getValue();
                       // FIXME: it is hack
    if (this.target && this.delegate.target == this.target)
      this.target.update({
        content: newContent
      }, true);
  }

  function activityHandler(){
    if (this.target && this.state != STATE.PROCESSING)
      this.enable();
    else
    {
      if (!this.target)
        this.setValue('');

      this.disable();
    }    
  }

 /**
  *
  */
  var Editor = basis.ui.Node.subclass({
    autoDelegate: true,

    template: resource('../templates/editor/editor.tmpl'),
    binding: {
      filename: 'data:filename || ""',
      modified: {
        events: 'targetChanged rollbackUpdate update',
        getter: function(node){
          return node.target && node.target.modified ? 'modified' : '';
        }
      }
    },
    action: {
      fieldKeydown: function(event){
        var key = nsEvent.key(event);

        if (key == nsEvent.KEY.F2 || ((event.ctrlKey || event.metaKey) && key == KEY_S))
        {
          nsEvent.kill(event);
          if (this.target)
            this.target.save();

          return;
        }

        if (key == nsEvent.KEY.ESC)
        {
          if (this.target)
            this.target.rollback();

          return;
        }
      }
    },

    editorMode: 'html',

    init: function(){
      var self = this;
      var editorContainer = dom.createElement('');

      this.editor = ace.edit(editorContainer);
      this.editor.setTheme('ace/theme/monokai');
      this.editor.getSession().setMode('ace/mode/' + this.editorMode);
      this.editor.on('change', editorContentChangedHandler.bind(this));
      this.editorContainer = editorContainer;

      basis.ui.Node.prototype.init.call(this);

      this.setValue(this.data.content)
    },
    templateSync: function(noRecreate){
      basis.ui.Node.prototype.templateSync.call(this, noRecreate);

      var container = this.tmpl.editor;
      if (container)
      {
        dom.insert(container, this.editorContainer);
        this.resizeRequest();
      }
    },

    setValue: function(value){
      value = value || '';
      if (this.editor && this.editor.getValue() != value)
        this.editor.setValue(value, -1);
    },
    resizeRequest: function(){
      if (!this.timer_)
        this.timer_ = setTimeout(this.resize.bind(this), 0);
    },
    resize: function(){
      this.timer_ = clearTimeout(this.timer_);
      this.editor.resize();
    },

    listen: {
      target: {
        rollbackUpdate: function(){
          this.updateBind('modified');
        }
      }
    },

    handler: {
      disable: function(){
        if (this.editor)
          this.editor.setReadOnly(true);
      },
      enable: function(){
        if (this.editor)
          this.editor.setReadOnly(false);
      },

      update: function(object, delta){
        if ('content' in delta)
          this.setValue(this.data.content);
      },
      stateChanged: activityHandler,
      targetChanged: function(){
        activityHandler.call(this);

        if (this.target)
          this.setValue(this.data.content);
      }
    },

    destroy: function(){
      var editor = this.editor;
      this.editor = null;

      clearTimeout(this.timer_);
      this.timer_ = true;

      basis.ui.Node.prototype.destroy.call(this);

      editor.destroy();
    }
  });


  //
  // export names
  //

  exports = module.exports = Editor;
