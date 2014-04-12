define([ 'underscore' ], function(_) {
  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps/*[, mixin1, ..., mixinN]*/) {
    var mixins, mixinInitializers, child;
    var parent = this;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    // if (protoProps) _.extend(child.prototype, protoProps);

    // Support for mixing in any number of objects.
    //
    mixins = Array.prototype.slice.call(arguments, 0);

    // Pick up any mixin initializers from the parent.
    mixinInitializers = child.prototype.__mixinInitializers__ || [];

    // Extract all initializers and set them in the child's _initializers
    _.each(mixins, function(mixin, i) {
      if (i+1 === mixins.length) {
        return;
      }

      mixinInitializers.push(mixin.__initialize__);
    });

    child.prototype.__mixinInitializers__ = _.compact(mixinInitializers);

    mixins.unshift(child.prototype);
    _.extend.apply(_, mixins);

    return child;
  };

  return extend;
});
