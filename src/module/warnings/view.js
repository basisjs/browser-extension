basis.require('basis.ui');
basis.require('app.type');

function processMessage(node){
  var bracketContent = [];
  var parts = node.data.message
    .replace(/\(.+?\)/g, function(m){
      bracketContent.push(m);
      return '\x00';
    })
    .split(/(\S:\s+)/);

  return {
    main: parts.slice(0, 2).join('').replace(/\x00/g, function(){ return bracketContent.pop() }),
    details: parts.slice(parts.length > 1 ? 2 : 1).join('').replace(/\x00/g, function(){ return bracketContent.pop() })
  };
}

module.exports = new basis.ui.Node({
  active: true,
  dataSource: app.type.Warning.all,
  delegate: app.type.AppProfile({}),

  template: resource('template/view.tmpl'),
  binding: {
    isOk: {
      events: 'childNodesModified stateChanged',
      getter: function(node){
        return !node.firstChild && node.state == basis.data.STATE.READY;
      }
    }
  },

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
    collapsed: true,

    template: resource('template/warning.tmpl'),
    binding: {
      fatal: 'data:',
      file: 'data:',
      message: 'data:',
      messageStart: function(node){
        return processMessage(node).main;
      },
      messageDetails: function(node){
        return processMessage(node).details;
      },
      linkOnStart: function(node){
        return Boolean(!processMessage(node).details && node.data.loc && node.data.loc[0]);
      },
      theme: 'data:theme',
      loc: function(node){
        return node.data.loc && node.data.loc[0];
      },
      locShort: function(node){
        var loc = node.data.loc && node.data.loc[0];
        if (loc)
        {
          var parts = loc.split(':');

          if (parts[0] == node.data.file)
            parts[0] = '';
          else
            parts[0] = basis.path.basename(parts[0]);

          return parts.join(':');
        }
      },
      collapsed: 'collapsed'
    },
    action: {
      openLoc: function(){
        var loc = this.data.loc && this.data.loc[0];
        if (loc)
          app.transport.invoke('openFile', loc);
      },
      expand: function(){
        this.collapsed = false;
        this.updateBind('collapsed');
      }
    },
    childClass: {
      template: resource('./template/warning-loc.tmpl'),
      binding: {
        loc: 'loc',
        locShort: function(node){
          var loc = node.loc;
          if (loc)
          {
            var parts = loc.split(':');

            if (parts[0] == node.file)
              parts[0] = '';
            else
              parts[0] = basis.path.basename(parts[0]);

            return parts.join(':');
          }
        }
      },
      action: {
        openLoc: function(){
          var loc = this.loc;
          if (loc)
            app.transport.invoke('openFile', loc);
        }
      }
    },
    handler: {
      update: function(){
        this.syncLocList();
      }
    },
    syncLocList: function(){
      var loc = this.data.loc;
      var file = this.data.file;
      if (loc && loc.length > 1)
        this.setChildNodes(loc.slice(1).map(function(item){
          return { loc: item, file: file };
        }));
    },
    init: function(){
      basis.ui.Node.prototype.init.call(this);
      this.syncLocList();
    }
  }
});
