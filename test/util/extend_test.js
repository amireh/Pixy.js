describe('Util::extend', function() {
  it('should extend from multiple objects', function() {
    var Mixin1 = {
      prop1: function() {}
    };
    var Mixin2 = {
      prop2: function() {}
    };

    var Model = Pixy.Model.extend(Mixin1, Mixin2, {
      myProp: function() {}
    });

    var model = new Model();

    expect(typeof model.prop1).toEqual('function');
    expect(typeof model.prop2).toEqual('function');
    expect(typeof model.myProp).toEqual('function');
  });

  it('should combine all initializers in __mixinInitializers__', function() {
    var a, b, c, d;
    var Mixin1 = {
      prop1: function() {},
      __initialize__: function() {
        a = true;
      }
    };
    var Mixin2 = {
      __initialize__: function() {
        b = true;
      },
      prop2: function() {}
    };

    var Model = Pixy.Model.extend(Mixin1, Mixin2, {
      initialize: function() {
        c = true;
      },
      myProp: function() {}
    });

    var model = new Model();

    expect(c).toEqual(true);

    expect(model.__mixinInitializers__.length).toEqual(2);
    _.each(model.__mixinInitializers__, function(initializer) {
      initializer();
    })
    expect(a).toEqual(true);
    expect(b).toEqual(true);
  });
});