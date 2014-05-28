define([
  'underscore',
  './util/extend',
  './mixins/events',
  './namespace',
  './registry',
  'router'
], function(_, extendPrototype, Events, Pixy, Registry, RouterJS) {
  var extend = _.extend;
  var routeMap = {};
  var router;

  function registerRoute(name, route) {
    routeMap[name] = route;
  };

  router = new RouterJS['default']();

  function Route(name, proto, dontRegister) {
    extend(this, proto);

    if (!dontRegister) {
      registerRoute(name, this);
    }

    Registry.checkObject(this);

    return this;
  };

  extend(Route.prototype, /*Events, */{
    events: {},

    transitionTo: router.transitionTo.bind(router),
    replaceWith: router.replaceWith.bind(router),
    trigger: router.trigger.bind(router),

    render: function(component, options) {
      this.trigger('render', component, options || {
        into: 'main'
      });
    },

    // beforeModel: function() {

    // },

    // model: function() {

    // },

    // afterModel: function(model, params) {

    // },

    // serialize: function(params) {
    //   return params;
    // },

    // setup: function(model) {}
  });

  Route.extend = extendPrototype;

  Pixy.routeMap = routeMap;
  Pixy.registerRoute = registerRoute;
  Pixy.ApplicationRouter = router;

  return Route;
});