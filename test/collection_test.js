define([ 'packages/collection' ], function(Collection) {
  describe('Collection', function() {
    it('should include all packages', function() {
    });

    it('should broadcast @sync on set', function() {
      var subject = new Collection();
      var listener = sinon.stub();

      subject.on('sync', listener);
      subject.set([ {} ], { silent: false });

      expect(listener.callCount).toEqual(1);
    });

    it('should broadcast @sync on resset', function() {
      var subject = new Collection();
      var listener = sinon.stub();

      subject.on('sync', listener);
      subject.reset([ {} ]);

      expect(listener.callCount).toEqual(1);
    });
  });
});