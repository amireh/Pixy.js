define([
  'rsvp',
  'backburner',
  'sinon',
  './phantomjs_polyfills',
  './promise_suite',
  './server_suite',
  './route_tests'
], function(RSVP) {
  RSVP.configure('onerror', function(e) {
    console.error('RSVP error:', e);

    if (e && e.message) {
      console.error(e.message);
    }
    if (e && e.stack) {
      console.error(e.stack);
    }
  });
});