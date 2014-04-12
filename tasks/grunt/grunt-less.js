module.exports = {
  options: {
    strictImports: true
  },
  production: {
    options: {
      paths: [ 'src/css' ],
      compress: false
    },
    files: {
      'www/dist/pibi.css': 'src/css/app.less',
      'www/dist/pibi-rtl.css': 'src/css/app-rtl.less'
    }
  }
};