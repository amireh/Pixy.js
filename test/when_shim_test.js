define([ 'when', 'rsvp' ], function(when, RSVP) {
  describe('when', function() {
    describe('when()', function() {
      this.promiseSuite = true;

      it('given a scalar, it immediately resolves', function() {
        var handler = sinon.stub();

        when('something').then(handler);

        this.flush();

        expect(handler.called).toBeTruthy();
      });

      it('given a promise, it resolves once the promise does', function() {
        var handler = sinon.stub();

        when(RSVP.resolve('yes')).then(handler);

        this.flush();

        expect(handler.calledWith('yes')).toBeTruthy();
      });

      it('given a promise, it rejects if the promise does', function() {
        var handler = sinon.stub();

        when(RSVP.reject('no')).catch(handler);
        this.flush();

        expect(handler.calledWith('no')).toBeTruthy();
      });
    });
  });
});