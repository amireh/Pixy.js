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

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback) {
      this.on(CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback) {
      this.off(CHANGE_EVENT, callback);
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