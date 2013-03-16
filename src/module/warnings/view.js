basis.require('basis.ui');
basis.require('app.type');

module.exports = new basis.ui.Node({
  active: true,
  dataSource: app.type.Warning.all,

  template: resource('template/view.tmpl'),

  childClass: {
    template: resource('template/warning.tmpl'),
    binding: {
      file: 'data:',
      message: 'data:',
      fatal: 'data:'
    }
  }
});