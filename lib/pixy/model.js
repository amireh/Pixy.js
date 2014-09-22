define([
  'underscore',
  'rsvp',
  './namespace',
  './object',
  './util',
  'rsvp'
],
function(_, RSVP, Pixy, PObject, Util, RSVP) {
  var slice = [].slice;
  var extend = _.extend;
  var clone = _.clone;
  var pick = _.pick;
  var defaults = _.defaults;
  var result = _.result;
  var uniqueId = _.uniqueId;

  // Pixy.Model
  // --------------

  // A list of options to be attached directly to the model, if provided.
  var modelOptions = ['url', 'urlRoot', 'collection', 'cache'];

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Pixy **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Attach all inheritable methods to the Model prototype.
  var Model = PObject.extend({
    name: 'Model',

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Create a new model with the specified attributes. A client id (`cid`)
    // is automatically generated and assigned for you.
    constructor: function(attrs, options) {
      attrs = attrs || {};

      if (!options) {
        options = {};
      }

      this.cid = uniqueId( this.cidPrefix || 'c');
      this.attributes = {};

      extend(this, pick(options, modelOptions));

      attrs = this.parse(attrs, options) || {};
      attrs = this._assignDefaults(attrs);

      PObject.call(this, 'model', function() {

        this.set(attrs, options);
        this.changed = {};

        this.on('sync', this._setServerAttributes, this);
        this._setServerAttributes();
      }, arguments);
    },

    _assignDefaults: function(attrs) {
      return defaults({}, attrs, result(this, 'defaults'));
    },

    _setServerAttributes: function() {
      this.serverAttrs = clone(this.attributes);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    toString: function() {
      return [ this.name, this.id || this.cid ].join('#');
    },

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return clone(this.attributes);
    },

    toProps: function() {
      var attrs = this.toJSON();
      attrs.is_new = this.isNew();
      return Object.keys(attrs).reduce(function(props, key) {
        props[key.camelize(true)] = attrs[key];
        return props;
      }, {});
    },

    // Proxy `Pixy.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Pixy.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      this.normalize(attrs);

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // A chance to coerce or transform any data prior to it being set on the model.
    normalize: function(attrs) {},

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? clone(options) : {};

      var model = this;
      var success = options.success;
      options.success = function(resp) {
        var attrs = model.parse(resp, options);

        if (!model.set(attrs, options)) {
          return false;
        }

        if (success) {
          success(model, resp, options);
        }

        if (!options.silent) {
          model.trigger('sync', model, resp, options);
        }
      };

      Util.wrapError(this, options);
      return this.sync('read', this, options);
    },

    save: function(key, value, options) {
      var that    = this;
      var service = RSVP.defer();

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key === null || _.isObject(key)) {
        options = value;
      }

      options = options || {};
      options.parse = true;

      RSVP.Promise.cast(this.__save.apply(this, arguments)).then(function(data) {
        if (!data) {
          Pixy.warn('Model save failed; local validation failure:', that.validationError);

          return service.reject(that.validationError);
        }

        return service.resolve(that);
      }).otherwise(function(xhrError) {
        var apiError;

        if (xhrError.responseJSON) {
          apiError = xhrError.responseJSON;
        }
        else if (xhrError.responseText) {
          apiError = JSON.parse(xhrError.responseText || '{}') || {};
        }
        // TODO: extract this, make it configurable
        else if ('field_errors' in xhrError) {
          apiError = xhrError;
        }
        else {
          _.defer(function() {
            console.error('Unexpected API error:', xhrError);
          });
        }

        Pixy.warn('Model save failed; XHR failure:', apiError, xhrError);

        that.trigger('invalid', that, apiError, extend({}, options, {
          validationError: apiError
        }));

        return service.reject(apiError);
      });

      return service.promise;
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    __save: function(key, val, options) {
      var model       = this,
          attributes  = this.attributes,
          wasNew      = this.isNew(),
          success,
          attrs,
          method,
          xhr;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) {
        if (options.error) {
          options.error(this, options);
        }

        return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = extend({}, attributes, attrs);
      }
      else if (attrs && this.isNew()) {
        this.attributes = extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;

      success = options.success;

      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = extend(attrs || {}, serverAttrs);

        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {

          if (options.error) {
            options.error(model, options);
          }

          return false;
        }

        if (success) success(model, resp, options);

        model.trigger('sync', model, resp, options);
        model.trigger((wasNew ? 'create' : 'update'), model, resp, options);
      };

      Util.wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');

      if (method === 'patch') {
        options.attrs = attrs;
      }

      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) {
        this.attributes = attributes;
      }

      return xhr;
    },

    /**
     * Restore the model to its last-known state.
     *
     * For newly-created models, this will reset the model and re-prop it with
     * the defaults. For persistent ones, this will restore the model to look
     * the way it did when it was fetched from the server.
     *
     * @param  {Boolean} local
     *         Pass to true to use the cached version of the server
     *         representation, otherwise this will perform a new #fetch().
     *
     * @return {RSVP.Promise}
     */
    restore: function(local) {
      var rc;

      if (this.isNew()) {
        this.clear({ silent: true });
        rc = this.set(this._assignDefaults());
      } else {
        rc = local ? this.set(this.serverAttrs) : this.fetch();
      }

      return RSVP.Promise.cast(rc);
    },

    destroy: function() {
      var service = RSVP.defer();
      var that = this;

      RSVP.Promise.cast(this.__destroy.apply(this, arguments)).then(function(resp) {
        that._events.sync = null;
        that.stopListening();

        service.resolve(resp);

        return resp;
      }).otherwise(function(err) {
        service.reject(err);
        return err;
      });

      return service.promise;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    __destroy: function(options) {
      var success;

      if (!options) {
        options = {};
      }

      success = options.success;

      options.success = function(resp) {
        this.trigger('destroy', this, this.collection, options);

        if (success) {
          success(this, resp, options);
        }
      }.bind(this);

      if (this.isNew()) {
        options.success({});
        return RSVP.resolve();
      }

      Util.wrapError(this, options);

      return this.sync('delete', this, options);
    },

    // Default URL for the model's representation on the server -- if you're
    // using Pixy's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var suffix;
      var base = result(this, 'urlRoot') ||
        result(this.collection, 'url') ||
        Util.urlError();

      if (this.isNew()) {
        return base;
      }

      suffix = base.charAt(base.length - 1) === '/' ? '' : '/';

      return base + (suffix) + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, extend(options || {}, {validationError: error}));
      return false;
    }
  });

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  return Model;
});