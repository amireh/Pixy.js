define([ 'react', 'underscore', './util' ], function(React, _, Util) {
  var without = _.without;
  var update = React.addons.update;
  var getName = Util.getName;

  return {
    statics: {
      canAdd: function(/*component, options*/) {
        return true;
      },

      /**
       * @return {Boolean}
       *         Whether the layout has any components to render.
       */
      isEmpty: function(props, state) {
        var components = props ? props.components : state[getName(this)];
        return !components || components.length < 1;
      },

      /**
       * @internal
       */
      addComponent: function(component, state) {
        var newState = {};
        var layoutName = getName(this);

        if (!state[layoutName]) {
          newState[layoutName] = [ component ];
        } else {
          newState[layoutName] = update(state[layoutName], {
            $unshift: [ component ]
          });
        }

        return newState;
      },

      /**
       * @internal
       */
      removeComponent: function(component, state) {
        var newState = {};
        var layoutName = getName(this);

        newState[layoutName] = without(state[layoutName], component);

        return newState;
      }
    },

    getDefaultProps: function() {
      return {
      /** @internal */
        components: []
      };
    },

    getNextComponentType: function() {
      return this.props.components[0];
    },

    renderComponent: function(initialProps, dontTransferProps) {
      var type = this.getNextComponentType();

      if (type) {
        return dontTransferProps ?
          type(initialProps) :
          this.transferPropsTo(type(initialProps));
      } else {
        return undefined;
      }
    }
  };
});