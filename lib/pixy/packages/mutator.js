define([ 'underscore', './object', './namespace' ], function(_, PixyObject, Pixy) {
  /**
   * @class Pixy.Mutator
   * @extends Pixy.Object
   *
   * A repository of object mutations that can be applied to specific types of
   * objects, such as making them cacheable, or inheriting parent attributes.
   */
  return PixyObject.extend({
    name: 'Mutator',

    targets: [ 'model', 'collection', 'view', 'router', 'object' ],

    initialize: function() {
      this.reset();

      _.forEach(this.targets, this.__sniff, this);
      // _.invoke(this.targets, _.bind(this.__sniff, this));
    },

    add: function(inTargets, mutation, priority) {
      var targets = inTargets;
      var options;

      if (!_.isArray(targets)) {
        options = inTargets;
        mutation = options.mutation;
        targets = options.targets;
        priority = options.priority;
      }

      _.each(targets, function(target) {
        var set = this.mutations[target];

        if (!set) {
          throw 'Unknown mutation target "' + target + '"';
        }

        set.push({ mutation: mutation, priority: priority || 100 });
      }, this);
    },

    destroy: function() {
      this.stopListening(Pixy);
      this.reset();
    },

    reset: function() {
      this.mutations = _.reduce(this.targets, function(mutations, target) {
        mutations[target] = [];
        return mutations;
      }, {}) || {};
    },

    __sniff: function(target) {
      console.info("Sniffing", target);
      this.listenTo(Pixy, target + ':created', function(object) {
        this.__run(object, this.mutations[target]);
      });
    },

    __run: function(object, mutations) {
      console.info("Applying", mutations.length, "mutations on", object);
      _.chain(mutations).sortBy('priority').each(function(entry) {
        entry.mutation(object);
      });
    }
  });
});