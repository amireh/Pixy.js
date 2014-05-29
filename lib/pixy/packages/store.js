define([
  'underscore',
  './mixins/logger',
  './mixins/events',
  './dispatcher',
  './util/extend'
], function(_, Logger, Events, Dispatcher, extend) {
  var callbacks = [];
  var merge = _.merge;
  var CHANGE_EVENT = 'change';
  var ACTION_ERROR_EVENT = 'actionError';

  function actionErrorEventName(action) {
    return [ ACTION_ERROR_EVENT, action ].join(':');
  }

  /**
   * @class Pixy.Dispatcher
   * @extends Pixy.Object
   *
   * An implementation of the Flux action dispatcher. Responsible for dispatching
   * action payload to Data Stores.
   */
  var Store = function(name, schema) {
    merge(this, schema, {
      name: name
    });

    this.debug('Created.');
    Dispatcher.register(this.onAction.bind(this));
  };

  merge(Store.prototype, Logger, Events, {
    name: 'GenericStore',
    actions: {},

    initialize: function() {},

    toString: function() {
      return this.name;
    },

    emitChange: function() {
      this.debug('Broadcasting change.');
      this.trigger(CHANGE_EVENT);
    },

    emitActionError: function(action, actionIndex, error) {
      this.warn('Broadcasting action error');

      this.trigger(actionErrorEventName(action), actionIndex, error);
      this.trigger(ACTION_ERROR_EVENT, action, actionIndex, error);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback, thisArg) {
      this.on(CHANGE_EVENT, callback, thisArg);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback, thisArg) {
      this.off(CHANGE_EVENT, callback, thisArg);
    },

    /**
     * Register an error handler for a specific store action.
     *
     * @param {String}   action
     *        A specific action to listen to for errors. Errors caused in other
     *        actions will not be dispatched to your callback.
     *
     * @param {Function} callback
     */
    addActionErrorListener: function(action, callback, thisArg) {
      this.on(actionErrorEventName(action), callback, thisArg);
    },

    removeActionErrorListener: function(action, callback, thisArg) {
      this.off(actionErrorEventName(action), callback, thisArg);
    },

    /**
     * Register an error handler to be called on any store action error.
     *
     * @param {Function} callback
     */
    addErrorListener: function(callback, thisArg) {
      this.on(ACTION_ERROR_EVENT, callback, thisArg);
    },

    removeErrorListener: function(callback) {
      this.off(ACTION_ERROR_EVENT, callback, thisArg);
    },

    onAction: function(action, payload) {
      var actionSchema = this.actions[action];

      if (actionSchema) {
        if (!_validateActionPayload(actionSchema, payload)) {
          //>>excludeStart("production", pragmas.production);
          console.error('Invalid action payload for action:', action,
            'payload is:', payload);
          //>>excludeEnd("production");
          return true;
        }
      }

      return true;
    },

    // Install your schema validator here.
    //
    // @return {Boolean} True if the payload is valid.
    _validateActionPayload: function(actionSchema, payload) {
      return true;
    }
  });

  Store.extend = extend;

  return Store;
});