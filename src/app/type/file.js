var entity = require('basis.entity');
var STATE = require('basis.data').STATE;
var transport = require('app.transport');


//
// define type
//
var File = entity.createType('File', {
  filename: entity.StringId,
  lastUpdate: String,
  content: function(value){
    return value == null ? null : String(value);
  },
  declaration: basis.fn.$self,
  resources: basis.fn.$self
});


//
// extensions
//
File.createFile = function(filename){
  transport.invoke('createFile', filename);
};

File.extendClass({
  syncAction: function(){
    this.read();
  },
  read: function(){
    this.setState(STATE.PROCESSING);
    transport.invoke('readFile', this.data.filename);
  },
  save: function(){
    if (this.modified)
    {
      this.setState(STATE.PROCESSING);
      transport.invoke('saveFile', this.data.filename, this.data.content);
    }
  }
});


//
// transport binding
//
transport.on({
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
