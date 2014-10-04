define([ 'react', 'lodash', 'rsvp', './util' ], function(React, _, RSVP, Util) {
  var extend = _.extend;
  var merge = _.merge;
  var slice = [].slice;
  var getName = Util.getName;

  var log = function() {
    var params = slice.call(arguments);
    var context = params[0];

    params[0] = getName(context) + ':';

    console.debug.apply(console, params);
  };

  /**
   * Required implementation:
   *
   *  statics: {
   *    getLayout: function(layoutName, props, state) {
   *      return myLayouts[layoutName];
   *    }
   *  }
   */
  return {
    getInitialState: function() {
      return {
      };
    },

    /**
     * Add a new component to a specific layout.
     *
     * @param {React.Class} component
     *        The component factory/type.
     *
     * @param {String} layoutName
     *        Name of the layout to add the component to.
     *
     * @param {Object} [options={}]
     *        Layout-exclusive options.
     *
     * @return {RSVP.Promise}
     */
    add: function(component, layoutName, options) {
      var newState, errorMessage;
      var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
      var svc = RSVP.defer();

      options = options || {};

      if (!layout) {
        return svc.reject('Unknown layout "' + layoutName + '"');
      }

      if (!layout.canAdd(component, options)) {
        errorMessage = 'Component ' + getName(component) +
                       ' can not be added to the layout ' + getName(layout);

        return svc.reject(errorMessage);
      }

      newState = layout.addComponent(component, options, this.state);

      if (!newState) {
        return svc.resolve();
      }

      log(this, 'adding component', getName(component), 'to layout', layoutName);

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    addMany: function(specs) {
      var newState;
      var svc = RSVP.defer();

      newState = specs.reduce(function(state, item) {
        var component = item.component;
        var layoutName = item.layoutName;
        var options = item.options || {};
        var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
        var stateEntry;

        if (!layout) {
          console.error('Unknown layout "' + layoutName + '"');
          return state;
        }

        if (!layout.canAdd(component, options)) {
          console.error(
            'Component ' + getName(component) +
            ' can not be added to the layout ' + getName(layout)
          );

          return state;
        }

        stateEntry = layout.addComponent(component, options, this.state);

        if (!stateEntry) {
          return state;
        }

        log(this, 'adding component', getName(component), 'to layout', layoutName);
        log(this, stateEntry);

        return merge(state, stateEntry);
      }.bind(this), {});

      console.log('Adding many components:', newState, 'from:', specs);

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    /**
     * Detach a component from a layout.
     *
     * @param  {React.Class} component
     *         The component you passed to #add and want to remove.
     *
     * @param  {String} layoutName
     *         The layout the component was mounted in.
     *
     * @return {RSVP.Promise}
     */
    remove: function(component, layoutName, options) {
      var newState;
      var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
      var svc = RSVP.defer();

      options = options || {};

      if (!layout) {
        return svc.reject('Unknown layout "' + layoutName + '"');
      }

      log(this, 'removing component', getName(component), 'from layout', layoutName);

      newState = layout.removeComponent(component, options, this.state);

      if (!newState) {
        return svc.resolve();
      }

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    /**
     * Create a renderable instance of a given layout and assign its children.
     *
     * @param  {React.Class} type
     *         The layout type/constructor.
     *
     * @param  {Object} [props={}]
     *         Layout-specific props, like "key" or "ref".
     *
     * @param  {Boolean} [dontTransferProps=false]
     *         Pass true if you don't want to pass all the props down to the
     *         layout.
     *
     * @return {React.Component}
     *         The renderable instance you can attach in #render().
     */
    renderLayout: function(type, props, dontTransferProps) {
      var layout = type(extend({}, props, {
        components: this.getLayoutChildren(type)
      }));

      return dontTransferProps ? layout : this.transferPropsTo(layout);
    },

    clearLayout: function(type) {
      var newState = {};
      newState[getName(type)] = undefined;
      this.setState(newState);
    },

    /**
     * @internal
     *
     * The components that were added to the layout. The manager doesn't really
     * know what to do with this set, but the layouts do. It is passed to them
     * as the "components" property and they should know how to render them.
     *
     * @param  {React.Class} type
     *         The layout to search for its children.
     *
     * @return {Mixed}
     *         The set of component types the layout can render. This differs
     *         between layouts, refer to its documentation for the structure
     *         of this output.
     */
    getLayoutChildren: function(type) {
      return this.state[getName(type)];
    }
  };
});