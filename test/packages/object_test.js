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

  it('should initialize @mixins', function() {
    var mixin1Called = false, mixin2Called = false;
    var Mixin1 = {
      __initialize__: function() {
        mixin1Called = true;
      },

      a: function() {}
    };

    var Mixin2 = {
      __initialize__: function() {
        mixin2Called = true;
      },

      b: function() {}
    };

    var SomeObject = Pixy.Object.extend({
      mixins: [ Mixin1, Mixin2 ]
    });

    var object = new SomeObject();

    expect(typeof object.a).toEqual('function');
    expect(typeof object.b).toEqual('function');
    expect(mixin1Called).toEqual(true);
    expect(mixin2Called).toEqual(true);
  });

  it('should inherit @mixins', function() {
    var mixin1Called = false, mixin2Called = false;
    var Mixin1 = {
      __initialize__: function() {
        mixin1Called = true;
      },

      a: function() {}
    };

    var Mixin2 = {
      __initialize__: function() {
        mixin2Called = true;
      },

      b: function() {}
    };

    var ParentObject = Pixy.Object.extend({
      mixins: [ Mixin1 ]
    });

    var SomeObject = ParentObject.extend({
      mixins: [ Mixin2 ]
    });

    var parent = new ParentObject();

    expect(typeof parent.a).toEqual('function');
    expect(typeof parent.b).toEqual('undefined');
    expect(mixin1Called).toEqual(true);
    expect(mixin2Called).toEqual(false);

    mixin1Called = false;
    mixin2Called = false;

    var object = new SomeObject();

    expect(typeof object.a).toEqual('function');
    expect(typeof object.b).toEqual('function');
    expect(mixin1Called).toEqual(true);
    expect(mixin2Called).toEqual(true);

  });
});