/* global requirejs: false, jasmine: false */
requirejs.config({
  baseUrl: '../lib',

  map: {
    '*': {
      'pixy': '../lib/pixy',
      'pixy-jasmine': '../lib/pixy-jasmine',
      'test': '../../test'
    }
  },

  paths: {
    'lodash': '../../vendor/underscore',
    'store': '../../vendor/store',
    'rsvp/utils': '../../vendor/rsvp',
    'backburner': 'pixy-jasmine/vendor/backburner',
    'sinon': 'pixy-jasmine/vendor/sinon-1.7.3',
  },

  deps: [ 'pixy/main', 'pixy-jasmine/main', 'rsvp' ],

  callback: function() {
    this.PIXY_TEST = true;
    // Avoid infinite loop in the pretty printer when trying to print objects with
    // circular references.
    jasmine.MAX_PRETTY_PRINT_DEPTH = 3;
  }
});