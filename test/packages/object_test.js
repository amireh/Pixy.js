describe('Pixy.Object', function() {
  it('initialize with properties', function() {
    var SomeObject = Pixy.Object.extend({
      initialize: function(args) {
        this.foo = args.foo;
      }
    });

    var object = new SomeObject({
      foo: 'bar'
    });

    expect(object.foo).toEqual('bar');
  });
});