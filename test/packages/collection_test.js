describe('Pixy.Collection', function() {
  describe('construction', function() {
    it('should create', function() {
      expect(function() {
        new Pixy.Collection();
      }).not.toThrow();
    });

    it('should create with a set of starting models', function() {
      var subject = new Pixy.Collection([{ id: 1 }, { id: 2}]);
      expect(subject.length).toEqual(2);
      expect(subject.pluck('id')).toEqual([1,2]);
    });

    it('should accept a model option', function() {
      var model = function() {};
      var subject = new Pixy.Collection(null, {
        model: model
      });

      expect(subject.model).toEqual(model);
    });

    it('should share a model with another collection', function() {
      var Fruit = Pixy.Model.extend({
        defaults: {
          type: 'fruit'
        }
      });

      var FruitCollection = Pixy.Collection.extend({
        model: Fruit
      });

      var strawberry = new Fruit({
        type: 'strawberry'
      });

      var fruitCollection = new FruitCollection();
      var otherCollection = new FruitCollection();

      fruitCollection.add([ strawberry ]);
      otherCollection.add([ strawberry ]);

      expect(fruitCollection.length).toEqual(1);
      expect(otherCollection.length).toEqual(1);
    });
  });

  it('should broadcast @sync on set', function() {
    var subject = new Pixy.Collection();
    var listener = sinon.stub();

    subject.on('sync', listener);
    subject.set([ {} ], { silent: false });

    expect(listener.callCount).toEqual(1);
  });

  it('should broadcast @sync on resset', function() {
    var subject = new Pixy.Collection();
    var listener = sinon.stub();

    subject.on('sync', listener);
    subject.reset([ {} ]);

    expect(listener.callCount).toEqual(1);
  });
});