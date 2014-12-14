require([ 'pixy/core/dispatcher', 'rsvp' ], function(Dispatcher, RSVP) {
  describe('Core::Dispatcher', function() {
    beforeEach(function() {
      Dispatcher.__reset__();
    });

    describe('#register', function() {
      it('should register a callback', function() {
        var callback = function(payload) {};

        expect(function() {
          Dispatcher.register('someStore', callback);
        }).not.toThrow();
      });
    });

    describe('#dispatch', function() {
      this.promiseSuite = true;

      it('should invoke callbacks with a payload', function() {
        var callback = sinon.stub();

        Dispatcher.register('someStore', callback);
        Dispatcher.dispatch('someStore:someAction', {
          foo: 'bar'
        });

        this.flush();

        expect(callback.called).toBeTruthy();
      });
    });
  });
});