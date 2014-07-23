var entity = require('basis.entity');

var Client = entity.createType('Client', {
  id: entity.StringId,
  online: Boolean,
  devpanel: Boolean,
  title: String,
  location: String,
  channels: entity.createSetType('Channel')
});

Client.extendReader(function(data){
  data.channels = data.devpanel || null;
});

module.exports = Client;
