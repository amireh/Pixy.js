define([ 'react', 'underscore', './util' ], function(React, _, Util) {
  var contains = _.contains;
  var update = React.addons.update;

  var getOutletOccupant = function(outlet, props) {
    var type = props.components[outlet];

    if (!type) {
      return undefined;
    }
    else if (type && 'function' === typeof type.canMount) {
      return type.canMount(props) ? type : undefined;
    }
    else {
      return type;
    }
  };

  var getDefaultOutlet = function(type) {
    return type.defaultOutlet;
  };

  return {
    statics: {
      canAdd: function(component, options) {
        var outlets = this.availableOutlets ? this.availableOutlets() : [];

        return contains(outlets, options.outlet || getDefaultOutlet(this));
      },

      /**
       * @return {Boolean}
       *         Whether any of the layout outlets are currently occupied by
       *         a component.
       */
      isEmpty: function(props, state) {
        var outlet;
        var outlets = props ? props.components : state[Util.getName(this)];

        for (outlet in outlets) {
          if (outlets.hasOwnProperty(outlet) && !!outlets[outlet]) {
            return false;
          }
        }

        return true;
      },

      /**
       * @internal Assign a new outlet component.
       *
       * @param {React.Class} component
       *        The component type/constructor.
       *
       * @param {Object} options (required)
       * @param {String} outlet (required)
       *        Name of the outlet to mount the component in.
       *        If left unspecified, the primary outlet will be assumed.
       *
       * @param {Object} state
       *        The layout manager's state.
       *
       * @return {Object}
       *         The new layout manager's state that contains the newly added
       *         component.
       */
      addComponent: function(component, options, state) {
        var subState;
        var layoutName = Util.getName(this);
        var outlet = options.outlet || getDefaultOutlet(this);
        var newState = {};

        //>>excludeStart("production", pragmas.production);
        var outletOccupant = (state[layoutName] || {})[outlet];
        if (outletOccupant && component) {
          console.assert(false, "Outlet ", outlet, " is occupied by",
            outletOccupant.type.displayName);
        }
        //>>excludeEnd("production");

        if (!state[layoutName]) {
          newState[layoutName] = {};
          newState[layoutName][outlet] = component;
        }
        else {
          subState = {};
          subState[outlet] = {
            $set: component
          };

          newState[layoutName] = update(state[layoutName], subState);
        }

        return newState;
      },

      /**
       * @private
       */
      removeComponent: function(component, options, state) {
        var outlets, outlet, found;
        var layoutName = Util.getName(this);

        outlet = options.outlet || getDefaultOutlet(this);

        // if no "outlet" option was passed in, try to locate the outlet using
        // the component itself if it was occupying one
        if (!outlet) {
          outlets = state[layoutName];

          for (outlet in outlets) {
            if (outlets[outlet] === component) {
              found = true;
              break;
            }
          }

          if (!found) {
            return undefined;
          }
        }

        return this.addComponent(undefined, { outlet: outlet }, state);
      }
    },

    getDefaultProps: function() {
      return {
        /** @internal */
        components: {}
      };
    },

    renderOutlet: function(outlet, initialProps, dontTransferProps) {
      var type = getOutletOccupant(outlet, this.props);

      if (!type) {
        return false;
      }

      return dontTransferProps ?
        type(initialProps) :
        this.transferPropsTo(type(initialProps));
    }
  };
});