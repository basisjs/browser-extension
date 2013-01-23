
  basis.require('basis.ui');
  basis.require('basis.dom.event');

  var Event = basis.dom.event;
  
  var LiveMemo = basis.ui.Node.subclass({
    template: resource('livememo/livememo.tmpl'),

    action: {
      change: function(event){ 
        this.updateMemo(); 
      },
      keyup: function(event){
        this.updateMemo();
      },
      keydown: function(event){
        if (Event.key(event) == Event.KEY.ENTER)
          Event.kill(event);
      },
      focus: function(event){
        if (!this.timer)
          this.timer = setInterval(this.updateMemo.bind(this), 100);
      },
      blur: function(event){
        clearTimeout(this.timer);
        delete this.timer;
      }
    },

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);
      //this.inherit(config);

      memos[this.basisObjectId] = this;

      basis.dom.event.addHandler(this.element, 'scroll', function(){
        this.element.scrollTop = 0;
      });

      this.cachedValue = undefined;
      this.tmpl.memo.value = this.tmpl.shadowMemo.value = this.text || '';
      this.cachedScrollHeight = this.tmpl.shadowMemo.scrollHeight;

      this.updateMemo();
      setTimeout(this.updateMemo.bind(this), 0);
    },
    setText: function(text){
      this.tmpl.memo.value = this.tmpl.shadowMemo.value = text;
      this.updateMemo();        
    },
    updateMemo: function(){
      var newValue = this.tmpl.memo.value;
      if (newValue !== this.cachedValue)
        this.tmpl.shadowMemo.value = this.cachedValue = newValue;

      var scrollHeight = this.tmpl.shadowMemo.scrollHeight;
      basis.cssom.setStyle(this.tmpl.memo, {
        height: scrollHeight ? scrollHeight + 'px' : '1.2em'
      });
    },
    destroy: function(){
      delete memos[this.basisObjectId];

      clearInterval(this.timer);
      delete this.timer;

      basis.ui.Node.prototype.destroy.call(this);
    }
  });

  var memos = {};
  function updateMemos(){
    for (var i in memos)
      memos[i].updateMemo();
  }
  basis.dom.event.addHandler(window, 'resize', updateMemos);

  module.exports = {
    LiveMemo: LiveMemo,
    updateMemos: updateMemos
  }

