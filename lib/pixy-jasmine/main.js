define([
  'rsvp',
  './phantomjs_polyfills',
  './promise_suite',
  './server_suite',
  './route_suite'
], function(RSVP) {
  var config = this.jasmine.pixy = {
    enabled: true,
    logRSVPErrors: true
  };

  RSVP.configure('onerror', function(e) {
    if (!config.logRSVPErrors) {
      return;
    }

    console.error('RSVP error:', e);

    if (e && e.message) {
      console.error(e.message);
    }
    if (e && e.stack) {
      console.error(e.stack);
    }
  });
});