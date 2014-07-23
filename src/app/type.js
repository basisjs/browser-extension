module.exports = {
  Client: require('./type/client.js'),
  Channel: require('./type/channel.js'),
  Profile: require('./type/profile.js'),
  AppProfile: require('./type/appProfile.js'),
  File: require('./type/file.js'),
  Warning: require('./type/warning.js')
};

require('basis.entity').validate();
