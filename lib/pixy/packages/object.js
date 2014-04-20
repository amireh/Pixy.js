define([
  'underscore',
  './namespace',
  './util/extend',
  './mixins/events',
  './mixins/logger'
], function(_, Pixy, extend, Events, Logger) {
  'use strict';

  var array = [];
  var slice = [].slice;

  // Pixy.View
  // -------------
  var initializeMixins = function() {
    _.each(this.__mixinInitializers__, function(initializer) {
      try {
        initializer.apply(this, []);
      } catch (e) {
        console.warn('Mixin failed to initialize:', e.stack);
      }
    }, this);

    delete this.__mixinInitializers__;
  };

  /**
   * @class Pixy.Object
   *
   * Creates a new object. This is not meant to be used directly, but instead
   * subclasses should implement their own constructor.
   *
   * See the implementation of resource like Collection or View for examples.
   *
   * @param {String} [type='object']
   *        Object class name.
   *
   * @param {Function} [ctor=null]
   *        If you're defining a new class, you can pass a function that will be
   *        executed after any mixins have been initialized but just before
   *        the user's #initialize() is called.
   *
   * @param {Mixed[]} [args=[]]
   *        Arguments to pass to Pixy.Object#initialize(), the user object
   *        initializer.
   */
  var PObject = function(type, ctor, args) {
    if (arguments.length === 1) {
      args = [ type ];
      type = 'object';
    }

    type = type || 'object';

    Pixy.trigger(type + ':creating', this);

    initializeMixins.call(this);

    if (_.isFunction(ctor)) {
      ctor.call(this);
    } else {
      console.warn('Pixy::Object: expected a constructor function, got:', typeof ctor);
    }

    this.initialize.apply(this, args);

    Pixy.trigger(type + ':created', this);

    return this;
  };

  _.extend(PObject.prototype, Events, Logger, {
    name: 'Object',

    initialize: function() {},
    toString: function() {
      return this.name || this.id;
    }
  });

  PObject.extend = extend;

  return PObject;
});