
  basis.require('basis.ui');
  basis.require('basis.ui.button');

 
  //
  // import names
  //

  var nsButton  = basis.ui.button;

  var editor = resource('module/tmplEditor/index.js');
  var tokenView = resource('module/tokenView/index.js');
  var filelist = resource('module/filelist/index.js');
  var resourceEditor = resource('module/resourceList/index.js');


  //
  // Main part
  //
  
  var templater = new basis.ui.Node({
    template: resource('template/view.tmpl'),

    binding: {
      editor: editor(),
      filelist: filelist(),
      resourceEditor: resourceEditor()
    }
  });

  filelist().tree.selection.addHandler({
    datasetChanged: function(selection, delta){
      var item = selection.pick();

      if (item && !/\.tmpl$/.test(item.data.filename))
        item = null;

      if (item)
      {
        editor().setDelegate(item.target);
        resourceEditor().setDelegate(item.target);
        //tokenView().setDelegate(item);
      }
    }
  });
 
  app.transport.ready(function(){
    app.transport.invoke('getFileList'); 
  });

  app.transport.onMessage('pickTemplate', function(data){
    //inspect(false);

    if (data.filename)
    {
      var fileNode = searchFileInTree(data.filename, filelist().tree);
      if (fileNode)
      {
        fileNode.select();
        fileNode.element.scrollIntoView(true);
      }
    }
    else
      if (data.content)
      {
        filelist().tree.selection.clear();
        editor().setSource(data.content);
      }
  });

  function searchFileInTree(filename, root){
    var result;

    if (root.data.filename == filename)
      result = root;

    if (root.childNodes)
      for (var i = 0, child; child = root.childNodes[i]; i++)
        if (result = searchFileInTree(filename, child))
          break;

    return result;
  }

  //
  // exports
  //

  exports = module.exports = templater;
  exports.filelist = filelist;
  exports.editor = editor;
  exports.tokenView = tokenView;

