basis.require('basis.entity');

var AppProfile = resource('appProfile.js').fetch();

var Warning = new basis.entity.EntityType({
  name: 'Warning',
  fields: {
    file: String,
    message: String,
    loc: String,
    theme: String,
    fatal: Boolean
  }
});

Warning.all.setDelegate(AppProfile());
Warning.all.setSyncAction(function(){
  this.setActive(true);
});
Warning.all.addHandler({
  update: function(sender, delta){
    if ('warns' in delta)
      this.sync(this.data.warns || []);
  }
});

module.exports = Warning;
