module.exports = function(grunt) {
  'use strict';

  var shell = require('shelljs');
  var config;

  function readPackage() {
    return grunt.file.readJSON('package.json');
  };

  function loadFrom(path, config) {
    var glob = require('glob'),
    object = {};

    glob.sync('*', {cwd: path}).forEach(function(option) {
      var key = option.replace(/\.js$/,'').replace(/^grunt\-/, '');
      config[key] = require(path + option);
    });
  };

  config = {
    pkg: readPackage(),
    env: process.env
  };

  loadFrom('./tasks/grunt/', config);

  grunt.initConfig(config);

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-tagrelease');
  grunt.loadNpmTasks('grunt-jsduck');
  grunt.loadNpmTasks('grunt-string-replace');

  // Please don't rename these, they're used by `bin/build`:
  // ---
  grunt.registerTask('compile:js', [ 'requirejs:compile' ]);

  grunt.registerTask('updatePkg', function () {
    grunt.config.set('pkg', readPackage());
  });

  // grunt.registerTask('test', [ 'jsvalidate', /* 'jshint', */ ]);
  grunt.registerTask('test', [ 'connect:tests', 'jasmine' ]);

  grunt.registerTask('build', [ 'compile:js' ]);

  grunt.registerTask('docs', [ 'jsduck' ]);
  grunt.registerTask('default', [ 'test' ]);
  grunt.registerTask('version', [ 'string-replace:version' ]);

  // Release alias task
  grunt.registerTask('release', function (type) {
    grunt.task.run('test');
    grunt.task.run('bumpup:' + ( type || 'patch' ));
    grunt.task.run('updatePkg');
    grunt.task.run('version');
    grunt.task.run('build');
    grunt.task.run('tagrelease');
  });
};
