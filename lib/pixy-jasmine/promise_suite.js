/* global jasmine: false */

require([ 'rsvp', 'backburner' ], function(RSVP, Backburner) {
  /** @internal RSVP async config method before we modify it */
  var oldAsync;

  var bb = new Backburner['Backburner'](['promises']);
  var exports = jasmine.Suite.prototype;

  /**
   * @private
   */
  function customAsync(callback, promise) {
    bb.defer('promises', promise, callback, promise);
  }

  /**
   * @private
   */
  function flushBackburner() {
    bb.end();
    bb.begin();
  }

  /** @private */
  function setup() {
    oldAsync = RSVP.configure('async');

    RSVP.configure('async', customAsync);

    bb.begin();

    extendDSL(this);
  }

  function extendDSL(suite) {
    suite.flush = function() {
      flushBackburner();
    };
  }

  /** @private */
  function teardown() {
    RSVP.configure('async', oldAsync);
  }

  /**
   * Turn a test suite that requires any promise-based functionality into a
   * "synchronous" one where you get to the flush the pending promise queue
   * manually by calling this.flush() from inside your tests.
   *
   * Example
   *
   *     describe('my async suite', function() {
   *       this.promiseSuite = true;
   *       it('should do something that takes a while', function() {
   *         model.save().then(function() {
   *           expect(something).to.happen();
   *         });
   *         this.flush();
   *       });
   *     });
   */
  var PromiseSuite = function(testSuite) {
    testSuite.__promiseSuiteSetup = true;
    testSuite.beforeEach(function() {
      setup.call(this);
    });
    testSuite.afterEach(teardown);

    return this;
  };

  Object.defineProperty(exports, 'promiseSuite', {
    set: function() {
      exports.mkPromiseSuite.call(this);
    }
  });

  exports.mkPromiseSuite = function() {
    if (this.__promiseSuiteSetup) {
      return;
    }

    PromiseSuite(this);
  };
});
