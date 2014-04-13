describe('Pixy.Model', function() {
  it('should store server attributes');
  it('should simulate an API error on local validation failure');

  describe('#save', function() {
    it('should report local validation errors');
    it('should report remote errors');
    it('should report success');
    it('should provide a chance to customize handling of successes and errors');
  });

  describe('#destroy', function() {
    it('should not trigger @sync when destroyed');
  });

  describe('#restore', function() {
    it('should restore the model to its server state');
  })
});