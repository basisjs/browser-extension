basis.require('basis.data');
basis.require('basis.entity');
basis.require('app.transport');

var nsEntity = basis.entity;
var STATE = basis.data.STATE;


//
// define type
//  
var File = new nsEntity.EntityType({
  name: 'File',
  fields: {
    filename: nsEntity.StringId,
    lastUpdate: String,
    content: function(value){ 
      return value == null ? null : String(value);
    },
    declaration: basis.fn.$self,
    resources: basis.fn.$self
  }
});


//
// extensions
//
File.createFile = function(filename){
  app.transport.invoke('createFile', filename);
};

File.entityType.entityClass.extend({
  state: STATE.UNDEFINED,
  syncAction: function(){
    this.read();
  },
  read: function(){
    this.setState(STATE.PROCESSING);
    app.transport.invoke('readFile', this.data.filename);
  },
  save: function(){
    if (this.modified)
    {
      this.setState(STATE.PROCESSING);
      app.transport.invoke('saveFile', this.data.filename, this.data.content);
    }
  }
});


//
// transport binding
//
app.transport.onMessage({
  filesChanged: function(data){
  if (data.inserted)
    for (var i = 0, file; file = data.inserted[i]; i++)
      File(file);

  if (data.deleted)
    for (var i = 0, filename; filename = data.deleted[i]; i++)
      File(filename).destroy();
  },
  updateFile: function(data){
    var file = File(data.filename);

    file.update(data);
    file.setState(data.content == null ? STATE.UNDEFINED : STATE.READY);
  }
});


//
// export
//
module.exports = File;
