module.exports = {
  version: {
    files: {
      'lib/pixy/packages/namespace.js': 'lib/pixy/packages/namespace.js'
    },
    options: {
      replacements: [{
        pattern: /VERSION = '[\d|\.]+'/,
        replacement: "VERSION = '<%= grunt.config.get('pkg.version') %>'"
      }]
    }
  }
};