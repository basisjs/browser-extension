basis.require('basis.ui');
basis.require('app.type');

module.exports = new basis.ui.Node({
  active: true,
  dataSource: app.type.Warning.all,

  template: resource('template/view.tmpl'),

  grouping: {
    groupGetter: function(child){
      return child.data.file;
    },
    sorting: 'data.title || "-"',
    childClass: {
      template: resource('template/group.tmpl'),
      binding: {
        title: function(node){
          return node.data.title || '[no file]';
        },
        hasFilename: function(node){
          return node.data.title ? 'hasFilename' : '';
        }
      },
      action: {
        open: function(){
          if (this.data.id)
            app.transport.invoke('openFile', this.data.id);
        }
      }
    }
  },
  childClass: {
    template: resource('template/warning.tmpl'),
    binding: {
      fatal: 'data:',
      file: 'data:',
      message: 'data:',
      messageStart: function(node){
        var parts =  node.data.message.split(/(\S:\s+)/);
        if (parts.length > 1)
          return parts[0] + parts[1];
        else
          return parts[0];
      },
      messageDetails: function(node){
        var parts =  node.data.message.split(/(\S:\s+)/);

        return parts.slice(parts.length > 1 ? 2 : 1).join('');
      },
      theme: 'data:theme',
      loc: function(node){
        return node.data.loc;
      },
      locShort: function(node){
        if (node.data.loc)
        {
          var loc = basis.path.basename(node.data.loc).split(':');

          if (node.data.loc.indexOf(node.data.file) == 0)
            loc[0] = '';

          return loc.join(':')
        }
      }
    },
    action: {
      openLoc: function(){
        if (this.data.loc)
          app.transport.invoke('openFile', this.data.loc);
      }
    }
  }
});
