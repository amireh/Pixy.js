define([
  'underscore',
  './util/extend',
  './namespace',
  './registry',
  './router'
], function(_, extendPrototype, Pixy, Registry, Router) {
  var extend = _.extend;
  var omit = _.omit;
  var pick = _.pick;
  var pluck = _.pluck;
  var compact = _.compact;

  /**
   * @property {Object} routeMap
   * @private
   *
   * A map of the registered route handlers.
   */
  var routeMap = {};
  var lifeCycleHooks = [ 'beforeModel', 'enter', 'exit' ];

  function registerRoute(name, route) {
    routeMap[name] = route;
  };

  /**
   * @class Pixy.Route
   *
   * A router.js handler.
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
   * === Mixins
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
   * === Registry
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
    var props = omit(inheritedProps, lifeCycleHooks.concat('mixins'));
    var hooks = pick(inheritedProps, lifeCycleHooks);
    var mixins = inheritedProps.mixins || [];

    extend(this, proto, {
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
    }.bind(this));

    if (!dontRegister) {
      registerRoute(name, this);
    }

    Registry.checkObject(this);

    return this;
  };

  extend(Route.prototype, {
    transitionTo: Router.transitionTo.bind(Router),
    replaceWith: Router.replaceWith.bind(Router),
    trigger: Router.trigger.bind(Router),

    toString: function() {
      return this.name;
    }
  });

  Route.extend = extendPrototype.withoutMixins;

  Pixy.routeMap = routeMap;
  Pixy.registerRoute = registerRoute;

  return Route;
});