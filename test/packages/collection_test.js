describe('Pixy.Collection', function() {
  describe('construction', function() {
    it('should create', function() {
      expect(function() {
        new Pixy.Collection();
      }).not.toThrow();
    });

    it('should create with a set of starting models', function() {
      var subject = new Pixy.Collection([{ id: 1 }, { id: 2}]);
      expect(subject.length).toEqual(2);
      expect(subject.pluck('id')).toEqual([1,2]);
    });

    it('should accept a model option', function() {
      var model = function() {};
      var subject = new Pixy.Collection(null, {
        model: model
      });

      expect(subject.model).toEqual(model);
    });
  });
});