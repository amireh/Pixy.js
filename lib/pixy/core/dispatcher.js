define([ 'underscore', 'rsvp', '../object' ], function(_, RSVP, PObject) {
  var callbacks = [];
  var camelize = String.prototype.camelize;
  var underscore = String.prototype.underscore;
  var extend = _.extend;
  var actionIndex = 0;
  var EXTRACTOR = /^([^:]+):(.*)$/;

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
      var storeKey, actionId;
      var promises = [];
      var fragments = (''+actionType).match(EXTRACTOR);

      if (fragments) {
        storeKey = fragments[1];
        actionId = fragments[2];
      }

      var action = extend({}, options, {
        id: actionId,
        storeKey: storeKey,
        type: actionType,
        index: ++actionIndex,
        payload: payload
      });

      console.debug('Dispatching action:', action);

      callbacks.forEach(function(callback) {
        promises.push(callback(action));
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