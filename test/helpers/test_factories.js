Factories = (function(require) {
  var Factories = {};

  require([ 'pixy/main' ], function(Pixy) {
    Factories.Listener = Pixy.Model.extend({
      a: function() {},
      b: function() {}
    });
  });

  Factories.JSONResponse = function(rc, body) {
    return [ rc, { 'Content-Type': 'application/json' }, JSON.stringify(body || {}) ];
  };

  Factories.FakeResponse = Factories.JSONResponse;
  Factories.XHR = Factories.JSONResponse;

  return Factories;
})(require);