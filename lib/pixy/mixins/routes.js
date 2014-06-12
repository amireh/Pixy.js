define([
  './routes/access_policy',
  './routes/loading',
  './routes/props',
  './routes/renderer',
  './routes/secondary_transitions',
  './routes/window_title',
], function(
  AccessPolicy,
  Loading,
  Props,
  Renderer,
  SecondaryTransitions,
  WindowTitle) {
  var exports = {};

  exports.AccessPolicy = AccessPolicy;
  exports.Loading = Loading;
  exports.Props = Props;
  exports.Renderer = Renderer;
  exports.SecondaryTransitions = SecondaryTransitions;
  exports.WindowTitle = WindowTitle;

  return exports;
});