define(function(require) {
  var exports = {};

  exports.LayoutManagerMixin = require('./react/layout_manager_mixin');
  exports.LayoutMixin = require('./react/layout_mixin');
  exports.StackedLayoutMixin = require('./react/stacked_layout_mixin');
  exports.ActorMixin = require('./react/actor_mixin');

  return exports;
});