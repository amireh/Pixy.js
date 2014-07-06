var _ = require('lodash');
var extend = _.extend;

var baseConfig = {
  baseUrl: './lib',
  mainConfigFile: '.requirejs',

  removeCombined:           false,
  inlineText:               true,
  preserveLicenseComments:  false,

  pragmas: {
    production: true
  },

  paths: {
    'underscore': 'empty:',
    'lodash': 'empty:',
    'inflection': 'empty:',
    'jquery': 'empty:',
    'react': 'empty:'
  },

  shim: {
    pixy: {}
  },

  rawText: {
    'pixy': 'define(["pixy/main"], function (Pixy) { return Pixy; });'
  },

  name: 'pixy',
  deps: [ 'pixy/main' ]
};

module.exports = {
  development: {
    options: extend({}, baseConfig, {
      out: 'dist/pixy.js',
      optimize: 'none',
    })
  },

  production: {
    options: extend({}, baseConfig, {
      out: 'dist/pixy.min.js',
      optimize: 'uglify2',

      uglify2: {
        warnings: true,
        mangle:   true,

        output: {
          beautify: false
        },

        compress: {
          sequences:  true,
          dead_code:  true,
          loops:      true,
          unused:     true,
          if_return:  true,
          join_vars:  true
        }
      }
    })
  },

  jasmine: {
    options: {
      baseUrl: './lib',
      out: 'dist/pixy-jasmine.js',
      mainConfigFile: '.requirejs',
      optimize: 'none',

      removeCombined:           false,
      inlineText:               true,
      preserveLicenseComments:  false,

      uglify: {
        toplevel:         true,
        ascii_only:       true,
        beautify:         false,
        max_line_length:  1000,
        no_mangle:        false
      },

      paths: {
        'underscore': 'empty:',
        'inflection': 'empty:',
        'jquery': 'empty:',
        'react': 'empty:',
        'rsvp': 'empty:',
        'router': 'empty:',
        'backburner': './pixy-jasmine/vendor/backburner',
        'sinon': './pixy-jasmine/vendor/sinon-1.7.3'
      },

      shim: {
        'pixy-jasmine': {},
        'sinon': { exports: 'sinon' }
      },

      rawText: {
        'pixy-jasmine': 'define(["pixy-jasmine/main"], function (PixyJasmine) { return PixyJasmine; });'
      },

      name: 'pixy-jasmine',
      deps: [ 'pixy-jasmine/main', 'sinon' ]
    }
  }
};