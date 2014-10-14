define(function(require) {
  var exports = {};

  exports.Routes = require('./mixins/routes');
  exports.React = require('./mixins/react');

  return exports;
});