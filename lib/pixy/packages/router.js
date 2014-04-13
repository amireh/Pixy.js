define([
  'underscore',
  './object',
  './history'
], function(_, PObject, history, undefined) {
  // Pixy.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;
  var history;

  // Set up all inheritable **Pixy.Router** properties and methods.
  var Router = PObject.extend({
    name: 'Router',

    /**
     * Create a new Router.
     *
     * @param {Object} [options={}]
     * @param {Object} [options.routes={}]
     *        Starting set of routes this router can handle.
     * @param {Pixy.History} [options.history=Pixy.history]
     *        A custom History instance, otherwise we'll use the global one.
     *
     * @throws {Error} If no history is defined globally or passed in.
     */
    constructor: function(options) {
      if (!options) {
        options = {};
      }

      return PObject.call(this, 'router', function() {
        if (!options) {
          options = {};
        }

        if (options.routes) {
          this.routes = options.routes;
        }

        this._bindRoutes();
      }, arguments);
    },

    /**
     * @override
     *
     * Installs a reference to the router in the Backbone.History registered
     * handler construct. This allows us to reference the router when the
     * history is about to navigate to one of its endpoints.
     *
     * The router can be found at:
     *
     * Backbone.history.handlers[0].router;
     */
    route: function() {
      this.__route.apply(this, arguments);

      history.handlers[0].router = this;

      return this;
    },

    toString: function() {
      return this.name || this.id;
    },

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    __route: function(route, name, callback) {
      var that = this;

      if (!_.isRegExp(route)) {
        route = this._routeToRegExp(route);
      }

      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }

      if (!callback) {
        callback = this[name];
      }

      history.route(route, function(fragment) {
        var args = that._extractParameters(route, fragment);

        if (callback) {
          callback.apply(that, args);
        }

        that.trigger.apply(that, ['route:' + name].concat(args));
        that.trigger('route', name, args);

        history.trigger('route', that, name, args);
      });

      return this;
    },

    // Simple proxy to `history` to save a fragment into the history.
    navigate: function(fragment, options) {
      history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }
  });

  return Router;
});