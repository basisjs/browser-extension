module.exports = {
  Profile: require('./type/profile.js'),
  AppProfile: require('./type/appProfile.js'),
  Client: require('./type/client.js'),
  File: require('./type/file.js'),
  Warning: require('./type/warning.js')
};

require('basis.entity').validate();
