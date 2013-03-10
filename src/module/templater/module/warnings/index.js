module.exports = new basis.ui.Node({
  autoDelegate: true,
  template: resource('template/view.tmpl'),

  childClass: {
    template: resource('template/item.tmpl'),
    binding: {
      title: 'title'
    }
  },
  _update: function(){
    this.setChildNodes((this.data.declaration &&this.data.declaration.warns || []).map(function(title){
      return {
        title: title
      }
    }));
  },
  handler: {
    update: function(object, delta){
      this._update();
    },
    targetChanged: function(){
      this._update();
    }
  }
});