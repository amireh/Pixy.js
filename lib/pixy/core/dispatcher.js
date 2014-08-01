define([ 'underscore', 'rsvp', '../object' ], function(_, RSVP, PObject) {
  var callbacks = [];
  var supportedActions = [];
  var extend = _.extend;
  var actionIndex = 0;
  var EXTRACTOR = /^([^:]+):(.*)$/;
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
      var fragments = (''+actionType).match(EXTRACTOR);

      if (fragments) {
        storeKey = fragments[1];
        actionId = fragments[2];
      }

      action = extend({}, options, {
        id: actionId,
        storeKey: storeKey,
        type: actionType,
        index: ++actionIndex,
        payload: payload
      });

      if (fragments) {
        if (supportedActions.indexOf(actionType) === -1) {
          console.assert(false, 'No action handler registered to:', actionType);
          promise = RSVP.reject('Unknown action');
        }
        else {
          console.debug('Dispatching targeted action "', actionId, '" with args:', action);
          promise = handlers[storeKey](action);
        }
      }
      else {
        console.debug('Dispatching generic action "', actionId, '" to all stores:', action);

        promise = callbacks.reduce(function(promises, callback) {
          return promises.concat(callback(action));
        }, []);
      }

      service = {
        promise: promise,
        index: action.index,
        // @deprecated
        actionIndex: action.index
      };

      return service;
    },

    register: function(callback) {
      callbacks.push(callback);
    },

    registerActionHandler: function(action, key) {
      supportedActions.push([ key , action ].join(':'));
    },

    registerHandler: function(key, handler) {
      handlers[key] = handler;
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