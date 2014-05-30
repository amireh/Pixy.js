xdescribe('Pixy::Controller', function() {

  afterEach(function() {
    try {
      Pixy.history.stop();
    } catch(e) {}
  });

  var SpecController = Pixy.Controller.extend({
    name: 'SpecController',

    routes: {
      'specs': 'index'
    },

    protected: [ 'specs' ],

    index: function() {
      this.called = true;
    }
  });

  it('should create', function() {
    expect(function() {
      new Pixy.Controller();
    }).not.toThrow();
  });

  it('should register itself in the registry automatically', function() {
    var registrySpy = spyOn(Pixy.Registry, 'registerModule').andCallThrough();
    var subject = new SpecController();

    expect(registrySpy).toHaveBeenCalledWith('SpecController', subject);
    expect(Pixy.Registry.get('specController')).toEqual(subject);
  });

  describe('#forward', function() {
    it('should forward to other controllers', function() {
      var controller = new SpecController();
      var fruitController = new SpecController();

      fruitController.showFruit = function() {};

      spyOn(fruitController, 'showFruit');

      expect(function() {
        controller.forward(fruitController, 'showFruit');
      }).not.toThrow();

      expect(fruitController.showFruit).toHaveBeenCalled();
    });

    it('should reject forwarding to non-controllers', function() {
      var controller = new SpecController();
      var fruitController = new Pixy.Model();

      expect(function() {
        controller.forward(fruitController, 'showFruit');
      }).toThrow(new TypeError('Expected a Pixy.Controller instance.'));
    });

    it('should reject forwarding to an unknown method', function() {
      var controller = new SpecController();
      var fruitController = new SpecController();

      fruitController.name = 'FruitController';

      expect(function() {
        controller.forward(fruitController, 'showFruit');
      }).toThrow(new ReferenceError(
        'FruitController does not respond to #showFruit'));
    });

  });
});