define([ 'underscore', '../util/inherit' ], function(_, Inherit) {
  'use strict';

  /**
   * @class Backbone.Plugin.Inherits
   * @extends Backbone.Plugin
   *
   * Enables inheritance of attributes for any Backbone resource.
   */
  return {
    stage: 'before',
    targets: [ 'model', 'view', 'collection', 'router' ],
    priority: 1,
    mutation: function(resource) {
      var chain = Inherit(resource, 'inherits', true, true);

      if (chain && chain.length) {
        _.each(chain, function(attr) {
          var isArray = attr[0] == '@';

          if (isArray) {
            attr = attr.substr(1);
          }

          Inherit(resource, attr, false, isArray);
        });
      }
    }
  };
});