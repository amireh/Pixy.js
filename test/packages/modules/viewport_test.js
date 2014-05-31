xdescribe('Core::Viewport', function() {
  var Viewport = Pixy.Viewport;

  beforeEach(function() {
    $('<div id="content" />').appendTo('body');

    Viewport.start().shouldResolve(function() {
      expect(Viewport.isOccupied()).toBeFalsy();
      expect(Viewport.isReady()).toBeTruthy();
    }).andWait('Viewport to start.');
  });

  afterEach(function() {
    if (jasmine.inspecting || !Viewport.isOccupied()) {
      return;
    }

    Viewport.clear().shouldResolve(function() {
      $('#content').remove();
    }).andWait('Viewport to reset.');
  });

  var FruitView = Pixy.View.extend({
    template: _.template('<span id="fruit">Bananas!</span>')
  });

  var VegetablesView = Pixy.View.extend({
    template: _.template('<span id="vegetables">Lettuce!</span>')
  });

  describe('#attach', function() {
    it('should attach a primary view', function() {
      Viewport.attach(FruitView).shouldResolve(function(view) {
        expect(view.$el.length).toEqual(1);
        expect(view.$el.attr('id')).toEqual('fruit');
        expect($('#content span#fruit').is(':visible')).toBeTruthy();
        expect($('#content span#fruit').length).toEqual(1);
      }).andWait('Viewport to attach a view.');
    });

    it('should clear itself before attaching a view', function() {
      var fruitView;

      Viewport.attach(FruitView).then(function(view) {
        fruitView = view;
        spyOn(fruitView, 'remove').andCallThrough();
        expect($('#content span#fruit').length).toEqual(1);
      }).then(function() {
        return Viewport.attach(VegetablesView);
      }).shouldResolve(function(vegetablesView) {
        expect(fruitView.remove).toHaveBeenCalled();
        expect($('#content span#fruit').length).toEqual(0);
        expect($('#content span#vegetables').length).toEqual(1);
      }).andWait('Viewport to attach a view, and then another.');
    });

    it('should reject bogus views', function() {
      expect(function() {
        Viewport.attach({});
      }).toThrow('View must be an instance of Pixy.View');

      expect(function() {
        Viewport.attach();
      }).toThrow('View must be an instance of Pixy.View');
    });
  });

  describe('#clear', function() {
    it('should remove the current view', function() {
      var fruitView;

      Viewport.attach(FruitView).then(function(view) {
        fruitView = view;
        spyOn(fruitView, 'remove').andCallThrough();
      }).then(function() {
        return Viewport.clear();
      }).shouldResolve(function() {
        expect(fruitView.remove).toHaveBeenCalled();
      }).andWait('Viewport to attach a view and then clear itself.');
    });

    it('should reset the currentView after removal', function() {
      Viewport.attach(FruitView).then(function(view) {
        expect(Viewport.isOccupied()).toBeTruthy();
        return Viewport.clear();
      }).shouldResolve(function() {
        expect(Viewport.isOccupied()).toBeFalsy();
      }).andWait('Viewport to attach a view and then clear itself.');
    });
  });
});