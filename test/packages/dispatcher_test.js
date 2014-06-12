require([ 'pixy/core/dispatcher', 'when', 'rsvp' ], function(Dispatcher, when, RSVP) {
  window.when = when;
  window.RSVP = RSVP;
  describe('Core::Dispatcher', function() {
    beforeEach(function() {
      Dispatcher.__reset__();
    });

    describe('#register', function() {
      it('should register a callback', function() {
        var callback = function(payload) {};

        expect(function() {
          Dispatcher.register(callback);
        }).not.toThrow();
      });
    });

    describe('#dispatch', function() {
      this.promiseSuite = true;

      it('should invoke callbacks with a payload', function() {
        var callback = sinon.stub();

        Dispatcher.register(callback);
        Dispatcher.dispatch('someAction', {
          foo: 'bar'
        });

        this.flush();

        expect(callback.called).toBeTruthy();
      });

      xit('should reject a non-camelized action', function() {
        var callback = sinon.stub();

        Dispatcher.register(callback);
        Dispatcher.dispatch('some_action').promise.shouldReject(function() {
          expect(callback.called).toBeFalsy();
        }).andWait('Payload to be dispatched');
      });
    });
  });
});