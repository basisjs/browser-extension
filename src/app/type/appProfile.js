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
var timer;

transport.onMessage('fileGraph', function(data){
  clearTimeout(timer);
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
  clearTimeout(timer);
  timer = setTimeout(function(){
    appProfile.setState(basis.data.STATE.ERROR, 'Timeout');
  }, 10000); // 10 sec timeout

  appProfile.setState(basis.data.STATE.PROCESSING);
  transport.invoke('getFileGraph');
});

module.exports = AppProfile;
