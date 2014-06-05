define([ 'underscore', 'rsvp', './object' ], function(_, RSVP, PObject) {
  var callbacks = [];
  var camelize = String.prototype.camelize;
  var underscore = String.prototype.underscore;
  var extend = _.extend;
  var actionIndex = 0;

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
      var service;
      var promises = [];
      var action = extend({}, options, {
        type: actionType,
        index: ++actionIndex,
        payload: payload
      });

      callbacks.forEach(function(callback) {
        promises.push(RSVP.Promise.cast(callback(action)));
      });

      service = {
        promise: RSVP.all(promises),
        index: action.index,
        // @deprecated
        actionIndex: action.index
      };

      return service;
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
    , __actionIndex__: function() {
      return actionIndex;
    }
    //>>excludeEnd("production");
  });

  return new Dispatcher();
});