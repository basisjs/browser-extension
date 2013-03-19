basis.require('basis.entity');
basis.require('app.transport');

var arrayOrEmpty = function(value){
  return Array.isArray(value)
    ? value
    : [];
};

var AppProfile = new basis.entity.EntityType({
  name: 'AppProfile',
  singleton: true,
  fields: {
    files: arrayOrEmpty,
    links: arrayOrEmpty,
    warns: arrayOrEmpty,
    l10n: basis.fn.$self
  }
});

var appProfile = AppProfile();
var timer;

app.transport.onMessage('fileGraph', function(data){
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
  app.transport.invoke('getFileGraph');
});

module.exports = AppProfile;