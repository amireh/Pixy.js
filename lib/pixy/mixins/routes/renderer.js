define([ '../../config' ], function(Config) {
  /**
   * @class Mixins.Routes.Renderer
   *
   * Convenience mixin for mounting and unmounting components into layouts and
   * outlets automatically when a route is entered and exitted.
   *
   * ### Usage example
   *
   * Here's an example of an Index page that utilizes three outlets: content,
   * the toolbar, and the sidebar.
   *
   *     new Pixy.Route('transactionIndex', {
   *       views: [
   *         { component: Listing },
   *         { component: Sidebar, outlet: 'sidebar' },
   *         { component: Toolbar, outlet: 'toolbar' }
   *       ]
   *     })
   *
   * Here's another example of rendering into a different layout, say "dialogs":
   *
   *     new Pixy.Route('login', {
   *       views: [{ component: Dialog, into: 'dialogs' }]
   *     })
   */
  var RendererMixin = {
    mixinProps: {
      /**
       * @property {Object[]} views
       *           Your view listing.
       *
       * @property {React.Class} views.component (required)
       *           A renderable React component.
       *
       * @property {String} [views.into]
       *           Layout to mount the component in. If unspecified, the proper
       *           layout based on the authentication status will be used (guest
       *           or member).
       *
       * @property {String} [views.outlet="content"]
       *           Sugar for defining the "outlet" option for OutletLayouts.
       *
       * @property {Object} [views.options={}]
       *           Any custom options to pass to the layout.
       */
      views: [],

      /**
       * Manually mount a component.
       *
       * See Pixy.Mixins.LayoutManagerMixin#add for the parameters.
       */
      mount: function(component, layoutName, options) {
        this.trigger('render', component, layoutName, options);
      },

      /**
       * Unmount a previously-mounted component.
       *
       * See Pixy.Mixins.LayoutManagerMixin#remove for the parameters.
       */
      unmount: function(component, layoutName, options) {
        this.trigger('remove', component, layoutName, options);
      },

      shouldUnmount: function() {
        return true;
      }
    },

    /**
     * @internal Mount defined components.
     */
    enter: function() {
      var mount = this.mount.bind(this);
      var specs = this.views.reduce(function(specs, spec) {
        var layoutName = spec.into;
        var layoutOptions = spec.options || {};

        if (!spec.into) {
          // store the current layout name in the spec so we can properly
          // unmount from the same layout on #exit()
          layoutName = spec.into = Config.getCurrentLayoutName();

          console.assert(layoutName,
            "RendererMixin: you must specify a layout name using 'into' or" +
            " define Pixy.Config#getCurrentLayoutName().");
        }

        if (spec.outlet) {
          layoutOptions.outlet = spec.outlet;
          // again, store it for the same reason as above
          spec.options = layoutOptions;
        }

        return specs.concat({
          component: spec.component,
          layoutName: layoutName,
          options: layoutOptions
        });
      }, []);

      this.trigger('renderMany', specs);
    },

    /**
     * @internal Unmount components mounted in #enter().
     */
    exit: function() {
      var unmount;

      if (this.shouldUnmount()) {
        unmount = this.unmount.bind(this);

        this.views.forEach(function(spec) {
          unmount(spec.component, spec.into, spec.options);
        });
      }
    }
  };

  return RendererMixin;
});