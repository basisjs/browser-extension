
  basis.require('basis.ui');
  basis.require('basis.dom.event');
  basis.require('basis.timer');


  // 
  // import names
  //
  var domEvent = basis.dom.event;


  //
  // main part
  //

  var memos = [];

  function syncAll(){
    memos.forEach(function(memo){
      memo.syncHeight();
    });
  }

  function sync(){
    this.value = this.tmpl.memo.value;
    this.updateBind('value');

    this.syncHeight();
  }
  
  var LiveMemo = basis.ui.Node.subclass({
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

        if (!this.intervalTimer)
          this.intervalTimer = setInterval(this.sync.bind(this), 100);
      },
      blur: function(event){
        this.focused = false;
        this.updateBind('focused');
        
        this.intervalTimer = clearInterval(this.intervalTimer);
      },
      resetScroll: function(event){
        domEvent.sender(event).scrollTop = 0;
      }
    },

    value: '',
    focused: false,
    timeoutTimer: null,
    intervalTimer: null,

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);

      memos.push(this);

      this.timeoutTimer = setTimeout(this.syncHeight.bind(this), 0);
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

      clearInterval(this.intervalTimer);
      clearTimeout(this.timeoutTimer);

      basis.ui.Node.prototype.destroy.call(this);
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

