define([
  'underscore',
  './namespace',
  './util/extend',
  './events'
], function(_, Pixy, extend, Events) {
  'use strict';

  /**
   * @class Pixy.Object
   */
  Pixy.Object = function() {
    Pixy.trigger('object:creating', this);
    this.initialize();
    Pixy.trigger('object:created', this);
    return this;
  };

  _.extend(Pixy.Object.prototype, Events, {
    initialize: function() {}
  });

  Pixy.Object.extend = extend;

  return Pixy.Object;
});