module.exports = {
  src: [],
  options : {
    timeout: 10000,
    outfile: 'tests.html',

    host: 'http://127.0.0.1:<%= grunt.config.get("connect.tests.options.port") %>/',

    template: require('grunt-template-jasmine-requirejs'),
    templateOptions: {
      requireConfigFile: [ 'test/config.js' ],
      deferHelpers: true
    },

    keepRunner: false,

    version: '1.3.1',

    styles: [],

    helpers: [
      'test/support/jasmine/*.js',
      'test/support/*.js',
      'test/helpers/*.js'
    ],

    specs: [
      'test/**/*_test.js'
    ]
  }
};