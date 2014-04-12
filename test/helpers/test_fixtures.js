Fixtures = (function(require) {
  var Fixtures = {};

  Fixtures.FakeResponse = function(rc, body) {
    return [ rc, { 'Content-Type': 'application/json' }, JSON.stringify(body || {}) ];
  };
  Fixtures.XHR = Fixtures.FakeResponse;

  Fixtures.DOMElement = function(el) {
    return $(el).appendTo($('body'));
  }

  return Fixtures;
})(require);