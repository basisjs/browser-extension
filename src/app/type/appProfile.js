basis.require('basis.entity');

var AppProfile = new basis.entity.EntityType({
  name: 'AppProfile',
  singleton: true,
  fields: {
    files: Object,
    links: Object,
    warns: Object
  }
});

var appProfile = AppProfile();

app.transport.onMessage('fileGraph', function(data){
  if (data && !data.err && data.data)
  {
    appProfile.setState(basis.data.STATE.READY);
    appProfile.update(data.data.toObject());
  }
  else
    appProfile.setState(basis.data.STATE.ERROR, (data && data.err) || 'Wrong data from server');
});

appProfile.setState(basis.data.STATE.UNDEFINED);
appProfile.setSyncAction(function(){
  this.setState(basis.data.STATE.PROCESSING);
  app.transport.call('getFileGraph');
});

module.exports = AppProfile;