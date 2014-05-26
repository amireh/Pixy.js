// This is needed as we make the transition from when.js to RSVP.
//
// This "shim" provides the same API that when.js exposed but using RSVP.
define('when', [ 'rsvp' ], function(RSVP) {
  var Promise = RSVP.Promise;
  var PromisePrototype = Promise.prototype;
  var when;

  // Aliases for backwards-compatibility with when.js
  PromisePrototype.otherwise = PromisePrototype.catch;
  PromisePrototype.ensure = PromisePrototype.finally;
  PromisePrototype.done = PromisePrototype.then;

  when = function(value, label) {
    return Promise.cast(value, label);
  };

  when.defer = RSVP.defer;
  when.all = RSVP.all;

  return when;
});
