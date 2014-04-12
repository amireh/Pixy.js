/* global requirejs: false, jasmine: false */
requirejs.config({
  baseUrl: './',
  map: {
    '*': {
      'test': '../test'
    }
  },

  paths: {
    'when': '../vendor/when',
    'underscore': '../vendor/underscore',
    'jquery': '../vendor/jquery'
  },

  shim: {
    'underscore': { exports: '_' },
    'jquery': { exports: '$' }
  },

  deps: [
  ],

  callback: function() {
    // Avoid infinite loop in the pretty printer when trying to print objects with
    // circular references.
    jasmine.MAX_PRETTY_PRINT_DEPTH = 3;
  }
});