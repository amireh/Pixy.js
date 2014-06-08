define([ 'pixy/mixins/filterable_collection' ], function(FilterableCollection) {
  describe('Mixins::FilterableCollection', function() {
    it('should install', function() {
      var MyCollection = Pixy.Collection.extend({
        initialize: function() {
          FilterableCollection(this);
        }
      });

      var subject = new MyCollection();
      expect(subject.applyFilters).toBeTruthy();
    });
  });
});