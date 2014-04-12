module.exports = {
  version: {
    files: {
      'packages/namespace.js': 'packages/namespace.js'
    },
    options: {
      replacements: [{
        pattern: /VERSION = '[\d|\.]+'/,
        replacement: "VERSION = '<%= grunt.config.get('pkg.version') %>'"
      }]
    }
  }
};