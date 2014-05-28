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

  })
});