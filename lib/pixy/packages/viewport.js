define([
  './ext/underscore',
  'when',
  './object',
  './view'
], function(_, when, PObject, View) {
  'use strict';

  /**
   * @private
   *
   * Assert a given view factory is renderable. This tests the following:
   *
   *  - view's prototype is actually a Pixy.View
   *  - view responds to #render
   *  - view responds to #remove
   */
  function assertRenderable(view) {
    if (!view || !(view.prototype instanceof View)) {
      throw new TypeError('View must be an instance of Pixy.View');
    }
    else if (!_.isFunction(view.prototype._render)) {
      throw new TypeError('View must respond to #render.');
    }
    else if (!_.isFunction(view.prototype._remove)) {
      throw new TypeError('View must respond to #remove.');
    }

    return true;
  }

  /**
   * @private
   * @property {Pixy.View} currentView
   * The view instance currently occupying the viewport.
   */
  var currentView = null;

  /**
   * @private
   * @property {Pixy.View} currentViewFactory
   *
   * Factory of the view currently occupying the viewport. Required if the
   * Viewport is requested to reload so that it can re-generate the view.
   */
  var currentViewFactory = null;

  /**
   * @private
   * @property {Pixy.View} currentLayout
   *
   * The layout currently attached to the Viewport, if any.
   */
  var currentLayout = null;

  /**
   * @class Pixy.Viewport
   * @extends Pixy.Object
   * @singleton
   *
   * The viewport represents one primary view the user is focusing on at a time.
   * It manages transitioning between the views.
   *
   * You must define an element with the id of 'content' for the viewport to
   * function. That element will be used by the viewport to insert views.
   */
  var Viewport = PObject.extend({
    id: 'Viewport',
    el: '#content',

    module: 'viewport',

    options: {
    },

    /**
     * Prepare the viewport for attaching views. You need to call this before
     * using the viewport.
     *
     * @return {when}
     *         A promise of the viewport being ready.
     */
    start: function() {
      this.debug('Starting...');
      this.$el = $(this.el);

      return when(true);
    },

    /**
     * @return {Boolean}
     *         Whether the viewport has been started and is ready.
     */
    isReady: function() {
      return this.$el && this.$el.length;
    },

    /**
     * Attach a primary view to display, and detach the current one if needed.
     *
     * The viewport will not attach a view that is already attached.
     *
     * @param  {Pixy.View} view
     *         The primary view to display.
     *
     * @param  {Object} options
     *         View rendering options to pass to Pixy.View#render
     *
     * @return {when}
     *         A promise of the view being loaded, rendered, and attached.
     */
    attach: function(viewFactory, options) {
      var that = this;

      assertRenderable(viewFactory);

      this.debug('Requested to attach view:' + viewFactory.prototype.name);

      if (currentView) {
        if (currentView instanceof viewFactory) {
          this.debug('View is already attached: ' + currentView);

          return when(currentView);
        }

        this.debug('detaching ' + currentView);

        return this.clear().then(function() {
          that.debug('detached, now attaching ' + viewFactory.prototype.name);
          return that.attach(viewFactory, options);
        }).otherwise(function(error) {
          that.error('unable to detach!', error);
          return error;
        });
      }

      currentViewFactory = viewFactory;
      currentView = new viewFactory();

      return this.attachView(currentView, options).then(function() {
        return currentView;
      });
    },

    /**
     * @private
     */
    attachView: function(view, options) {
      var that = this;

      this.trigger('attaching', view);

      return view._render(options).then(function() {
        that.debug('Attaching view:', view.toString());
        that.$el.append(view.$el);

        that.trigger('attached', view);

        return view;
      }).otherwise(function(error) {
        that.error('Unable to attach view:', error);
        that.trigger('error', {
          context: 'attaching_view',
          message: error
        });

        throw error;
      });
    },

    setLayout: function(layout) {
      var that = this;
      var layoutName = layout.name;

      if (currentLayout) {
        if (layout === currentLayout) {
          this.warn('Rejecting request to set layout "',layoutName,'"; it is already set.');
          return when();
        }

        this.warn('Rejecting request to set layout "', layoutName, '"; must remove current layout (', currentLayout.name, ') first.');

        return currentLayout._remove().done(function() {
          that.debug('\tLayout', currentLayout.name, 'has been removed. Now attaching', layoutName);
          currentLayout = null;
          that.setLayout(layout);
        });
      }

      currentLayout = layout;

      that.warn('Attaching layout: ', layout.name);

      return currentLayout._render().done(function() {
        that.warn('Layout attached:' + currentLayout);
        return true;
      });
    },

    /**
     * Reset the viewport by removing the primary view.
     * @private
     */
    clear: function() {
      if (!this.isOccupied()) {
        throw new ContextError('Viewport has no visible view to detach.', this);
      }

      return currentView._remove().ensure(function(rc) {
        currentView = null;
        return rc;
      });
    },

    /**
     * @return {Boolean}
     *         Whether a primary view is currently occupying the viewport.
     */
    isOccupied: function() {
      return !!currentView;
    },

    /**
     * @return {Pixy.View}
     *         The view currently occupying the viewport, if any.
     */
    currentView: function() {
      return currentView;
    },

    currentLayout: function() {
      return currentLayout;
    },

    /**
     * Request the viewport to reload itself by clearing and re-rendering the
     * current view (but not the layout).
     *
     * @return {Promise}
     *         A promise of the viewport being fully reloaded.
     */
    reload: function(options) {
      if (currentViewFactory) {
        var that = this;
        var viewFactory = currentViewFactory;

        return this.clear().then(function() {
          that.info('Reloading:', viewFactory.prototype.name);
          return that.attach(viewFactory, options);
        });
      }

      return when(true);
    }
  });

  return new Viewport();
});
