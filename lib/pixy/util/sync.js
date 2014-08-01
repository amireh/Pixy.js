define([ 'underscore', '../util' ], function(_, Util) {
  var urlError = Util.urlError;
  var result = _.result;
  var extend = _.extend;
  var contains = _.contains;

  // Pixy.sync
  // -------------

  // Map from CRUD to HTTP for our default `Pixy.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  var PAYLOAD_METHODS = [ 'create', 'update', 'patch' ];

  // Override this function to change the manner in which Pixy persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Pixy.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  return function(method, model, options) {
    var params, xhr, attrs;
    var type = methodMap[method];

    // Default options, unless specified.
    options = options || {};

    // Default JSON-request options.
    params = { type: type, dataType: 'json' };

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (!options.data && model && (contains(PAYLOAD_METHODS, method))) {
      attrs = options.attrs || model.toJSON(options);
      model.normalize(attrs);
      params.contentType = 'application/json';
      params.data = JSON.stringify(attrs);
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET') {
      params.processData = false;
    }

    // Make the request, allowing the user to override any Ajax options.
    xhr = options.xhr = this.ajax(extend(params, options));

    model.trigger('request', model, xhr, options);

    return xhr;
  };
});