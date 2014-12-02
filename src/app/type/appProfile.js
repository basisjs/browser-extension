var entity = require('basis.entity');
var transport = require('app.transport');

var AppProfile = entity.createType({
  name: 'AppProfile',
  singleton: true,
  fields: {
    files: Array,
    links: Array,
    warns: Array,
    l10n: basis.fn.$self
  }
});

var appProfile = AppProfile();

// appProfile.setSyncAction(function(){
//   transport.invoke('getFileGraph', null, null, this);
//});

module.exports = AppProfile;
