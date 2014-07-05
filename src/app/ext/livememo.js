
var Node = require('basis.ui').Node;
var domEvent = require('basis.dom.event');


//
// main part
//

var memos = [];
var syncAllTimer;

function syncAll(){
  syncAllTimer = null;
  memos.forEach(function(memo){
    memo.syncHeight();
  });
}

function sync(){
  this.value = this.tmpl.memo.value;
  this.updateBind('value');

  this.syncHeight();
}

var LiveMemo = Node.subclass({
  template: resource('livememo/livememo.tmpl'),
  binding: {
    value: 'value',
    height: function(node){
      return node.height ? node.height + 'px' : '1.2em';
    },
    focused: function(node){
      return node.focused ? 'focused' : '';
    }
  },
  action: {
    change: sync,
    keyup: sync,
    keydown: function(event){
      if (domEvent.key(event) == domEvent.KEY.ENTER)
        domEvent.kill(event);
      else
        this.sync();
    },
    focus: function(event){
      this.focused = true;
      this.updateBind('focused');

      if (!this.timer)
        this.timer = setInterval(this.sync.bind(this), 100);
    },
    blur: function(event){
      this.focused = false;
      this.updateBind('focused');

      this.timer = clearInterval(this.timer);
    },
    resetScroll: function(event){
      domEvent.sender(event).scrollTop = 0;
    }
  },

  value: '',
  focused: false,
  timer: null,

  init: function(){
    Node.prototype.init.call(this);

    memos.push(this);
    if (!syncAllTimer)
      syncAllTimer = setTimeout(syncAll, 0);
  },
  setText: function(text){
    this.value = text;
    this.updateBind('value');

    this.syncHeight(this);
  },
  sync: sync,
  syncHeight: function(){
    this.height = this.tmpl.shadowMemo.scrollHeight;
    this.updateBind('height');
  },

  destroy: function(){
    memos.remove(this);
    clearInterval(this.timer);

    Node.prototype.destroy.call(this);
  }
});

domEvent.addHandler(window, 'resize', syncAll);

//
// export names
//

module.exports = {
  LiveMemo: LiveMemo,
  syncAll: syncAll
};
