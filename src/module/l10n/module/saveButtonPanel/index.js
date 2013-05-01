
  basis.require('basis.data');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.ui.label');

  var STATE = basis.data.STATE;

  var activityHandler = function(){
    if (!this.target.modified || this.state == STATE.PROCESSING)
      this.disable();
    else
      this.enable();
  };

  module.exports = new basis.ui.button.ButtonPanel({
    inactive: true,
    disabled: true,

    template: resource('template/saveButtonPanel.tmpl'),

    binding: {
      inactive: 'inactive'
    },

    handler: {
      stateChanged: activityHandler,
      update: activityHandler
    },

    childNodes: [
      {
        autoDelegate: true,
        caption: 'Save',

        click: function(){
          this.target.save();
        },

        handler: {
          stateChanged: function(){
            this.setCaption(this.state == STATE.PROCESSING ? 'Saving...' : 'Save');
          }
        }
      },
      {
        autoDelegate: true,
        caption: 'Rollback',

        click: function(){
          this.target.reset();
        }
      }
    ],
    satellite: {
      saveButton: new basis.ui.label.Error({
        autoDelegate: true,
        handler: {
          stateChanged: function(){
            basis.dom.insert(basis.dom.clear(this.tmpl.element), this.state.data);
          }
        }
      })
    }
  });
