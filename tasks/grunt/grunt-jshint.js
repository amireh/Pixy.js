module.exports = {
  all: [ 'src/js/**/*.js', 'test/**/*.js' ],
  src: [ 'src/js/**/*.js' ],
  tests: [ 'test/**/*.js' ],
  options: {
    force: true,
    jshintrc: '.jshintrc',
    '-W098': true,
    reporter: 'tasks/jshint_html_reporter.js',
    reporterOutput: '.jshint.html'
  }
};
