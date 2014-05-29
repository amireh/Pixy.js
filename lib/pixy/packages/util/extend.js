define([ 'underscore' ], function(_) {
  var slice = [].slice;
  var has = _.has;

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(/*[mixin1, ..., mixinN, ]*/) {
    var mixins, mixinInitializers, child;
    var parent = this;
    var protoProps;

    mixins = slice.call(arguments, 0);

    protoProps = _.last(mixins);

    if (_.has(protoProps, 'mixins')) {
      mixins = _.union(protoProps.mixins, mixins);
    }

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
    // Pick up any mixin initializers from the parent.
    mixinInitializers = _.clone(parent.prototype.__mixinInitializers__ || []);

    // if (mixinInitializers.length) {
    //   console.debug("Inherited", mixinInitializers.length, "mixins from parent:", parent.prototype);
    // }

    // Extract all initializers and set them in the child's _initializers
    _.each(mixins, function(mixin, i) {
      if (i+1 === mixins.length) {
        return;
      }

      var initializer = mixin.__initialize__;

      if (initializer) {
        mixinInitializers.push(initializer);
      } else {
        console.warn("looks like mixin has no initialize?", mixin)
      }
    });

    if (mixinInitializers.length) {
      child.prototype.__mixinInitializers__ = mixinInitializers;
    }

    mixins.unshift(child.prototype);
    _.extend.apply(_, mixins);

    return child;
  };

  extend.withoutMixins = function(protoProps) {
    var mixins, mixinInitializers, child;
    var parent = this;
    var protoProps;

    mixins = slice.call(arguments, 0);

    protoProps = _.last(mixins);

    if (_.has(protoProps, 'mixins')) {
      mixins = _.union(protoProps.mixins, mixins);
    }

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

    // mixins.unshift(child.prototype);
    // _.extend.apply(_, mixins);
    _.extend(child.prototype, protoProps);

    return child;
  }

  return extend;
});
