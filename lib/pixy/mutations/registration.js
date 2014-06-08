define([ '../core/registry' ], function(Registry) {
  'use strict';

  /**
   * @class Backbone.Plugin.Inherits
   * @extends Backbone.Plugin
   *
   * Enables inheritance of attributes for any Backbone resource.
   */
  return {
    stage: 'after',
    priority: 100,
    targets: [ 'model', 'collection', 'view', 'router', 'object' ],
    mutation: function(resource) {
      Registry.checkObject(resource);
    }
  };
});