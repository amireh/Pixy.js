module.exports = {
  options: {
    nospawn: false
  },
  scripts: {
    files: [ 'lib/**/*.js' ],
    tasks: [ 'test', 'build' ]
  },

  tests: {
    files: [ 'test/**/*.js' ],
    tasks: [ 'test' ]
  }
};