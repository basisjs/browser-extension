var entity = require('basis.entity');
var transport = require('app.transport');
var Value = require('basis.data').Value;

var Channel = entity.createType('Channel', {
  id: entity.StringId,
  client: function(value){
    return value ? String(value) : null;
  }
});

Channel.current = new Value();
Channel.extendClass({
  request: function(action, args, callback){
    transport.invoke(action, this.data.client, this.data.id, args, callback);
  }
});

module.exports = Channel;
