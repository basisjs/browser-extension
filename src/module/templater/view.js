
  basis.require('basis.ui');
  basis.require('basis.ui.button');

 
  //
  // import names
  //

  var nsButton  = basis.ui.button;

  var editor = resource('widget/tmplEditor.js');
  var tokenView = resource('widget/tokenView.js');
  var filelist = resource('widget/filelist.js');
  var resourceEditor = resource('widget/resourceEditor.js');


  //
  // Main part
  //

  var inspectMode = false;
  function inspect(mode){
    inspectMode = mode;
    inspectButton.updateBind('active');

    if (inspectMode)
      app.transport.call('startTemplateInspect');
    else
      app.transport.call('endTemplateInspect');
  }

   
  //
  // Inspect button
  //

  var inspectButton = new nsButton.Button({
    container: editor().firstChild.element,

    template: resource('templates/inspectButton.tmpl'),
    binding: {
      active: function(){
        return inspectMode ? 'active' : '';
      }
    },

    caption: 'Start Inspect',
    click: function(){
      inspect(!inspectMode);
    }
  });
  
    
  //
  // result
  //
  
  var templater = new basis.ui.Node({
    template: resource('templates/view.tmpl'),

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

      editor().setDelegate(item);
      resourceEditor().setDelegate(item);
      tokenView().setDelegate(item);
    }
  });
 
  app.transport.ready(function(){
    app.transport.call('getFileList'); 
  });

  app.transport.onMessage('pickTemplate', function(data){
    inspect(false);

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

