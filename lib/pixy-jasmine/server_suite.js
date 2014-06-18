/* global sinon:false, jasmine: false */

require([ 'sinon', 'underscore' ], function(__sinon__, _) {
  var extend = _.extend;
  var defaultHeaders = {
    'Content-Type': 'application/json'
  };

  function createServer(options) {
    var server = sinon.fakeServer.create();

    if (options.autoRespond !== false) {
      server.autoRespond = true;
    }

    return server;
  }

  function setup(options) {
    var requests;

    if (options.trackRequests) {
      this.xhr = sinon.useFakeXMLHttpRequest();
      requests = this.requests = [];

      this.xhr.onCreate = function(request) {
        requests.push(request);
      };
    } else {
      this.server = createServer(options);
    }

    extendDSL.call(this, !options.trackRequests);
  }

  function extendDSL(useServer) {
    // cross-support for PromiseSuite - automatically flushed the promise
    // queue after a server response
    var flush = function() {
      if (this.flush) {
        this.flush();
      }
    }.bind(this);

    if (useServer) {
      this.respondWith = this.server.respondWith.bind(this.server);
      this.respond = function() {
        this.server.respond();

        flush();
      };

      this.reloadServer = function() {
        this.server.restore();
        this.server = createServer();
      };
    } else {
      this.respondTo = function(xhrRequest, statusCode, headers, body) {
        var rc;

        if (arguments.length === 3) {
          body = headers;
          headers = {};
        }

        rc = xhrRequest.respond(statusCode,
          extend({}, defaultHeaders, headers),
          JSON.stringify(body || '{}'));

        flush();

        return rc;
      };
    }

  }

  function teardown() {
    if (this.server) {
      this.server.restore();
      this.server = undefined;
    } else if (this.xhr) {
      this.xhr.restore();
      this.xhr = this.requests = undefined;
    }
  }

  /**
   * Creates a fake XHR server for each spec in the given suite. You can reach
   * the server instance INSIDE each spec by using `this.server` or by using the
   * instance() method in the returned object.
   *
   * @note
   * The server will be set to auto-respond automatically, so you won't have to
   * call sinon.server#respond() or anything.
   *
   * @param {Jasmine.TestSuite} testSuite
   *        Your `describe()` test suite.
   *
   * @param {Object} options
   * @param {Boolean} [autoRespond=true]
   *        Should the server respond as soon as a request is made? If false,
   *        use "this.respond()" to manually flush the pending request queue.
   *
   * @param {Boolean} [trackRequests=false]
   *        Pass to true if you want manual tracking and management of requests,
   *        e.g, you will no longer be served with a "server" instance but
   *        instead each request made will be pushed to a "this.requests" stack
   *        which you can respond to manually.
   *
   * @example using the spec variable
   * describe('my suite', function() {
   *   Fixtures.ServerSpawner(this);
   *
   *   it('performs a server request', function() {
   *     this.server.respondWith(...);
   *   });
   * });
   *
   * @example
   *
   *     describe('my suite', function() {
   *       var servers = Fixtures.ServerSpawner(this);
   *
   *       it('performs a server request', function() {
   *         servers.instance().respondWith(...);
   *       });
   *     });
   */
  var ServerSpawner = function(testSuite, options) {
    testSuite._serverSpawnerInstalled = true;
    testSuite.beforeEach(function() {
      setup.call(this, options);
    });
    testSuite.afterEach(teardown);

    return this;
  };

  Object.defineProperty(jasmine.Suite.prototype, 'serverSuite', {
    set: function(flag) {
      if (flag) {
        if (this._serverSpawnerInstalled) {
          return;
        }

        ServerSpawner(this, typeof flag === 'object' ? flag : {});
      }
    }
  });

  jasmine.getEnv().serverSpawner = ServerSpawner;
});
