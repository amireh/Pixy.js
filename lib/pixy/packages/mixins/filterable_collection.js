define([
  'underscore',
  '../collection',
  '../model'
], function(_, Collection, Model) {
  'use strict';

  function extractByValue(attr, value) {
    return attr !== value;
  }

  var Filter = Model.extend({
    idAttribute: 'name',

    defaults: {
      attr: '',
      value: null
    },

    fn: function() {},

    toString: function() {
      return [ this.get('attr'), this.get('value') ].join(' -> ');
    }
  });

  var initialize = function() {
    _.extend(this, {
      _filters: new Collection({ model: Filter }),
      _fmodels: []
    });

    this.filterOptions = this.filterOptions || {};

    _.defaults(this.filterOptions, {
      resetOn: 'fetch reset'
    });

    this.on(this.filterOptions.resetOn, this.resetFilters, this);
    this.resetFilters();
  };

  /**
   * @class Backbone.Filterable
   * @alternateClassName Filterable
   *
   * Backbone.Collection add-on that enables soft-filtering of a collection's models.
   */
  var Filterable = {

    /**
     * Define a new attribute filter.
     *
     * @param {String} attr
     *   The model attribute the filter will be tested on.
     *
     * @param {Mixed} value
     *   The attribute value the filter will apply on. If you provide your own
     *   condition callback, this value will be passed to the callback along
     *   with the model to do your own testing.
     *
     * @param {Object} options
     *   Filtering options, see details.
     *
     * @param {Function} [options.condition]
     *   A custom filter function, the default condition is a basic value
     *   equality (operator==) test.
     */
    addFilter: function(attr, value, options) {
      var condition;
      var filter;

      options = options || {};
      condition = options.condition || extractByValue;

      filter = this._filters.add({
        name: options.name || attr,
        attr: attr,
        value: value
      }).last();

      filter.fn = condition;

      return this;
    },

    removeFilter: function(name) {
      var filter = this._filters.get(name);

      this.log('Filter removed:', filter);
      this._filters.remove(filter);

      return this;
    },

    /**
     * Filter out all models based on the active added filters.
     *
     * The filtered models will be hidden from all collection operations until
     * the filters are manually reset.
     *
     * See #addFilter for adding filters.
     */
    applyFilters: function() {
      if (!this._filters.length) {
        if (this._fmodels.length) {
          return this.resetFilters();
        }

        return this;
      }

      /**
       * @event filtering
       *
       * Triggered when the collection is about to apply its filters.
       *
       * @param {Filterable} this
       *        The filterable collection.
       */
      this.trigger('filtering', this);

      this._filters.each(function(filter) {
        var filtered = [];
        var invert = this._filtersInverted;

        this.each(function(model) {
          var isFiltered = filter.fn(
            model.get(filter.get('attr')),
            filter.get('value'),
            model);

          if (invert) {
            isFiltered = !isFiltered;
          }

          if (isFiltered) {
            filtered.push(model);
          }
        });

        _.each(filtered, function(model) {
          /**
           * @event filter_applied
           *
           * Triggered on each model of the collection that has been filtered.
           *
           * @param {Backbone.Model} model
           *   The model in this collection that was filtered.
           */
          model.trigger('filter:applied', model);
          this.remove(model);
          this._fmodels.push(model);
        }, this);
      }, this);

      /**
       * @event filtered
       *
       * Triggered when the collection has applied all active filters.
       *
       * @param {Filterable} this
       *   The collection that has been filtered.
       */
      this.trigger('filtered', this);
      // this.debug('Filtered.');

      return this;
    },

    /**
     * Cancel the filtering effect by restoring the collection to its earlier
     * state.
     *
     * @emit unfiltering
     */
    resetFilters: function(options) {
      options = options || {};

      /**
       * @event unfiltering
       *
       * Triggered when the collection is about to cancel its filters.
       *
       * @param {Filterable} this
       *        The filterable collection.
       */
      if (!options.silent) {
        this.trigger('unfiltering', this);
      }

      if (this._fmodels.length) {
        _.each(this._fmodels, function(model) {
          this.add(model);

          /**
           * @event filter_reset
           *
           * Triggered on each model of the collection that was previously
           * filtered, and now is restored.
           *
           * @param {Backbone.Model} model
           *   The model in this collection that was restored.
           */
          model.trigger('filter:reset', model);
        }, this);

      }

      this._fmodels = [];
      this._filters.reset();

      /**
       * @event unfiltered
       *
       * Triggered when the collection has cancelled all active filters.
       *
       * @param {Filterable} this
       *   The collection that has been unfiltered.
       */
      if (!options.silent) {
        this.trigger('unfiltered', this);
        // this.debug('Unfiltered.');
      }

      return this;
    },

    /**
     * @return {Boolean}
     *         Whether any filters are defined.
     */
    hasFilters: function() {
      return !!this._filters.length;
    },

    /**
     * Invert filters so their outcome gets negated.
     *
     * @param {Boolean} flag
     *        True to invert, false to cancel the inversion.
     */
    invertFilters: function(flag) {
      this._filtersInverted = flag;
    }
  };

  return function(collection) {
    _.extend(collection, Filterable);
    initialize.apply(collection, []);
  };
});