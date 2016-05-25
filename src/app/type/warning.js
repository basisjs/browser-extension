var entity = require('basis.entity');
var AppProfile = require('./appProfile.js');
var DatasetWrapper = require('basis.data').DatasetWrapper;

function nullOrString(value){
  return typeof value == 'string' ? value : null;
}

var Warning = new basis.entity.EntityType({
  name: 'Warning',
  fields: {
    file: String,
    message: String,
    loc: function(value){
      if (Array.isArray(value))
        return value;
      if (value)
        return [value];
      return null;
    },
    theme: String,
    isolate: nullOrString,
    originator: nullOrString,
    fatal: Boolean
  }
});
Warning.all.setSyncAction(function(){
  this.setActive(true);
});
Warning.all.addHandler({
  update: function(sender, delta){
    if ('warns' in delta)
      this.sync((this.data.warns || []).map(Warning.reader));
  }
});

module.exports = Warning;
