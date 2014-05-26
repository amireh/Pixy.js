define([ 'when', 'rsvp' ], function(when, RSVP) {
  describe('when', function() {
    describe('when()', function() {
      it('given a scalar, it immediately resolves', function() {
        var handler = sinon.stub();

        when('something').then(handler).shouldResolve(function() {
          expect(handler.called).toBeTruthy();
        }).andWait('Promise to be delivered.', 150);
      });

      it('given a promise, it resolves once the promise does', function() {
        var handler = sinon.stub();

        when(RSVP.resolve('yes')).then(handler).shouldResolve(function() {
          expect(handler.calledWith('yes')).toBeTruthy();
        }).andWait('Promise to be delivered.', 150);
      });

      it('given a promise, it rejects if the promise does', function() {
        var handler = sinon.stub();

        when(RSVP.reject('no')).catch(handler).shouldFulfill(function() {
          expect(handler.calledWith('no')).toBeTruthy();
        }).andWait('Promise to be delivered.', 150);
      });
    });
  });
});