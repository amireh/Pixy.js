describe('Pixy.Route', function() {
  it('should install life cycle hooks');
  it("should invoke a mixin's life-cycle hooks", function() {
    var mixinHookCalled, routeHookCalled;

    var Mixin = {
      beforeModel: function() {
        mixinHookCalled = true;
      }
    };

    var Route = new Pixy.Route('testRoute', {
      mixins: [ Mixin ],

      beforeModel: function() {
        routeHookCalled = true;
      }
    });

    Route.beforeModel('arg');

    expect(mixinHookCalled).toEqual(true);
    expect(routeHookCalled).toEqual(true);
  });

  it('should abort a life-cycle hook if a mixin returns false', function() {
    var mixinHookCalled, routeHookCalled;

    var Mixin = {
      beforeModel: function() {
        mixinHookCalled = true;
        return false;
      }
    };

    var Route = new Pixy.Route('testRoute', {
      mixins: [ Mixin ],

      beforeModel: function() {
        routeHookCalled = true;
      }
    });

    Route.beforeModel('arg');

    expect(mixinHookCalled).toEqual(true);
    expect(routeHookCalled).toEqual(undefined);

  });

  it('should allow extending', function() {
    var called;
    var BaseRoute = Pixy.Route.extend({
      baseMethod: function() {
        called = true;
      }
    });

    var route = new BaseRoute('testRoute', {
      enter: function() {
        this.baseMethod();
      }
    });

    expect(typeof BaseRoute.prototype.baseMethod).toEqual('function')
    expect(typeof route.baseMethod).toEqual('function');
    route.enter();
    expect(called).toEqual(true);
  });

  it('should allow inheriting props', function() {
    var Route = Pixy.Route.extend({
      secondary: true
    });

    var route = new Route('testRoute', {
    });

    expect(route.secondary).toEqual(true);
  });

  it('should allow extending with mixins', function() {
    var called;
    var mixinHookCalled, routeHookCalled;

    var Mixin = {
      beforeModel: function() {
        mixinHookCalled = true;
      }
    };

    var BaseRoute = Pixy.Route.extend({
      mixins: [ Mixin ],
      beforeModel: function() {
        routeHookCalled = true;
      }
    });

    var route = new BaseRoute('testRoute', {}, true);

    route.beforeModel();

    expect(mixinHookCalled).toEqual(true);
    expect(routeHookCalled).toEqual(true);
  });

  it('should include a mixin method', function() {
    var Mixin = {
      mixinProps: {
        someFunc: function() {
          return true;
        }
      }
    };

    var Route = new Pixy.Route('testRoute', {
      mixins: [ Mixin ]
    });

    expect(typeof Route.someFunc).toEqual('function');
  });

  it('should not let a mixin override an own property', function() {
    var Mixin = {
      mixinProps: {
        prop: 'a'
      }
    };

    var Route = new Pixy.Route('testRoute', {
      mixins: [ Mixin ],
      prop: 'b'
    });

    expect(Route.prop).toEqual('b');
  });
});