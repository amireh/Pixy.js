define([ 'underscore', 'when', './object' ], function(_, when, PObject) {
  var callbacks = [];
  var camelize = String.prototype.camelize;
  var underscore = String.prototype.underscore;
  var extend = _.extend;

  /**
   * @class Pixy.Dispatcher
   * @extends Pixy.Object
   *
   * An implementation of the Flux action dispatcher. Responsible for dispatching
   * action payload to Data Stores.
   */
  var Dispatcher = PObject.extend({
    name: 'Dispatcher',

    dispatch: function(actionType, payload, options) {
      var promises = [];
      var action = extend({}, options, {
        type: actionType,
        payload: payload
      });

      callbacks.forEach(function(callback) {
        promises.push(when(callback(action)));
      });

      console.debug(when.all);

      return when.all(promises);
    },

    register: function(callback) {
      callbacks.push(callback);
    }

    //>>excludeStart("production", pragmas.production);
    // For tests:
    , __reset__: function() {
      if (!PIXY_TEST) {
        throw 'You may not call this outside a testing environment!';
      }

      callbacks = [];
    }
    //>>excludeEnd("production");
  });

  return new Dispatcher();
});