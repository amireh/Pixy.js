define([ 'underscore', './mixins/logger' ], function(_, Logger) {
  'use strict';

  /**
   * @class Pixy.LoggingContext
   *
   * A free-form logger object. You can instantiate a logging context with
   * a certain name, and utilize the Pixy.Logger facilities on it.
   *
   * @example
   *
   *     var boot;
   *     boot = new Pixy.LoggingContext('Boot');
   *     boot.debug('loading data'); // => console.debug('Boot: loading data')
   */
  var LoggingContext = function(name) {
    this.toString = function() { return name; }
  };

  _.extend(LoggingContext.prototype, Logger);

  return LoggingContext;
});