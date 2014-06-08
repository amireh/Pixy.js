module.exports = {
  version: {
    files: {
      'lib/pixy/namespace.js': 'lib/pixy/namespace.js'
    },
    options: {
      replacements: [{
        pattern: /VERSION = '[\d|\.]+'/,
        replacement: "VERSION = '<%= grunt.config.get('pkg.version') %>'"
      }]
    }
  }
};