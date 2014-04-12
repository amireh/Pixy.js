define([ 'main' ], function(Backbone) {
  describe('Backbone', function() {
    it('should include all packages', function() {
      expect(Backbone.Controller).toBeTruthy();
    })
  })
});