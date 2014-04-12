define([], function() {
  'use strict';

  return function(args, nrShifts) {
    var i;
    var params = Array.prototype.slice.call(args, 0);

    for (i = 0; i < nrShifts; ++i) {
      params.shift();
    }

    return params;
  };
});