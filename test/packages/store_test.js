describe('Pixy.Store', function() {
  describe('#onAction', function() {
    it('should receive onChange and onError as arguments', function() {
      var spy = sinon.stub();
      var store = new Pixy.Store('testStore', {
        onAction: function(_action, _payload, onChange, _onError) {
          onChange();
        }
      });

      store.addChangeListener(spy);
      Pixy.Dispatcher.dispatch('test', {});

      expect(spy.called).toBeTruthy();
    });

    it('should receive onError as an argument', function() {
      var spy = sinon.stub();
      var index;
      var store = new Pixy.Store('testStore', {
        onAction: function(_action, _payload, _onChange, onError) {
          onError({
            some: 'parameter'
          });
        }
      });

      store.addErrorListener(spy);
      Pixy.Dispatcher.dispatch('test', {});

      index = Pixy.Dispatcher.__actionIndex__();

      expect(spy.calledWith('test', index, { some: 'parameter' })).toBeTruthy();
    });

  });

  describe('#getInitialState', function() {
    it('should #getInitialState on initialize', function() {
      var store = new Pixy.Store('testStore', {
        getInitialState: function() {
          return { foo: 'bar' };
        }
      });

      expect(store.state.foo).toEqual('bar');
    });
  });

  describe('#setState', function() {
    it('should work', function() {
      var store = new Pixy.Store('testStore');

      expect(store.state.foo).toBeFalsy();

      store.setState({ foo: 'bar' });

      expect(store.state.foo).toEqual('bar');
    });
  });
});