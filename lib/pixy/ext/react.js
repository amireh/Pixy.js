define([
  'react',
  '../mixins/react/layout_manager_mixin',
  '../mixins/react/layout_mixin',
  '../mixins/react/stacked_layout_mixin'
], function(React, LayoutManagerMixin, LayoutMixin, StackedLayoutMixin) {
  React.addons.LayoutManagerMixin = LayoutManagerMixin;
  React.addons.LayoutMixin = LayoutMixin;
  React.addons.StackedLayoutMixin = StackedLayoutMixin;

  return React;
});