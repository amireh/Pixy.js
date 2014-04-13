describe('Pixy::View', function() {
  describe('construction', function() {
    it('should enqueue event handlers on #render and #remove', function() {
      var view = new Pixy.View();
      expect(view._schedule.render.length).toBeGreaterThan(0);
    });
  });

  describe('rendering', function() {
    it('should fulfill the promise once rendered', function() {
      var view = new Pixy.View();
      view.render = function(options, resolver) {
        setTimeout(function() {
          resolver.resolve();
        }, 5);
      };

      view._render().shouldFulfill().andWait('View to be rendered.');
    });

    it('should fulfill the promise once removed', function() {
      var view = new Pixy.View();
      view.render = function(options, resolver) {
        setTimeout(function() {
          resolver.resolve();
        }, 5);
      }

      view.remove = function(resolver) {
        setTimeout(function() {
          resolver.resolve();
        }, 5);
      };

      view._render().then(function() {
        return view._remove();
      }).shouldFulfill().andWait('View to be rendered and removed.');
    });

    it('should delegate actions', function() {
      var view = new Pixy.View();
      view.template = _.template('<div><a data-action="speak" /></div>');
      view.onSpeak = function() {};
      spyOn(view, 'onSpeak');

      view._render().shouldFulfill(function() {
        view.$('a').click();
        expect(view.onSpeak).toHaveBeenCalled();
      }).andWait('View to render and delegate its actions.');
    });

    it('should attach to a container', function() {
      var view = new Pixy.View();
      view.container = '#fixture';

      view._render().shouldFulfill(function() {
        expect(view.$el.parent()[0]).toEqual($('#fixture')[0]);
      }).andWait('View to render and attach to a container.');
    });
  });
});