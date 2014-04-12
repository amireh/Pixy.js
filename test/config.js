/* global requirejs: false, jasmine: false */
requirejs.config({
  baseUrl: './lib/pixy',

  map: {
    '*': {
      'test': '../../test'
    }
  },

  paths: {
    'inflection': '../../vendor/inflection',
    'when': '../../vendor/when',
    'underscore': '../../vendor/underscore',
    'jquery': '../../vendor/jquery',
    'store': '../../vendor/store',
  },

  shim: {
    'inflection': { exports: 'InflectionJS' },
    'underscore': { exports: '_' },
    'jquery': { exports: '$' },
    'store': { exports: 'store' },
  },

  deps: [ './main' ],

  callback: function() {
    // Avoid infinite loop in the pretty printer when trying to print objects with
    // circular references.
    jasmine.MAX_PRETTY_PRINT_DEPTH = 3;
  }
});