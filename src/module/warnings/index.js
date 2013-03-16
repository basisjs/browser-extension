basis.require('basis.data.index');
basis.require('app.type');

module.exports = {
  name: 'warnings',
  title: 'Warnings',

  tabExt: {
    template: resource('template/tab.tmpl'),
    binding: {
      count: basis.data.index.count(app.type.Warning.all)
    }
  },

  lazyContent: resource('view.js')
};