
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.ui');
  basis.require('basis.ui.field');


  //
  // import names
  //
  var getter = basis.getter;
  var wrapper = basis.fn.wrapper;

  var classList = basis.cssom.classList;
  var fsobserver = basis.devtools;

  var nsData = basis.data;
  var nsDataset = basis.data.dataset;
  var nsLayout = basis.layout;
  var nsTree = basis.ui.tree;
  var nsResizer = basis.ui.resizer;

  //
  // Datasets
  //

  var fileSubset = new basis.data.dataset.Subset({
    source: app.type.file.File.all,
    rule: function(object){
      var extname = basis.path.extname(object.data.filename);
      return (extname == '.tmpl' || extname == '.css');
    }
  });

  var filterFileSubset = new basis.data.dataset.Subset({
    source: fileSubset,
    rule: basis.fn.$true
  });


  //
  // filter
  //

  var matchProperty = new basis.data.property.Property('');
  var fileListMatchInput = new basis.ui.Node({
    template: resource('../templates/filelist/matchInput.tmpl'),

    binding: {
      clean: function(object){
        return object.clean ? 'clean' : '';
      }
    },

    action: {
      keyup: function(){
        matchProperty.set(this.tmpl.input.value);
      },
      change: function(){
        matchProperty.set(this.tmpl.input.value);
      },
      clear: function(){
        this.tmpl.input.value = '';
        matchProperty.set('');
      }
    }
  });
  matchProperty.addLink(null, function(value){
    fileListMatchInput.clean = !value;
    fileListMatchInput.updateBind('clean');
  });
  matchProperty.addLink(null, function(value){
    if (value)
    {
      var regExp = new RegExp('(^|\/)' + value.forRegExp(), 'i');
      filterFileSubset.setRule(function(object){ 
        return regExp.test(object.data.filename) 
      });
    }
    else
      filterFileSubset.setRule(Function.$true);
  });


  //
  // list
  //

  var fileList = new basis.ui.Node({
    template: resource('../templates/filelist/fileList.tmpl'),
    dataSource: filterFileSubset, //app.type.file.File.all,

    selection: {},
    sorting: 'data.filename',

    childClass: {
      template: resource('../templates/filelist/fileListItem.tmpl'),
      binding: {
        path: 'data:filename',
        filename: {
          events: 'update',
          getter: function(node){
            return node.data.filename.split("/").slice(-1)
          }
        },
        modified: {
          events: 'targetChanged',
          getter: function(node){
            return node.target && node.target.modified ? 'modified' : '';
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
            this.tmpl.set('modified', this.binding.modified.getter(this));
          }
        }
      }
    },

    grouping: {
      groupGetter: function(object){
        var filename = object.data.filename;
        return filename.substr(1, filename.lastIndexOf('/'));
      },
      childClass: {
        template: resource('../templates/filelist/fileListGroup.tmpl')
      },
      sorting: 'data.id'
    }
  });


  //
  // main control
  //

  var widget = new basis.ui.Node({
    template: resource('../templates/filelist/fileListPanel.tmpl'),
    childNodes: [
      fileListMatchInput,
      fileList
    ]
  });

  new nsResizer.Resizer({
    element: widget.element
  });


  //
  // export names
  //

  exports = module.exports = widget;
  exports.tree = fileList;
