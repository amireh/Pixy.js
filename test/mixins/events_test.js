describe('Pixy.Events', function() {
  describe('#off', function() {
    it('should remove all callbacks for a given context', function() {
      var emitter = new Pixy.Object();
      var listener = {
        callback: function() {}
      };

      var spy = sinon.stub(listener, 'callback');

      emitter.on('something', listener.callback, listener);
      emitter.trigger('something');

      expect(spy.calledOnce).toBeTruthy();

      emitter.off('something', null, listener);
      emitter.trigger('something');

      expect(spy.calledOnce).toBeTruthy();
    });
  });
});