var entity = require('basis.entity');
var AppProfile = require('./appProfile.js');
var DatasetWrapper = require('basis.data').DatasetWrapper;

var Warning = entity.createType('Warning', {
  file: String,
  message: String,
  fatal: Boolean
});

var warningTrigger = new DatasetWrapper({
  delegate: AppProfile(),
  dataset: Warning.all,
  handler: {
    update: function(sender, delta){
      if ('warns' in delta)
        this.dataset.sync(this.data.warns || []);
    }
  }
});
Warning.all.setSyncAction(function(){
  warningTrigger.setActive(true);
});

module.exports = Warning;
