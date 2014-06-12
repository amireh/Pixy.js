/* global sinon:false, jasmine: false */

require([ 'sinon' ], function() {
  function createServer() {
    var server;

    server = sinon.fakeServer.create();
    server.autoRespond = true;

    return server;
  }

  function setup() {
    this.server = createServer();
    extendDSL.call(this);
  }

  function extendDSL() {
    this.respondWith = this.server.respondWith.bind(this.server);
    this.respond = function() {
      this.server.respond();

      // cross-support for PromiseSuite - automatically flushed the promise
      // queue after a server response
      if (this.flush) {
        this.flush();
      }
    };

    this.reloadServer = function() {
      this.server.restore();
      this.server = createServer();
    };
  }

  function teardown() {
    this.server.restore();
    this.server = null;
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
  var ServerSpawner = function(testSuite) {
    testSuite._serverSpawnerInstalled = true;
    testSuite.beforeEach(function() {
      setup.call(this);
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

        ServerSpawner(this);
      }
    }
  });

  jasmine.getEnv().serverSpawner = ServerSpawner;
});
