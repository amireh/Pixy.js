define([ 'react', 'underscore', './util' ], function(React, _, Util) {
  var contains = _.contains;
  var update = React.addons.update;
  var render = Util.render;
  var getName = Util.getName;

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
        var outlets = props ? props.components : state[getName(this)];

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
        var layoutName = getName(this);
        var outlet = options.outlet || getDefaultOutlet(this);
        var newState = {};

        //>>excludeStart("production", pragmas.production);
        var outletOccupant = (state[layoutName] || {})[outlet];
        if (outletOccupant && component) {
          console.assert(false, "Outlet ", outlet, " is occupied by",
            Util.getStatic(outletOccupant, 'displayName'));
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

    /**
     * @param  {String}  outlet
     *         The outlet you want to test.
     *
     * @return {Boolean}
     *         Whether the specified outlet has a component to be occupied with.
     */
    hasOutletOccupant: function(outlet) {
      return !!getOutletOccupant(outlet, this.props);
    },

    renderOutlet: function(outlet, initialProps, dontTransferProps) {
      return render.apply(this, [
        getOutletOccupant(outlet, this.props),
        initialProps,
        dontTransferProps
      ]);
    }
  };
});