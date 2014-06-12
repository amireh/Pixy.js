define([ 'underscore', '../../config' ], function(_, Config) {
  var uniq = _.uniq;
  var keys = _.keys;
  var rootRoute;

  /** @internal */
  var extractKeys = function(oldKeys, newProps) {
    return uniq(keys(newProps).concat(oldKeys || []));
  };

  var setProps = function(props, route, callback) {
    if (!rootRoute) {
      rootRoute = Config.getRootRoute();
    }

    console.assert(rootRoute, 'You must assign a root route that responds to' +
    ' #update and #ready() to use the PropsMixin.');

    // We need to be sure that the layout has been mounted before we attempt
    // to update the props.
    //
    // This is really smelly but it's necessary.
    rootRoute.ready(function() {
      route.trigger('update', props);

      if (callback) {
        callback.call(route);
      }
    });
  };

  /**
   * @class Mixins.Routes.Props
   *
   * Utility for injecting props into the master layout.
   *
   * The mixin automatically takes care of cleaning up any props you inject
   * after the route exits.
   */
  return {
    mixinProps: {
      /** @internal  */
      _propKeys: [],

      update: function(props) {
        setProps(props, this, function() {
          // Track the injected props so we can clean them up on exit.
          this._propKeys = extractKeys(this._propKeys, props);
        });
      },
    },

    afterModel: function(model) {
      this.context = this.context || model;
    },

    exit: function() {
      var props = this._propKeys.reduce(function(props, key) {
        props[key] = undefined;
        return props;
      }, {});

      setProps(props, this);
    }
  };
});