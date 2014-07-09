var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var Client = require('app.type').Client;
var Expression = require('basis.data.value').Expression;
var transport = require('app.transport');

var storage = global.sessionStorage || {};
function persistentValue(name, defValue){
  return new basis.data.Value({
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
  delegate: basis.data.Value.from(selected, 'change', function(val){
    return Client.getSlot(val.value);
  })
});
var selectedOnline = basis.data.Value.from(selectedClient, 'update', 'data.online');
var selectedDevpanel = basis.data.Value.from(selectedClient, 'update', 'data.devpanel');


module.exports = new Node({
  dataSource: Client.all,

  template: resource('./template/list.tmpl'),
  binding: {
    auto: autodp,
    selectedOnline: selectedOnline
  },
  action: {
    updateAuto: function(event){
      autodp.set(!!event.target.checked);
    }
  },

  childClass: {
    template: resource('./template/item.tmpl'),
    binding: {
      title: 'data:',
      location: 'data:',
      online: 'data:',
      devpanel: 'data:',
      selected: selected.compute('update', function(node, selected){
        return node.data.id == selected;
      })
    },
    action: {
      select: function(){
        selected.set(this.data.id);
      }
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
      transport.invoke('init-devpanel', selected.value, null, function(err){
        if (err)
          console.log(err);
      });
    }
  }
);
