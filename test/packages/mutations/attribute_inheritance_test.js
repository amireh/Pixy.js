describe('Mutations::Inherits', function() {
  it('should inherit an attribute', function() {
    var Parent = Pixy.Model.extend({
      inherits: [ 'favorites' ],
      favorites: {
        fruit: 'bananas'
      }
    });

    var Child = Parent.extend({
      favorites: {
        vegetables: 'none'
      }
    });

    var child;

    expect(function() {
      child = new Child();
    }).not.toThrow();

    expect(child.favorites.fruit).toEqual('bananas');
    expect(child.favorites.vegetables).toEqual('none');
  });

  it('should inherit array @attributes', function() {
    var Parent = Pixy.Model.extend({
      inherits: [ '@toys' ],
      toys: [ 'bibigun' ]
    });

    var Child = Parent.extend({
      toys: [ 'phaser' ]
    });

    var child;

    expect(function() {
      child = new Child();
    }).not.toThrow();

    expect(child.toys).toEqual([ 'bibigun', 'phaser' ]);
  });

  it('should inherit the "requires" attribute', function() {
    var Banana = Pixy.Model.extend({
      module: 'banana'
    });

    var Milk = Pixy.Model.extend({
      module: 'milk'
    });

    var Parent = Pixy.Model.extend({
      inherits: [ '@requires' ],
      requires: [ 'banana' ]
    });

    var Child = Parent.extend({
      requires: [ 'milk' ]
    });

    var child;
    var banana = new Banana;
    var milk = new Milk;

    expect(function() {
      child = new Child();
    }).not.toThrow();

    console.warn('inherited requires:', JSON.stringify(child.requires));

    expect(child.requires).toEqual([ 'banana', 'milk' ]);
    expect(child.banana).toBeTruthy();
    expect(child.milk).toBeTruthy();
  });

  it('should use the child version', function() {
    var Parent = Pixy.Model.extend({
      inherits: [ 'favorites' ],
      favorites: {
        fruit: 'bananas'
      }
    });

    var Child = Parent.extend({
      favorites: {
        fruit: 'none'
      }
    });

    var GrandChild = Child.extend({
      favorites: {
        fruit: 'apple'
      },

      toys: [ 'phaser' ]
    });

    var child;

    expect(function() {
      child = new Child();
    }).not.toThrow();

    expect(child.favorites.fruit).toEqual('none');

    var grandchild;

    expect(function() {
      grandchild = new GrandChild();
    }).not.toThrow();

    expect(grandchild.favorites.fruit).toEqual('apple');
  });

  it('should inherit the "inherit" attribute', function() {
    var Parent = Pixy.Model.extend({
      inherits: [ 'favorites' ],
      favorites: {
        fruit: 'bananas'
      }
    });

    var Child = Parent.extend({
      inherits: [ '@toys' ],
      toys: [ 'bibigun' ]
    });

    var GrandChild = Child.extend({
      favorites: {
        vegetables: 'none'
      },

      toys: [ 'phaser' ]
    });

    var grandchild;

    expect(function() {
      grandchild = new GrandChild();
    }).not.toThrow();

    expect(grandchild.favorites.fruit).toEqual('bananas');
    expect(grandchild.favorites.vegetables).toEqual('none');
    expect(grandchild.toys).toEqual([ 'bibigun', 'phaser' ]);
  });
});