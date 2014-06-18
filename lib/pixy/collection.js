define([
  'underscore',
  './namespace',
  './object',
  './model',
  './util',
  './util/wrap'
], function(_, Pixy, PObject, Model, Util, wrap) {
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  /**
   * @class Collection
   *
   * Rip of Backbone.Collection with support for Link-based pagination fetching
   * and caching.
   */

  // Default options for `Collection#set`.
  var defaults = {
    set: { add: true, remove: true, merge: true },
    add: { add: true, merge: false, remove: false }
  };

  var setOptions = defaults.set;
  var addOptions = defaults.add;

  var ctorOptions = [ 'url', 'model', 'cache', 'comparator' ];

  // Define the Collection's inheritable methods.
  var Collection = PObject.extend({
    name: 'Collection',
    meta: {},

    // Create a new **Collection**, perhaps to contain a specific type of `model`.
    // If a `comparator` is specified, the Collection will maintain
    // its models in sort order, as they're added and removed.
    constructor: function(models, options) {
      options || (options = {});

      ctorOptions.forEach(function(option) {
        if (options.hasOwnProperty(option)) {
          this[option] = options[option];
        }
      }.bind(this));

      PObject.call(this, 'collection', function() {
        this._reset();

        if (models) {
          this.reset(models, _.extend({ silent: true, parse: true }));
        }
      }, arguments);
    },

    // The default model for a collection is just a **Pixy.Model**.
    // This should be overridden in most cases.
    model: Model,

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    toProps: function() {
      return this.invoke('toProps');
    },

    // Proxy `Pixy.sync` by default.
    sync: function() {
      return Pixy.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.defaults(options || {}, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults(options || {}, setOptions);
      if (options.parse) models = this.parse(models, options);
      if (!_.isArray(models)) models = models ? [models] : [];
      var i, l, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(models[i], options))) continue;

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.remove) modelMap[existing.cid] = true;
          if (options.merge) {
            existing.set(model.attributes, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }

        // This is a new model, push it to the `toAdd` list.
        } else if (options.add) {
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
      }

      // Remove nonexistent models if appropriate.
      if (options.remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          push.apply(this.models, toAdd);
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = toAdd.length; i < l; i++) {
        (model = toAdd[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (sort) this.trigger('sort', this, options);

      this.broadcastSync();

      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});

      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }

      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({ silent: true }, options));

      if (!options.silent) {
        this.trigger('reset', this, options);
        this.broadcastSync();
      }

      return this;
    },

    resetMeta: function() {
      this.meta = {};
    },

    broadcastSync: function() {
      this.forEach(function(model) {
        model.trigger('sync', model);
      });
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    /**
     * Returns the first model that is not persistent.
     */
    findNew: function() {
      return this.find(function(model) {
        return model.isNew();
      });
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Figure out the smallest index at which a model should be inserted so as
    // to maintain order.
    sortedIndex: function(model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};

      if (options.parse === void 0) {
        options.parse = true;
      }

      options.xhrSuccess = _.bind(this.parseLinkPagination, this);

      options.success = wrap(options.success, function(success, resp) {
        var method = options.reset ? 'reset' : 'set';
        this[method](resp, options);

        success(this, resp, options);

        this.trigger('fetch', this, resp, options);
      }, this);

      Util.wrapError(this, options);

      return this.sync('read', this, options);
    },

    fetchNext: function(options) {
      var that = this;

      options = options || {};
      this.meta.currentPage = options.page || this.meta.nextPage;

      options = _.extend({}, options, {
        xhrSuccess: _.bind(this.parseLinkPagination, this)
      });

      return this.sync('read', this, options).then(function(models) {
        that.add(models, { parse: true });
        if (that.meta.hasMore) {
          that.meta.remainder = that.meta.totalCount - that.length;
        } else {
          that.meta.remainder = 0;
          that.meta.totalCount = that.length;
        }
      });
    },

    fetchAll: function(options) {
      options = options || {};

      if ('page' in options) {
        delete options.page;
      }

      this.meta.nextPage = 1;

      return (function fetch(collection) {
        return collection.fetchNext(options).then(function() {
          if (collection.meta.hasMore) {
            return fetch(collection);
          } else {
            return collection;
          }
        })
      })(this);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp/*, options*/) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
      this.resetMeta();
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    },

    toString: function() {
      return [ this.name, this.id || this.cid ].join('#');
    },

    parseLinkPagination: function(resp, status, jqXHR) {
      var nextLink, lastLink;
      var linkHeader = jqXHR.getResponseHeader('Link');
      var totalCountHeader = jqXHR.getResponseHeader('X-Total-Count');
      var meta = {
        totalCount: undefined,
        remainder: undefined
      };

      var extractLinks = function(link) {
        function getMatches(string, regex) {
          var matches = [];
          var match;

          while (match = regex.exec(string)) {
            matches.push({
              rel: match[2],
              href: match[1],
              page: parseInt(/page=(\d+)/.exec(match[1])[1], 10)
            });
          }

          return matches;
        }

        var links = getMatches(link, RegExp('<([^>]+)>; rel="([^"]+)",?\s*', 'g'));
        return links;
      };

      meta.link = extractLinks(linkHeader);

      nextLink = _.find(meta.link, { rel: 'next' });
      lastLink = _.find(meta.link, { rel: 'last' });

      meta.perPage = parseInt((/per_page=(\d+)/.exec(linkHeader) || [])[1] || 0, 10);
      meta.hasMore = !!nextLink;

      if (totalCountHeader) {
        meta.totalCount = parseInt(totalCountHeader, 10)
      }
      else if (lastLink) {
        meta.totalCount = meta.perPage * lastLink.page;
      }

      if (meta.totalCount !== undefined) {
        meta.remainder = meta.totalCount - this.models.length;
      }

      if (nextLink) {
        meta.nextPage = nextLink.page;
      }

      this.meta = meta;

      return meta;
    }
  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Pixy Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  Collection.setDefaultOptions = function(op, options) {
    _.extend(defaults[op], options);
  };

  return Collection;
});