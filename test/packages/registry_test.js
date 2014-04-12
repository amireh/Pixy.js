describe("Pixy.Registry", function() {
  var ext = Pixy.Registry;

  afterEach(function() {
    ext.unregister('coreModule');
  });

  var CoreModule = Pixy.Model.extend({
    name: 'CoreModule',
    module: 'coreModule',
    onDependency: function(dependant) {
      this.lastDependant = dependant;
    }
  });

  var DependantModule = Pixy.Model.extend({
    requires: [ 'coreModule' ]
  });

  it('should automatically define a module', function() {
    var model = new CoreModule();

    expect( ext.modules['coreModule'] ).toBeTruthy();
  });

  it('should resolve an early dependency', function() {
    var dependant = new DependantModule();
    var model = new CoreModule();

    expect(dependant.coreModule).toEqual(model);
  });

  it('should resolve an early dependency and notify module', function() {
    var dependant = new DependantModule();
    var model = new CoreModule();

    expect(model.lastDependant).toEqual(dependant);
  });

  it('should resolve a late dependency', function() {
    var model = new CoreModule();
    var dependant = new DependantModule();
    expect(dependant.coreModule).toEqual(model);
  });

  it('should resolve a late dependency and notify module', function() {
    var model = new CoreModule();
    spyOn(model, 'onDependency');

    var dependant = new DependantModule();
    expect(model.onDependency).toHaveBeenCalledWith(dependant);
  });

  it('should generate the correct module ids', function() {
    expect( ext.mkModuleId('User') ).toEqual('user');
    expect( ext.mkModuleId('User View') ).toEqual('userView');
    expect( ext.mkModuleId('UserView') ).toEqual('userView');
    expect( ext.mkModuleId('userView') ).toEqual('userView');
    expect( ext.mkModuleId('user') ).toEqual('user');
    expect( ext.mkModuleId('user_view') ).toEqual('userView');
    expect( ext.mkModuleId('user view') ).toEqual('userView');
    expect( ext.mkModuleId('Reports Director') ).toEqual('reportsDirector');
  });
});
