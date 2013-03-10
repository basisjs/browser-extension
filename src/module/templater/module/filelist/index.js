
  basis.require('basis.data.dataset');
  basis.require('basis.data.property');
  basis.require('basis.ui');
  basis.require('basis.ui.resizer');
  //basis.require('app.type.file');

  var File = app.type.File;


  //
  // Datasets
  //

  var cssAndTemplates = new basis.data.dataset.Subset({
    source: File.all,
    rule: function(object){
      var extname = basis.path.extname(object.data.filename);
      return (extname == '.tmpl' || extname == '.css');
    }
  });

  var filenameFilteredSubset = new basis.data.dataset.Subset({
    source: cssAndTemplates
  });


  //
  // filter
  //

  var fileListMatchInput = new basis.ui.Node({
    empty: false,

    template: resource('templates/matchInput.tmpl'),
    binding: {
      empty: function(node){
        return node.empty ? 'empty' : '';
      }
    },
    action: {
      keyup: function(event){
        if (basis.dom.event.key(event) == basis.dom.event.KEY.ESC)
          this.tmpl.input.value = '';

        matchProperty.set(this.tmpl.input.value);
      },
      change: function(){
        matchProperty.set(this.tmpl.input.value);
      },
      clear: function(){
        this.tmpl.input.value = '';
        matchProperty.set('');
        this.focus();
      }
    }
  });

  var matchProperty = new basis.data.property.Property('');
  matchProperty.addLink(fileListMatchInput, function(value){
    this.empty = !value;
    this.updateBind('empty');
  });
  matchProperty.addLink(filenameFilteredSubset, function(value){
    if (value)
    {
      var regExp = new RegExp('(^|\/)' + value.forRegExp(), 'i');
      this.setRule(function(object){ 
        return regExp.test(object.data.filename) 
      });
    }
    else
      this.setRule(basis.fn.$true);
  });


  //
  // list
  //

  var fileList = new basis.ui.Node({
    dataSource: filenameFilteredSubset,
    template: resource('templates/fileList.tmpl'),

    selection: true,
    sorting: 'data.filename',

    childClass: {
      template: resource('templates/fileListItem.tmpl'),
      binding: {
        path: 'data:filename',
        filename: {
          events: 'update',
          getter: function(node){
            return node.data.filename.split("/").slice(-1);
          }
        },
        modified: {
          events: 'targetChanged',
          getter: function(node){
            return node.target && node.target.modified;
          }
        }
      },

      action: {
        select: function(){
          this.select();
        }
      },

      listen: {
        target: {
          rollbackUpdate: function(){
            this.updateBind('modified');
          }
        }
      }
    },

    grouping: {
      groupGetter: function(object){
        var filename = object.data.filename;
        return filename.substr(1, filename.lastIndexOf('/'));
      },
      sorting: 'data.id',
      childClass: {
        template: resource('templates/fileListGroup.tmpl')
      }
    }
  });


  //
  // main control
  //

  var widget = new basis.ui.Node({
    template: resource('templates/fileListPanel.tmpl'),
    tree: fileList,
    childNodes: [
      fileListMatchInput,
      fileList
    ]
  });

  new basis.ui.resizer.Resizer({
    element: widget.element
  });


  //
  // export names
  //

  module.exports = widget;

