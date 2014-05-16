define([ 'underscore', './object', './namespace' ], function(_, PObject, Pixy) {
  /**
   * @class Pixy.Mutator
   * @extends Pixy.Object
   *
   * A repository of object mutations that can be applied to specific types of
   * objects, such as making them cacheable, or inheriting parent attributes.
   */
  var Mutator = PObject.extend({
    name: 'Mutator',

    targets: [ 'model', 'collection', 'view', 'router', 'object' ],

    constructor: function() {
      this.reset();
      _.forEach(this.targets, this.__sniff, this);
    },

    add: function(options) {
      options = _.extend({}, {
        priority: 100,
        stage: 'after'
      }, options);

      if (!_.isFunction(options.mutation)) {
        console.error('Missing required mutation function. Options passed:', options);
        throw 'Missing required "mutation" function';
      }

      if (!_.contains([ 'before', 'after' ], options.stage)) {
        throw 'Invalid mutation stage "' + options.stage + '", can either be ' +
          ' "before" or "after"';
      }

      _.each(options.targets, function(target) {
        var set = this.mutations[options.stage][target];

        if (!set) {
          throw 'Unknown mutation target "' + target + '"';
        }

        set.push({
          name: options.name,
          mutation: options.mutation,
          stage: options.stage,
          priority: options.priority
        });
      }, this);
    },

    destroy: function() {
      this.stopListening(Pixy);
      this.reset();
    },

    reset: function() {
      this.mutations = _.reduce(this.targets, function(mutations, target) {
        mutations.before[target] = [];
        mutations.after[target] = [];
        return mutations;
      }, { before: {}, after: {} }) || {};
    },

    __sniff: function(target) {
      var before = this.mutations.before;
      var after = this.mutations.after;

      this.listenTo(Pixy, target + ':creating', function(object) {
        this.__run(object, before[target], target);
      });

      this.listenTo(Pixy, target + ':created', function(object) {
        this.__run(object, after[target], target);
      });
    },

    __run: function(object, mutations, objectType) {
      var that = this;

      // console.info("Applying", mutations.length, "mutations on", object);
      _.chain(mutations).sortBy('priority').each(function(entry) {
        try {
          entry.mutation(object, objectType);
        } catch(e) {
          that.warn('Exception caught in mutation "' + entry.name + '":');
          console.error(e.stack || e.message);
        }
      });
    }
  });

  return new Mutator();
});