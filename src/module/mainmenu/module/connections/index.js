var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var DatasetWrapper = require('basis.data').DatasetWrapper;
var Client = require('app.type').Client;
var Channel = require('app.type').Channel;
var Expression = require('basis.data.value').Expression;
var transport = require('app.transport');

var storage = global.sessionStorage || {};
function persistentValue(name, defValue){
  return new Value({
    value: storage[name] ? JSON.parse(storage[name]) : defValue,
    handler: {
      change: function(){
        storage[name] = JSON.stringify(this.value);
      }
    }
  });
};

var autodp = persistentValue('acp-connection-auto-devpanel', false);
var selected = persistentValue('acp-connection-id');
var selectedClient = new basis.data.Object({
  delegate: selected.as(function(id){
    return Client.getSlot(id);
  })
});
var selectedOnline = Value.from(selectedClient, 'update', 'data.online');
var selectedDevpanel = Value.from(selectedClient, 'update', 'data.devpanel');
var wrapper = new DatasetWrapper({
  dataset: Value.from(selectedClient, 'update', 'data.channels'),
  handler: {
    itemsChanged: function(s, delta){
      Channel.current.set(this.pick());
    },
    datasetChanged: function(){ // due to bug, itemsChanged should be fired after new dataset is set
      Channel.current.set(this.pick());
    }
  }
});

module.exports = new Node({
  dataSource: Client.all,

  template: resource('./template/list.tmpl'),
  binding: {
    auto: autodp,
    selectedOnline: selectedOnline,
    curChannel: Channel.current.as(function(value){
      return value && value.data.id;
    })
  },
  action: {
    updateAuto: function(event){
      autodp.set(!!event.target.checked);
    }
  },

  childClass: {
    dataSource: Value.factory('update', 'data.channels'),
    template: resource('./template/client.tmpl'),
    binding: {
      title: 'data:',
      location: 'data:',
      online: 'data:',
      devpanel: 'data:',
      channels: 'data:',
      selected: selected.compute('update', function(node, selected){
        return node.data.id == selected;
      })
    },
    action: {
      select: function(){
        selected.set(this.data.id);
      }
    },
    childClass: {
      template: resource('./template/channel.tmpl'),
      binding: {
        id: 'data:'
      }
    }
  },
  handler: {
    childNodesModified: function(){
      if (!selected.value && this.firstChild)
        selected.set(this.firstChild.data.id);
    }
  }
});

new Expression(
  //selected,
  selectedOnline,
  selectedDevpanel,
  autodp,
  function(online, devpanel, auto){
    if (online && !devpanel && auto)
    {
      transport.initChannel(selected.value);
    }
  }
);
