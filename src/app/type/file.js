
  basis.require('basis.data');
  basis.require('basis.entity');
  basis.require('basis.data.dataset');

  var nsEntity = basis.entity;
  var nsDataset = basis.data.dataset;

  var STATE = basis.data.STATE;
  
  var File = new nsEntity.EntityType({
    name: 'File',
    fields: {
      filename: nsEntity.StringId,
      type: String,
      content: function(value){ 
        return value == null ? null : String(value);
      },
      declaration: basis.fn.$self,
      resources: basis.fn.$self
    }
  });

  File.createFile = function(filename){
    app.transport.call('createFile', filename);
  };

  var FileClass = File.entityType.entityClass;

  FileClass.extend({
    read: function(){
      this.setState(STATE.PROCESSING);
      app.transport.call('readFile', this.data.filename);
    },
    save: function(){
      if (this.modified)
      {
        this.setState(STATE.PROCESSING);
        app.transport.call('saveFile', this.data.filename, this.data.content);
      }
    }
  });

  var fileHandler = function(){
    if (this.subscriberCount > 0 && (this.state == STATE.UNDEFINED || this.state == STATE.DEPRECATED))
      this.read();
  };
  FileClass.extend({
    state: STATE.UNDEFINED,
    event_subscribersChanged: function(){
      FileClass.superClass_.prototype.event_subscribersChanged.call(this);
      fileHandler.call(this);
    },
    event_stateChanged: function(oldState){
      FileClass.superClass_.prototype.event_stateChanged.call(this, oldState);
      fileHandler.call(this);
    }
  });

  app.transport.onMessage('filesChanged', function(data){
    var f;
    if (data.inserted)
      for (var i = 0, file; file = data.inserted[i]; i++)
      {
        if (file.content == "null")
          delete file.content;

        File(file);
      }

    if (data.deleted)
      for (var i = 0, filename; filename = data.deleted[i]; i++)
        File(filename).destroy();
  });

  app.transport.onMessage('updateFile', function(data){
    var file = File(data.filename);

    file.commit(data);

    file.setState(data.content == null ? STATE.UNDEFINED : STATE.READY);
  });


  //
  // Datasets
  //
  File.FilesByFolder = new nsDataset.Split({
    source: File.all,
    rule: function(object){
      var path = object.data.filename.split("/");
      path.pop();
      return path.join('/');
    }
  });

  var files = new nsDataset.Subset({
    source: File.all,
    rule: function(object){
      return object.data.type == 'file';
    }
  });

  File.FilesByType = new nsDataset.Split({
    source: files,
    rule: function(object){
      return object.data.filename.split('.').pop();
    }
  });


  module.exports = File;
