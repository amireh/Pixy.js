define([ 'underscore', 'rsvp', '../object' ], function(_, RSVP, PObject) {
  var extend = _.extend;
  var actionIndex = 0;
  var handlers = {};

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
      var service, action;
      var storeKey, actionId;
      var promise;
      var fragments = actionType.split(':');

      storeKey = fragments[0];
      actionId = fragments[1];

      action = extend({}, options, {
        id: actionId,
        storeKey: storeKey,
        type: actionType,
        index: ++actionIndex,
        payload: payload
      });

      if (!handlers.hasOwnProperty(storeKey)) {
        console.assert(false, 'No action handler registered to:', actionType);
        promise = RSVP.reject('Unknown action "' + actionId + '"');
      }
      else {
        console.debug('Dispatching targeted action "', actionId, '" with args:', action);
        promise = handlers[storeKey](action);
      }

      service = {
        promise: promise,
        index: action.index,
        // @deprecated
        actionIndex: action.index
      };

      return service;
    },

    register: function(key, handler) {
      handlers[key] = handler;
    }

    //>>excludeStart("production", pragmas.production);
    // For tests:
    , __reset__: function() {
      if (!PIXY_TEST) {
        throw 'You may not call this outside a testing environment!';
      }
    }
    , __actionIndex__: function() {
      return actionIndex;
    }
    //>>excludeEnd("production");
  });

  return new Dispatcher();
});