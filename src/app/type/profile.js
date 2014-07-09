var entity = require('basis.entity');

var Profile = entity.createType({
  name: 'Profile',
  singleton: true,
  fields: {
    online: Boolean
  }
});

module.exports = Profile;
