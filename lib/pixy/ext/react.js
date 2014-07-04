define(function(require) {
  var React = require('react');
  var LayoutManagerMixin = require('../mixins/react/layout_manager_mixin');
  var LayoutMixin = require('../mixins/react/layout_mixin');
  var StackedLayoutMixin = require('../mixins/react/stacked_layout_mixin');
  var ActorMixin = require('../mixins/react/actor_mixin');

  React.addons.LayoutManagerMixin = LayoutManagerMixin;
  React.addons.LayoutMixin = LayoutMixin;
  React.addons.StackedLayoutMixin = StackedLayoutMixin;
  React.addons.ActorMixin = ActorMixin;

  return React;
});