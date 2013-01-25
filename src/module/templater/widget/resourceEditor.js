	
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.layout');
  basis.require('basis.ui');
  basis.require('basis.ui.tabs');
  basis.require('basis.ui.resizer');


  //
  // import names
  //

  var wrapper = Function.wrapper;

  var DOM = basis.dom;
  var domEvent = basis.dom.event;
  var classList = basis.cssom.classList;
  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var UINode = basis.ui.Node;

  var nsTemplate = basis.template;
  var nsLayout = basis.layout;
  var nsTree = basis.ui.tree;
  var nsResizer = basis.ui.resizer;
  var nsProperty = basis.data.property;
  var nsButton = basis.ui.button;


  //
  // Main part
  //

  var Editor = resource('Editor.js')();

  var ResourceEditor = Editor.subclass({
    active: true,
    autoDelegate: false,

    template: resource('../templates/resourceEditor/resourceEditor.tmpl'),
    binding: {
      title: 'data:filename',
      filename: function(object){
        return basis.path.basename(object.data.filename);
      },
      buttonPanel: 'satellite:',
      createFilePanel: 'satellite:'
    },

    editorMode: 'css',

    init: function(){
      Editor.prototype.init.call(this);
      this.editor.on('change', this.resize.bind(this));
    },

    resize: function(){
      var newHeight = this.editor.getSession().getScreenLength() * this.editor.renderer.lineHeight + this.editor.renderer.scrollBar.getWidth();

      this.editorContainer.parentNode.style.height = newHeight.toString() + "px";

      Editor.prototype.resize.call(this);
    },

    satelliteConfig: {
      buttonPanel: {
        instanceOf: nsButton.ButtonPanel,
        config: {  
          autoDelegate: DELEGATE.OWNER,
          disabled: true,
          childNodes: [
            {
              autoDelegate: DELEGATE.PARENT,
              caption: 'Save',
              click: function(){
                this.target.save();
              }
            },
            {
              autoDelegate: DELEGATE.PARENT,
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
      },
      createFilePanel: {
        existsIf: function(editor){
          return editor.data.filename && !editor.target;
        },
        hook: {
          rootChanged: true,
          targetChanged: true
        },
        instanceOf: UINode.subclass({
          autoDelegate: DELEGATE.OWNER,

          template: resource('../templates/resourceEditor/createFilePanel.tmpl'),

          binding: {
            filename: 'data:',
            ext: function(node){
              return (node.owner && node.owner.fileExt) || '?';
            },
            button: 'satellite:'
          },

          satelliteConfig: {
            button: basis.ui.button.Button.subclass({
              autoDelegate: DELEGATE.OWNER,
              caption: 'Create a file',
              click: function(){
                app.type.file.File.createFile(this.data.filename);
              }
            })
          }
        })
      }
    }
  });

  var resourceEditorList = new basis.ui.Node({
    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,

    template: resource('../templates/resourceEditor/resourceEditorList.tmpl'),

    childClass: ResourceEditor,

    handler: {
      childNodesModifiy: function(delta){
        delta.forEach(function(item){
          item.resize();
        })
      },
      targetChanged: function(){
        //console.log('targetChanged: ', this.target && this.data.resources);
        this.updateResources(this.target && this.data.resources);
      },
      rollbackUpdate: function(object){
        this.updateResource(this.data.resources);
      },
      update: function(object, delta){
        //console.log('update: ', object.data);
        if ('resources' in delta)
          this.updateResources(this.data.resources);
      }
    },

    updateResources: function(resources){
      this.setChildNodes((resources || []).map(function(filename){
        return app.type.file.File.getSlot(filename);        
      }));
    }
  });


  var resourceList = new basis.ui.Node({
    template: resource('../templates/resourceEditor/resourceList.tmpl'),

    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT, 

    childClass: {
      template: resource('../templates/resourceEditor/resourceListItem.tmpl'),
      binding: {
        filename: function(object){
          return basis.path.basename(object.data.filename);
        },
        title: 'data:filename'
      },
      action: {
        click: function(){
          var resourceEditor = resourceEditorList.childNodes.search(this.data.filename, 'data.filename')
          if (resourceEditor)
            resourceEditor.element.scrollIntoView();
        }
      }
    },

    handler: {
      update: function(object, delta){
        if ('resources' in delta)
          this.updateResources(this.data.resources);
      },
      targetChanged: function(){
        this.updateResources(this.target && this.data.resources);
      }
    },
    updateResources: function(resources){
      this.setChildNodes((resources || []).map(function(filename){
        return { data: { filename: filename } };
      }));
    }
  });


  var widget = new nsLayout.VerticalPanelStack({
    template: resource('../templates/resourceEditor/view.tmpl'),
    childNodes: [
      {
        autoDelegate: basis.dom.wrapper.DELEGATE.PARENT, 
        childNodes: resourceList
      },
      {
        autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
        flex: 1,
        childNodes: resourceEditorList//cssEditor
      }
    ]
  });


 /**
  * resizer
  */
  new nsResizer.Resizer({
    element: widget.element,
    property: 'width'
  });


  //
  // export names
  //

  exports = module.exports = widget;
