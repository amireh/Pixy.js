/* global requirejs: false, jasmine: false */
requirejs.config({
  baseUrl: '../lib',

  map: {
    '*': {
      'pixy': '../lib/pixy',
      'test': '../../test'
    }
  },

  paths: {
    'lodash': '../../vendor/underscore',
    'store': '../../vendor/store',
    'rsvp/utils': '../../vendor/rsvp'
  },

  deps: [ 'pixy/main' ],

  callback: function() {
    this.PIXY_TEST = true;
    // Avoid infinite loop in the pretty printer when trying to print objects with
    // circular references.
    jasmine.MAX_PRETTY_PRINT_DEPTH = 3;
  }
});