define([ 'underscore', '../core/cache' ], function(_, Cache) {
  'use strict';

  /**
   * @class Backbone.Plugin.Inherits
   * @extends Backbone.Plugin
   *
   * Enables inheritance of attributes for any Backbone resource.
   */
  return {
    stage: 'before',
    targets: [ 'model', 'collection' ],
    priority: 100,
    mutation: function(resource) {
      // Cache-enabled objects must have a 'cache' object defined.
      if (!_.isObject(resource.cache)) {
        return;
      }

      Cache.makeCacheable(resource);
    }
  };
});