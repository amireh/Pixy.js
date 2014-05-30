xdescribe('Pixy.Router', function() {
  describe('construction', function() {
    it('should create', function() {
      expect(function() {
        new Pixy.Router();
      }).not.toThrow();
    });

    it('should create with a set of starting routes', function() {
      var routeSpy = spyOn(Pixy.Router.prototype, 'route');

      var subject = new Pixy.Router({
        routes: {
          foo: 'bar'
        }
      });

      expect(routeSpy).toHaveBeenCalledWith('foo', 'bar');
    });
  });
});