
  basis.require('basis.data');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.ui.label');

  var STATE = basis.data.STATE;

  var l10nType = resource('type.js')();

  var buttonPanel = new basis.ui.button.ButtonPanel({
    cssClassName: 'SaveButtonPanel',
    disabled: true,
    childNodes: [
      {
        autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
        name: 'save',
        caption: 'Save',
        cssClassName: 'SaveButton',

        click: function(){
          this.target.save();
          //l10nType.saveDictionary(this.target.DictionaryId);
        }
      },
      {
        autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
        caption: 'Cancel Changes',
        cssClassName: 'CancelButton',

        click: function(){
          this.target.reset();
          /*l10nType.Dictionary(this.target.DictionaryId).setState(STATE.READY);
          l10nType.resourceModifiedDataset.getItems().forEach(getter('rollback()'));*/
        }
      }
    ]
  });
  

  new basis.ui.label.Error({
    cssClassName: 'FileSaveErrorLabel',
    owner: buttonPanel,
    autoDelegate: basis.dom.wrapper.DELEGATE.OWNER,
    handler: {
      stateChanged: function(){
        basis.dom.insert(basis.dom.clear(this.tmpl.element), this.state.data);
      }
    }
  });

  var activityHandler = function(){
    if (!buttonPanel.target.modified || buttonPanel.state == STATE.PROCESSING)
      buttonPanel.disable();
    else
      buttonPanel.enable(); 

    var saveButtonCaption = buttonPanel.state == STATE.PROCESSING ? 'Saving...' : 'Save';
    buttonPanel.getButtonByName('save').setCaption(saveButtonCaption);
  }
  buttonPanel.addHandler({
    stateChanged: activityHandler,
    update: activityHandler
  });

  /*app.isServerOnline.addLink(buttonPanel, function(value){
    basis.cssom.display(this.element, !!value);
  });*/

  module.exports = buttonPanel;

