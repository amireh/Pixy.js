define([], function() {
  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) {
        error(model, resp, options);
      }

      model.trigger('error', model, resp, options);
    };
  };

  return {
    urlError: urlError,
    wrapError: wrapError
  };
});