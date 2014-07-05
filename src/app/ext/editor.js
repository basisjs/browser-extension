var ace = require('./editor/ace.min.js');

var nsEvent = require('basis.dom.event');
var Node = require('basis.ui').Node;
var ButtonPanel = require('basis.ui.button').ButtonPanel;

var STATE = require('basis.data').STATE;
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
};

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


var templates = basis.template.define('app.ext.editor', {
  Editor: resource('./editor/editor.tmpl')
});

/**
*
*/
var Editor = Node.subclass({
  autoDelegate: true,

  template: templates.Editor,
  binding: {
    buttonPanel: 'satellite:',
    title: 'data:filename',
    filename: {
      events: 'update',
      getter: function(node){
        return node.data.filename ? basis.path.basename(node.data.filename) : '';
      }
    },
    modified: {
      events: 'targetChanged update',
      getter: function(node){
        return node.target && node.target.modified;
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
  satelliteConfig: {
    buttonPanel: {
      instanceOf: ButtonPanel,
      config: {
        autoDelegate: true,
        disabled: true,
        childNodes: [
          {
            autoDelegate: true,
            caption: 'Save',
            click: function(){
              this.target.save();
            }
          },
          {
            autoDelegate: true,
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
      }
    }
  },

  editorMode: 'html',

  init: function(){
    var self = this;
    var editorContainer = document.createElement('div');

    this.editor = ace.edit(editorContainer);
    this.editor.setTheme('ace/theme/monokai');
    this.editor.getSession().setMode('ace/mode/' + this.editorMode);
    this.editor.on('change', editorContentChangedHandler.bind(this));
    this.editorContainer = editorContainer;

    Node.prototype.init.call(this);

    this.setValue(this.data.content);
  },
  templateSync: function(noRecreate){
    Node.prototype.templateSync.call(this, noRecreate);

    var container = this.tmpl.editor;
    if (container)
    {
      container.appendChild(this.editorContainer);
      this.resizeRequest();
    }
  },

  setValue: function(value){
    value = value || '';
    if (this.editor && this.editor.getValue() != value)
    {
      this.editor.setValue(value, -1);

      var self = this;
      setTimeout(function(){
        self.editor.getSession().getUndoManager().reset();
      }, 0);
    }
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
        if (!this.modified)
          this.editor.focus();
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

    Node.prototype.destroy.call(this);

    editor.destroy();
  }
});


//
// export names
//

module.exports = {
  Editor: Editor
};
