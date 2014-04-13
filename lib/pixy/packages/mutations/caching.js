define([ 'underscore', '../util/inherit' ], function(_, Inherit) {
  'use strict';

  /**
   * @class Backbone.Plugin.Inherits
   * @extends Backbone.Plugin
   *
   * Enables inheritance of attributes for any Backbone resource.
   */
  return {
    targets: [ 'model', 'collection' ],
    priority: 100,
    mutation: function(resource) {
      // Cache-enabled objects must have a 'cache' object defined.
      if (!_.isObject(resource.cache)) {
        return;
      }

      Pixy.Cache.makeCacheable(resource);
    }
  };
});