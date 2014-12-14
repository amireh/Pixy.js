describe('Pixy.Store', function() {
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