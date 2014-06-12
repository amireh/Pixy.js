define([ './ext/underscore', './namespace' ], function(_, Pixy) {
  'use strict';

  var extend = _.extend;

  /**
   * @class Config
   *
   * Configuration parameters that are required, or utilized, by different Pixy
   * modules to function correctly.
   *
   * Refer to each parameter for more info.
   */
  var Config = {};

  /**
   * @param {Boolean} [isAuthenticated=false]
   *
   * Required by Mixins.Routes.AccessPolicy
   *
   * @return {Boolean}
   *         Whether the current user is logged in (using an authentic session.)
   */
  Config.isAuthenticated = function() {
    return false;
  };

  /**
   * In case a route defines a view specification and not does specify a layout,
   * this method gives you a chance to provide a default layout name.
   *
   * Since this is a function, you get to provide different layouts based on
   * application state, like authentication.
   *
   * @see Mixins.Routes.Renderer
   *
   * @return {String}
   *         Name of the "default" layout the RendererMixin should render into
   *         if none was specified.
   */
  Config.getCurrentLayoutName = function() {
  };

  /**
   * @cfg {String} [defaultAccessPolicy]
   *
   * An access policy to assume for all routes that do not explicitly define
   * one. Used by Mixins.Routes.AccessPolicy.
   */
  Config.defaultAccessPolicy = undefined;

  /**
   * @cfg {String} [defaultWindowTitle]
   *
   * A string to use as a default window title for all routes that mix-in
   * Mixins.Routes.WindowTitle and do not specify a title.
   */
  Config.getDefaultWindowTitle = function() {
    return 'Pixy';
  };

  Config.getRootRoute = function() {
    return Pixy.routeMap.root;
  };

  Pixy.configure = function(config) {
    extend(Config, config);
  };

  return Config;
});