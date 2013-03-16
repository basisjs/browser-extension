basis.require('basis.ui');
basis.require('app.type');

module.exports = new basis.ui.Node({
  active: true,
  dataSource: app.type.Warning.all,

  template: resource('template/view.tmpl'),

  grouping: {
    groupGetter: function(child){
      return child.data.file || '[no file]';
    },
    sorting: 'data.title',
    childClass: {
      template: resource('template/group.tmpl'),
      binding: {
        title: 'data:'
      }
    }
  },
  childClass: {
    template: resource('template/warning.tmpl'),
    binding: {
      file: 'data:',
      message: 'data:',
      fatal: 'data:'
    }
  }
});