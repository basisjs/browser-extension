
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.layout');
  basis.require('basis.ui');
  basis.require('basis.ui.tree');

  //
  // import names
  //

  var wrapper = Function.wrapper;

  var DOM = basis.dom;
  var domEvent = basis.dom.event;
  var classList = basis.cssom.classList;

  var UINode = basis.ui.Node;

  var nsTemplate = basis.template;
  var nsLayout = basis.layout;
  var nsTree = basis.ui.tree;
  var nsResizer = basis.ui.resizer;


  //
  // Main part
  //

  var TYPE_TAG = 1;
  var TYPE_ATTRIBUTE = 2;
  var TYPE_TEXT = 3;
  var TYPE_COMMENT = 8;

  var TOKEN_TYPE = 0
  var TOKEN_BINDINGS = 1;
  var TOKEN_REFS = 2;

  var ATTR_NAME = 3;
  var ATTR_VALUE = 4;

  var ELEMENT_NAME = 3;
  var ELEMENT_ATTRS = 4;
  var ELEMENT_CHILDS = 5;

  var TEXT_VALUE = 3;
  var COMMENT_VALUE = 3;


 /**
  * @class
  */
  var TemplateNode = nsTree.Folder.subclass({
    action: {
      edit: function(event){
        //lazy_EditPanel(this);
        domEvent.kill(event);
      }
    },

    binding: {
      refList: 'satellite:',
      hasRefs: function(node){
        return node.data[TOKEN_REFS] ? 'hasRefs' : '';
      }
    },

    satelliteConfig: {
      refList: {
        existsIf: function(object){
          return object.data[TOKEN_REFS];
        },
        instanceOf: UINode.subclass({
          template: resource('templates/referenceList.tmpl'),

          childClass: {
            template: resource('templates/reference.tmpl'),

            binding: {
              title: 'title'
            }
          }
        }),
        config: function(owner){
          return {
            childNodes: owner.data[TOKEN_REFS].map(wrapper('title'))
          }
        }
      }
    }
  });


 /**
  * @class
  */
  var AttributeValuePart = UINode.subclass({
    template: resource('templates/attributeValuePart.tmpl'),

    binding: {
      text: 'data:'
    }
  });


 /**
  * @class
  */
  var AttributeClassBinding = AttributeValuePart.subclass({
    template: resource('templates/attributeClassBinding.tmpl')
  });


 /**
  * @class
  */
  var AttributeValueBinding = AttributeValuePart.subclass({
    template: resource('templates/attributeValueBinding.tmpl')
  });


 /**
  * @class
  */
  var Attribute = UINode.subclass({
    template: resource('templates/attribute.tmpl'),

    binding: {
      name: function(object){
        return object[ATTR_NAME];
      },
      value: function(object){
        return object[ATTR_VALUE];
      },
      hasValue: function(object){
        return object[ATTR_VALUE] ? 'hasValue' : '';
      },
      isEvent: function(object){
        return /^event-(.+)+/.test(object[ATTR_NAME]) ? 'isEvent' : '';
      }
    },

    childClass: AttributeValuePart,

    init: function(){
      var attrParts = [];
      var attrValue = this[ATTR_VALUE];
      var attrName = this[ATTR_NAME];
      var bindings = this[TOKEN_BINDINGS];
      var addValue = !bindings;

      if (bindings)
      {
        if (attrName == 'class')
        {
          if (attrValue)
            addValue = true;

          var list = bindings;
          for (var b = 0, bind; bind = bindings[b]; b++)
            attrParts.push(new AttributeClassBinding({
              data: {
                text: bind[0] + '{' + bind[1] + '}'
              }
            }));
        }
        else if (attrName == 'style')
        {
          for (var i = 0; i < bindings.length; i++)
          {
            var dict = bindings[i][0];
            var list = bindings[i][1];

            attrParts.push(new AttributeValuePart({
              data: {
                text: bindings[i][2] + ':'
              }
            }));

            for (var b = 0; b < list.length; b++)
            {
              if (typeof list[b] == 'string')
                attrParts.push(new AttributeValuePart({
                  data: {
                    text: list[b]
                  }
                }));
              else
                attrParts.push(new AttributeValueBinding({
                  data: {
                    text: '{' + dict[list[b]] + '}'
                  }
                }));
            }

            attrParts.push(new AttributeValuePart({
              data: {
                text: ';'
              }
            }));
          }
        }
        else
        {
          var dict = bindings[0];
          var list = bindings[1];
          for (var b = 0; b < list.length; b++)
          {
            if (typeof list[b] == 'string')
              attrParts.push(new AttributeValuePart({
                data: {
                  text: list[b]
                }
              }));
            else
              attrParts.push(new AttributeValueBinding({
                data: {
                  text: '{' + dict[list[b]] + '}'
                }
              }));
          }
        }
      }

      if (addValue && attrValue)
        attrParts.unshift(new AttributeValuePart({
          data: {
            text: attrValue
          }
        }));

      this.childNodes = attrParts;

      UINode.prototype.init.call(this);
    }
  });


 /**
  * @class
  */
  var AttributeList = UINode.subclass({
    template: resource('templates/attributeList.tmpl'),

    childClass: Attribute
  });


 /**
  * @class
  */
  var TagNode = TemplateNode.subclass({
    template: resource('templates/tag.tmpl'),

    binding: {
      attributeList: 'satellite:',
      title: function(object){
        return object.data[ELEMENT_NAME];
      }
    },

    satelliteConfig: {
      attributeList: {
        existsIf: function(object){
          return object.data[ELEMENT_ATTRS];
        },

        instanceOf: AttributeList,

        config: function(owner){
          return {
            childNodes: owner.data[ELEMENT_ATTRS]
          }
        }
      }
    }
  });


 /**
  * @class
  */
  var TextNode = TemplateNode.subclass({
    template: resource('templates/text.tmpl'),

    binding: {
      value: function(object){
        return (object.data[TEXT_VALUE] && object.data[TEXT_VALUE].replace(/\r\n?|\n\r?/g, '\u21b5')) || ('{' + object.data[1] + '}');//.replace(/\r\n?|\n\r?/g, '\u21b5');
      }
    }
  });


 /**
  * @class
  */
  var CommentNode = TemplateNode.subclass({
    template: resource('templates/comment.tmpl'),

    binding: {
      title: function(object){
        return object.data[COMMENT_VALUE] || '{' + object.data[1] + '}';//object.data[COMMENT_VALUE];
      }
    }
  });


  var NODE_FACTORY_MAP = {}

  NODE_FACTORY_MAP[TYPE_TAG] = TagNode;
  NODE_FACTORY_MAP[TYPE_TEXT] = TextNode;
  NODE_FACTORY_MAP[TYPE_COMMENT] = CommentNode;

  var nodeFactory = function(config){
    return new NODE_FACTORY_MAP[config[TOKEN_TYPE]]({
      data: config,
      childNodes: config[ELEMENT_CHILDS],
      childFactory: nodeFactory
    });
  }

  var resourceList = new basis.ui.Container({
    template: resource('templates/resourceList.tmpl'),
    childClass: {
      template: resource('templates/resource.tmpl'),
      binding: {
        filename: 'data:'
      }
    }
  });

  var tree = new nsTree.Tree({
    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,

    template: resource('templates/tree.tmpl'),
    action: {
      focus: function(){
        classList(this.element.parentNode.parentNode).add('focus');
      },
      blur: function(){
        classList(this.element.parentNode.parentNode).remove('focus');
      },
      keydown: function(event){
        var key = domEvent.key(event);
        var selected = this.selection.pick();

        switch (key)
        {
          case domEvent.KEY.UP:
          case domEvent.KEY.DOWN:
            var node;
            var axis = this.childAxis;
            var first = axis[0];
            var last = axis[axis.length - 1];

            if (selected)
            {
              var idx = axis.indexOf(selected);

              node = key == domEvent.KEY.UP ? axis[idx - 1] || last : axis[idx + 1] || first;
            }
            else
              node = key == domEvent.KEY.UP ? last : first;

            if (node)
              node.select();

            domEvent.kill(event);
            break;
        }
      }
    },

    childFactory: nodeFactory,

    handler: {
      childNodesModified: function(object, delta){
        this.childAxis = DOM.axis(this, DOM.AXIS_DESCENDANT);
      },
      update: function(object, delta){
        if ('declaration' in delta)
          this.updateDeclaration(this.data.declaration);
      },
      targetChanged: function(){
        this.updateDeclaration(this.target && this.data.declaration);
      }
    },

    updateDeclaration: function(declaration){
      this.setChildNodes(declaration && declaration.tokens || [])
    }
  });


 /**
  * panel
  */
  var widget = new basis.ui.Node({
    expanded: false,
    template: resource('templates/widget.tmpl'),

    binding: {
      expanded: function(object){
        return object.expanded ? 'expanded' : '';
      }
    },

    action: {
      toggle: function(){
        this.expanded = !this.expanded;
        this.updateBind('expanded');
      }
    },

    
    childNodes: tree
  });


  //
  // export names
  //

  module.exports = widget;
