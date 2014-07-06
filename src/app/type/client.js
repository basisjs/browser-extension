var entity = require('basis.entity');

var Client = entity.createType('Client', {
  id: entity.StringId,
  online: Boolean,
  title: String,
  location: String
});

module.exports = Client;
