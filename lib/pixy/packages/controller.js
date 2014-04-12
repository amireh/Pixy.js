define([
  'underscore',
  './namespace',
  './router',
  './util/inherit',
  './util/shift'
], function(_, Pixy, Router, Inherit, Shift) {
  'use strict';

  /**
   * @class Pixy.Controller
   */
  var Controller = Router.extend({
    id: 'Controller',

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

    initialize: function() {
      // Automatically register all controllers in the registry.
      Pixy.Registry.registerModule(this.toString(), this);

      Inherit(this, 'requires', {
        isArray: true
      });

      this.on('route', function(name) {
        this.debug('=> #' + name);
        this.currentRoute = Pixy.history.fragment;

        if (this.beforeEach) {
          this.beforeEach(name, this.currentRoute);
        }
      }, this);
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

    toString: function() {
      return this.id;
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