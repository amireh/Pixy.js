/* global exports: false */

define([
  'jquery',
  'underscore',
  'rsvp',
  './mixins/events',
  './mixins/logger',
  './util/sync'
], function($, _, RSVP, Events, Logger, sync) {
  var extend = _.extend;

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Pixy` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousPixy = root.Pixy;

  // The top-level namespace. All public Pixy classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Pixy;
  if (typeof exports !== 'undefined') {
    Pixy = exports;
  } else {
    Pixy = root.Pixy = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Pixy.VERSION = '2.0.0';

  Pixy.sync = _.bind(sync, Pixy);
  Pixy.$ = $;

  // Allow the `Pixy` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  extend(Pixy, Events, Logger, {
    name: 'Pixy'
  });

  // Runs Pixy.js in *noConflict* mode, returning the `Pixy` variable
  // to its previous owner. Returns a reference to this Pixy object.
  Pixy.noConflict = function() {
    root.Pixy = previousPixy;
    return this;
  };

  // Set the default implementation of `Pixy.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Pixy.ajax = function() {
    return RSVP.Promise.cast(Pixy.$.ajax.apply(Pixy.$, arguments));
  };

  Pixy.warn = function() {
    if (window.hasOwnProperty('PIXY_TEST')) {
      return;
    }

    return console.warn.apply(console, arguments);
  };

  return Pixy;
});