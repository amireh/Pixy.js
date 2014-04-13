define([
  'underscore',
  './namespace',
  './router',
  './util/shift'
], function(_, Pixy, Router, Shift) {
  'use strict';

  var beforeEach = function(route) {
    this.debug('=> #' + route);
    this.currentRoute = Pixy.history.fragment;

    if (this.beforeEach) {
      this.beforeEach(route, this.currentRoute);
    }
  };

  /**
   * @class Pixy.Controller
   */
  var Controller = Router.extend({
    name: 'Controller',

    inherits: [ '@requires' ],
    requires: [ 'viewport', 'applicationRouter' ],

    /**
     * @property {Array<String>|Array<RegExp>} public
     * Routes in this controller that may not be visited while the user is
     * logged in.
     */
    public: [],

    /**
     * @property {Array<String>|Array<RegExp>} protected
     * Routes in this controller that may not be visited by guests.
     */
    protected: [],

    currentRoute: null,

    constructor: function(options) {
      Router.call(this, options);

      // Automatically register all controllers in the registry.
      Pixy.Registry.registerModule(this.name, this);

      // Insert hook to run any custom "beforeEach" filter defined
      this.listenTo(this, 'route', _.bind(beforeEach, this));
    },

    /**
     * Forward a view attachment request to the Viewport.
     */
    render: function(view, options) {
      if (!this.viewport) {
        this.warn('Viewport is unavailable, can not render views.');
        return false;
      }

      view.prototype.controller = this;

      return this.viewport.attach(view, options);
    },

    /**
     * Delegate handling of the current endpoint to another controller.
     *
     * @protected
     */
    forward: function(controller, method) {
      var params;

      if (!(controller instanceof Pixy.Controller)) {
        console.debug(controller);

        throw new TypeError('Expected a Pixy.Controller instance.');
      }
      else if (!_.isFunction(controller[method])) {
        throw new ReferenceError(controller + ' does not respond to #' + method);
      }

      params = Shift(arguments, 2);

      controller.trigger('route', method, params);

      return controller[method].apply(controller, params);
    },

    redirectTo: function(href) {
      this.applicationRouter.redirectTo(href);
    }
  });

  return Controller;
});