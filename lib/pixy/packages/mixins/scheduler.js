define([ 'underscore', 'when' ], function(_, when) {
  'use strict';

  /**
   * @class SchedulerMixin
   *
   * A mixin that allows an object to contain a list of job queues and run them
   * in batches.
   */
  return {
    __initialize__: function() {
      this._schedule = {};

      _.each(this.queues, function(queue) {
        this._schedule[queue] = [];
      }, this);
    },

    scheduleAction: function(queue, callback, thisArg, desc) {
      if (!this._schedule[queue]) {
        throw new Error('Queue "' + queue + '" had not been defined.');
      }

      // this.debug('scheduling action', desc, 'to run on', queue);

      try {
        this._schedule[queue].push(_.bind(callback, thisArg));
      } catch(e) {
        console.error(e.stack);
        throw new Error('Invalid action to schedule:' + e.message);
      }
    },

    run: function(queue) {
      var params = Array.prototype.slice.call(arguments, 1);

      // this.debug('Running',  this._schedule[queue].length, 'actions on queue', queue);

      return when.all(_.map(this._schedule[queue], function(action) {
        return action.apply(action, params);
      }));
    },

    runAll: function() {
      return when.all(_.flatten(_.values(this._schedule)));
    }
  }; // ContainerMixin
});