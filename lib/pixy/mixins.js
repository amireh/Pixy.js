define(function(require) {
  var exports = {};

  exports.Routes = require('./mixins/routes');
  exports.React = require('./mixins/react');
  exports.FilterableCollection = require('./mixins/filterable_collection');
  exports.Cacheable = require('./mixins/cacheable');

  return exports;
});