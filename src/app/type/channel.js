var entity = require('basis.entity');

var Channel = entity.createType('Channel', {
  id: entity.StringId,
  client: 'Client'
});

module.exports = Channel;
