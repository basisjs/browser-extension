
  basis.require('basis.cssom');
  basis.require('basis.data.property');
  basis.require('basis.template');
  basis.require('basis.dom.event');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.ui.resizer');

  resource('css/style.css')().startUse();

  //
  // import names
  //

  var nsTemplate = basis.template;
  var nsButton  = basis.ui.button;
  var classList = basis.cssom.classList;


  var editor = resource('widget/tmplEditor.js');
  var tokenView = resource('widget/tokenView.js');
  var filelist = resource('widget/filelist.js');
  var resourceEditor = resource('widget/resourceEditor.js');



  /*editor().tmplSource.addLink(tokenView(), function(source){
    if (source)
    {
      var decl = nsTemplate.makeDeclaration(source);
      tokenView().setSource(decl);

      var path;
      var curTemplateFile = editor().tmplEditor.delegate;
      if (curTemplateFile)
      {
        var filename = curTemplateFile.data.filename;
        if (filename)
          path = filename.substring(0, filename.lastIndexOf('/') + 1);
      }
        
      resourceEditor().setSource(decl, path);
    }
    else
    {
      tokenView().setSource();
      resourceEditor().setSource();
    }  
  });*/

   
  //
  // Inspect button
  //
  var inspectButton = new nsButton.Button({
    cssClassName: 'InspectButton',
    caption: 'Start Inspect',
    click: function(){
      inspect(!inspectMode);
    },
    container: editor().firstChild.element
  });
  
  var inspectMode = false;
  function inspect(mode){
    inspectMode = mode;
    classList(inspectButton.element).bool('active', inspectMode);

    if (inspectMode)
      app.transport.call('startTemplateInspect');
    else
      app.transport.call('endTemplateInspect');
  }
  


  //
  // result
  //
  var templater = new basis.ui.Container({
    template:
      '<div class="TemplaterPage">' +
        '<!--{inspectButton}-->' +
        '<!--{filelist}-->' +
        '<!--{resourceEditor}-->' + 
        //'<!--{tokenView}-->' +
        '<!--{editor}-->' +
      '</div>',

    binding: {
      filelist: 'satellite:',
      inspectButton: 'satellite:',
      resourceEditor: 'satellite:',
      //tokenView: 'satellite:',
      editor: 'satellite:'
    },
    satellite: {
      //tokenView: tokenView(),
      //inspectButton: inspectButton,
      editor: editor(),
      filelist: filelist(),
      resourceEditor: resourceEditor()
    }
  });

  var initFilelist = Function.runOnce(function(){
    templater.setSatellite('filelist', filelist());    

    filelist().tree.selection.addHandler({
      datasetChanged: function(selection, delta){
        var item = selection.pick();

        item = item && /tmpl$/.test(item.data.filename) ? item : null;

        editor().setDelegate(item);
        resourceEditor().setDelegate(item);
        tokenView().setDelegate(item);
      }
    });
  });

  //app.isServerOnline.addLink(null, function(value){
    initFilelist();
  //});

  if (chrome && chrome.extension)
  {
    app.transport.ready(function(){
      app.transport.call('getFileList'); 
    })
  }
  else
  {
    app.type.file.File({
      filename: 'basis/resource.css',
      type: 'file',
      content: 
        '#TemplateResourceList LI\n\
        {\n\
          padding: 0 0 0 16px;\n\
          margin: 0;\n\
        }'
    });

    app.type.file.File({
      filename: 'basis/resource.tmpl',
      type: 'file',
      content: 
        '{b:resource src="resource.css"}\n<li>{filename}</li>'
    });
  }

  app.transport.onMessage('pickTemplate', function(data){
    inspect(false);

    if (data.filename)
    {
      var fileNode = searchFileInTree(data.filename, filelist().tree);
      if (fileNode)
      {
        fileNode.select();
        fileNode.element.scrollIntoView();
      }
    }
    else if (data.content)
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
      {
        if (result = searchFileInTree(filename, child))
          break;
      }

    return result;
  }

  //
  // exports
  //

  exports = module.exports = templater;
  exports.filelist = filelist;
  exports.editor = editor;
  exports.tokenView = tokenView;

