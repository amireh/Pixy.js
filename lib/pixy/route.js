define([
  'underscore',
  './util/extend',
  './util/get',
  './namespace',
  './core/registry',
  './core/router',
  './mixins/events'
], function(_, extendPrototype, get, Pixy, Registry, Router, Events) {
  var extend = _.extend;
  var omit = _.omit;
  var pick = _.pick;
  var pluck = _.pluck;
  var compact = _.compact;
  var keys = _.keys;

  /**
   * @property {Object} routeMap
   * @private
   *
   * A map of the registered route handlers.
   */
  var routeMap = {};
  var lifeCycleHooks = [ 'beforeModel', 'model', 'afterModel', 'enter', 'exit' ];
  var eventHooks = [ 'willTransition', 'didTransition' ];
  var allHooks = lifeCycleHooks.concat(eventHooks);

  var registerRoute = function(name, route) {
    routeMap[name] = route;
  };

  var EventedMixin = {
    exit: function() {
      this.stopListening();
    }
  };

  /**
   * @class Pixy.Route
   *
   * A router.js target handler.
   *
   * @param {String} name (required)
   *        A unique name for the route that will be defined in the routeMap.
   *
   * @param {Object} proto
   *        Your route definition.
   *
   * @param {Boolean} [dontRegister=false]
   *        Pass false if you don't want the route to be automatically
   *        registered in the app route map.
   *
   * Refer to the router.js documentation for handler definitions:
   *
   *     https://github.com/tildeio/router.js
   *
   * ### Mixins
   *
   * Route objects support mixins on the life-cycle hook level. Any mixins that
   * you include in a route will have their life-cycle hooks run _before_ the
   * one that your route implementation defines, giving them the chance to
   * completely bypass your implementation.
   *
   * This is particularly useful for having an authentication mixin.
   *
   * A mixin's life-cycle hook will abort execution of others only if it returns
   * anything other than undefined. You can make use of router.js's propagation
   * of errors by returning a rejected RSVP.Promise, or by throwing an Error,
   * which will be triggered as an event up the chain of routes.
   *
   * Example:
   *
   *     var ProtectedRouteMixin = {
   *       beforeModel: function(transition) {
   *         if (!this.authenticated) {
   *           transition.abort();
   *           this.transitionTo('/login');
   *           return false;
   *         }
   *       }
   *     };
   *
   *     var MyRoute = new Pixy.Route('privateRoute', {
   *       mixins: [ ProtectedRouteMixin ],
   *
   *       beforeModel: function() {
   *         // this will only be called if the mixin's beforeModel doesn't
   *         // reject
   *       },
   *
   *       setup: function() {
   *         // now we're sure we're authenticated
   *       }
   *     })
   *
   * ### Registry
   *
   * Routes are automatically checked-in with the Pixy.Registry and support
   * the "requires" attribute to specify dependencies.
   *
   * Example
   *
   *     var BudgetShowRoute = new Pixy.Route('budgetShow', {
   *       requires: [ 'user' ],
   *
   *       model: function(id) {
   *         // you can use the resolved user dependency now:
   *         return this.user.budgets.get(id);
   *       }
   *     });
   */
  function Route(name, proto, dontRegister) {
    var inheritedProps = extend(this, proto);
    var ownPropKeys = keys(inheritedProps);
    var hooks = pick(inheritedProps, lifeCycleHooks);
    var mixins = inheritedProps.mixins || [];
    var mixinMethods;

    // Don't mix this in if it had already been mixed-in to a parent route.
    if (mixins.indexOf(EventedMixin) === -1) {
      mixins.push(EventedMixin);
    }

    mixinProps = mixins.reduce(function(methods, mixin) {
      var mixinProps = mixin.mixinProps;

      //>>excludeStart("production", pragmas.production);
      var shadowed = _.intersection(Object.keys(methods), Object.keys(mixin));
      if (shadowed.length > 0) {
        console.assert(false,
          "One of your mixins is defining the same method as another:" +
          JSON.stringify(Object.keys(mixin)));

        console.debug('Offending mixin:', mixin);
      }
      //>>excludeEnd("production");

      extend(methods, mixinProps);
      return methods;
    }, {});

    extend(this, omit(mixinProps, ownPropKeys), {
      name: name
    });

    lifeCycleHooks.forEach(function(hookName) {
      var hook = hooks[hookName];
      var mixinHooks = compact(pluck(mixins, hookName));
      var mixinHooksSz = mixinHooks.length;

      this[hookName] = function() {
        var rc, i;

        // Call all mixin hooks, if any explicitly returns false, abort.
        for (i = 0; i < mixinHooksSz; ++i) {
          rc = mixinHooks[i].apply(this, arguments);

          if (rc !== undefined) {
            return rc;
          }
        }

        // Call our own hook, if defined.
        if (hook) {
          return hook.apply(this, arguments);
        }
      };

      this['__' + hookName] = hook;
    }.bind(this));

    if (!dontRegister) {
      registerRoute(name, this);
    }

    Registry.checkObject(this);

    return this;
  }

  extend(Route.prototype, Events, {
    get: get,

    transitionTo: Router.transitionTo.bind(Router),
    replaceWith: Router.replaceWith.bind(Router),
    trigger: Router.trigger.bind(Router),

    toString: function() {
      return this.name;
    },

    modelFor: function(routeName) {
      console.assert(routeMap[routeName], 'No route by name of "' + routeName + '"');
      return routeMap[routeName].context;
    },

    /**
     * Reload the model you resolved earlier in #model().
     *
     * @return {RSVP.Promise|Any}
     *         Whatever your #model() returned.
     */
    reload: function() {
      return this.__model();
    },

    injectStoreError: function(action, actionIndex, storeError) {
      if (arguments.length === 2) {
        storeError = actionIndex;
        actionIndex = action;
      }

      this.trigger('storeError', {
        actionIndex: actionIndex,
        error: storeError
      });
    },
  });

  Route.extend = extendPrototype.withoutMixins;

  Pixy.routeMap = routeMap;
  Pixy.registerRoute = registerRoute;

  return Route;
});