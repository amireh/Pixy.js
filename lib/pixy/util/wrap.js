define([], function() {
  'use strict';

  var sink = function() {};

  /**
   * Wrap a method with another that receives the wrapped method as its first
   * argument, as well as the original arguments the wrapped method would have
   * received.
   *
   * The wrapper does not need to test if the wrapped method exist (in case of
   * user-provided callbacks) because a "sink" method will be provided as
   * default.
   *
   * @param  {Function} method
   *         Method to wrap.
   * @param  {Function} callback
   *         Your wrapper.
   * @param  {[type]}   thisArg
   *         Context to execute the wrapper in.
   * @return {Function}
   *         The wrapper wrapper method.
   */
  return function(method, callback, thisArg) {
    method = method || sink;

    return function() {
      var params = Array.prototype.slice.call(arguments, 0);
      params.unshift(method);
      return callback.apply(thisArg, params);
    }
  };
});