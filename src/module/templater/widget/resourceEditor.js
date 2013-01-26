	
  basis.require('basis.layout');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.ui.resizer');

  var File = basis.resource('src/app/type/file.js')().File;

  //
  // import names
  //

  var UINode = basis.ui.Node;

  var nsLayout = basis.layout;
  var nsResizer = basis.ui.resizer;
  var nsButton = basis.ui.button;


  //
  // Main part
  //

  var Editor = resource('Editor.js').fetch();

  var ResourceEditor = Editor.subclass({
    active: true,
    autoDelegate: false,

    template: resource('../templates/resourceEditor/resourceEditor.tmpl'),
    binding: {
      title: 'data:filename',
      filename: function(node){
        return basis.path.basename(node.data.filename);
      },
      buttonPanel: 'satellite:',
      createFilePanel: 'satellite:'
    },

    editorMode: 'css',

    init: function(){
      Editor.prototype.init.call(this);
      this.editor.on('change', this.resize.bind(this));
      //console.log('editor created');
    },
    destroy: function(){
      //console.log('editor destroy');
      Editor.prototype.destroy.call(this);
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
          autoDelegate: true,

          template: resource('../templates/resourceEditor/createFilePanel.tmpl'),

          binding: {
            filename: 'data:',
            ext: function(node){
              return (node.owner && node.owner.fileExt) || '?';
            },
            button: 'satellite:'
          },

          satelliteConfig: {
            button: nsButton.Button.subclass({
              autoDelegate: true,
              caption: 'Create a file',
              click: function(){
                File.createFile(this.data.filename);
              }
            })
          }
        })
      }
    }
  });

  var resourceList = new basis.ui.Node({
    autoDelegate: true,

    template: resource('../templates/resourceEditor/resourceList.tmpl'),

    handler: {
      targetChanged: function(){
        this.updateResources(this.target ? this.data.resources : null);
      },
      update: function(object, delta){
        if ('resources' in delta)
          this.updateResources(this.data.resources);
      }
    },

    updateResources: function(res){
      var resources = res || [];
      var children = [];
      var reset = false;

      for (var i = 0, filename; filename = resources[i]; i++)
      {
        var child = this.getChild(filename, 'data.filename');
        if (!child)
        {
          child = File.getSlot(filename);
          reset = true;
        }
        children.push(child)
      }

      if (reset || children.length != this.childNodes.length)
        this.setChildNodes(children);
    },

    childClass: {
      template: resource('../templates/resourceEditor/resourceListItem.tmpl'),
      binding: {
        title: 'data:filename',
        filename: function(object){
          return basis.path.basename(object.data.filename);
        }
      },
      action: {
        click: function(){
          var resourceEditor = resourceEditorList.getChild(this.data.filename, 'data.filename')
          if (resourceEditor)
            resourceEditor.element.scrollIntoView(true);
        }
      }
    }
  });

  var resourceEditorList = new basis.ui.Node({
    dataSource: resourceList.getChildNodesDataset(),

    template: resource('../templates/resourceEditor/resourceEditorList.tmpl'),

    childClass: ResourceEditor
  });

  var widget = new nsLayout.VerticalPanelStack({
    template: resource('../templates/resourceEditor/view.tmpl'),
    childNodes: [
      {
        autoDelegate: true, 
        childNodes: resourceList
      },
      {
        autoDelegate: true,
        flex: 1,
        childNodes: resourceEditorList
      }
    ]
  });


 /**
  * resizer
  */
  new nsResizer.Resizer({
    element: widget.element
  });


  //
  // export names
  //

  exports = module.exports = widget;
