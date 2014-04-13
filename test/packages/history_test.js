describe('Pixy.History', function() {
  it('should normalize fragments');
  it('should track visited routes');
  it('should not exceed the maximum allowed number of tracked routes');
  it('should track a route visited twice in a row only once');
  it('should remove the earliest visited route when limit is exceeded');
  it('should trigger @navigate on successful transitions');
})