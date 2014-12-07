define('pixy/mixins/react/util',[ 'inflection' ], function() {
  var Util = {
    getName: function(component) {
      return (component.displayName || Util.getStatic(component, 'displayName'))
        .underscore()
        .camelize();
    },

    render: function(type, initialProps, dontTransferProps) {
      if (!type) {
        return false;
      }
      else if (!type.call) {
        return type;
      }
      else {
        return dontTransferProps ?
          type(initialProps) :
          this.transferPropsTo(type(initialProps));
      }
    },

    getStatic: function(component, name) {
      if (component.originalSpec) { // react 0.11
        return component.originalSpec[name];
      }
      else if (component.constructor) { // react 0.11
        return component.constructor[name];
      }
      else if (component.type) { // react 0.10
        return component.type[name];
      }
      else if (component[name]) {
        return component[name];
      }
      else {
        console.warn(component);
        throw new Error("Unable to get a reference to #statics of component. See console.");
      }
    }
  };

  return Util;
});
define('pixy/mixins/react/layout_manager_mixin',[ 'react', 'lodash', 'rsvp', './util' ], function(React, _, RSVP, Util) {
  var extend = _.extend;
  var merge = _.merge;
  var slice = [].slice;
  var getName = Util.getName;

  var log = function() {
    var params = slice.call(arguments);
    var context = params[0];

    params[0] = getName(context) + ':';

    console.debug.apply(console, params);
  };

  /**
   * Required implementation:
   *
   *  statics: {
   *    getLayout: function(layoutName, props, state) {
   *      return myLayouts[layoutName];
   *    }
   *  }
   */
  return {
    getInitialState: function() {
      return {
      };
    },

    /**
     * Add a new component to a specific layout.
     *
     * @param {React.Class} component
     *        The component factory/type.
     *
     * @param {String} layoutName
     *        Name of the layout to add the component to.
     *
     * @param {Object} [options={}]
     *        Layout-exclusive options.
     *
     * @return {RSVP.Promise}
     */
    add: function(component, layoutName, options) {
      var newState, errorMessage;
      var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
      var svc = RSVP.defer();

      options = options || {};

      if (!layout) {
        return svc.reject('Unknown layout "' + layoutName + '"');
      }

      if (!layout.canAdd(component, options)) {
        errorMessage = 'Component ' + getName(component) +
                       ' can not be added to the layout ' + getName(layout);

        return svc.reject(errorMessage);
      }

      newState = layout.addComponent(component, options, this.state);

      if (!newState) {
        return svc.resolve();
      }

      log(this, 'adding component', getName(component), 'to layout', layoutName);

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    addMany: function(specs) {
      var newState;
      var svc = RSVP.defer();

      newState = specs.reduce(function(state, item) {
        var component = item.component;
        var layoutName = item.layoutName;
        var options = item.options || {};
        var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
        var stateEntry;

        if (!layout) {
          console.error('Unknown layout "' + layoutName + '"');
          return state;
        }

        if (!layout.canAdd(component, options)) {
          console.error(
            'Component ' + getName(component) +
            ' can not be added to the layout ' + getName(layout)
          );

          return state;
        }

        stateEntry = layout.addComponent(component, options, this.state);

        if (!stateEntry) {
          return state;
        }

        log(this, 'adding component', getName(component), 'to layout', layoutName);
        log(this, stateEntry);

        return merge(state, stateEntry);
      }.bind(this), {});

      console.log('Adding many components:', newState, 'from:', specs);

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    /**
     * Detach a component from a layout.
     *
     * @param  {React.Class} component
     *         The component you passed to #add and want to remove.
     *
     * @param  {String} layoutName
     *         The layout the component was mounted in.
     *
     * @return {RSVP.Promise}
     */
    remove: function(component, layoutName, options) {
      var newState;
      var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
      var svc = RSVP.defer();

      options = options || {};

      if (!layout) {
        return svc.reject('Unknown layout "' + layoutName + '"');
      }

      log(this, 'removing component', getName(component), 'from layout', layoutName);

      newState = layout.removeComponent(component, options, this.state);

      if (!newState) {
        return svc.resolve();
      }

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    /**
     * Create a renderable instance of a given layout and assign its children.
     *
     * @param  {React.Class} type
     *         The layout type/constructor.
     *
     * @param  {Object} [props={}]
     *         Layout-specific props, like "key" or "ref".
     *
     * @param  {Boolean} [dontTransferProps=false]
     *         Pass true if you don't want to pass all the props down to the
     *         layout.
     *
     * @return {React.Component}
     *         The renderable instance you can attach in #render().
     */
    renderLayout: function(type, props, dontTransferProps) {
      var layout = type(extend({}, props, {
        components: this.getLayoutChildren(type)
      }));

      return dontTransferProps ? layout : this.transferPropsTo(layout);
    },

    clearLayout: function(type) {
      var newState = {};
      newState[getName(type)] = undefined;
      this.setState(newState);
    },

    /**
     * @internal
     *
     * The components that were added to the layout. The manager doesn't really
     * know what to do with this set, but the layouts do. It is passed to them
     * as the "components" property and they should know how to render them.
     *
     * @param  {React.Class} type
     *         The layout to search for its children.
     *
     * @return {Mixed}
     *         The set of component types the layout can render. This differs
     *         between layouts, refer to its documentation for the structure
     *         of this output.
     */
    getLayoutChildren: function(type) {
      return this.state[getName(type)];
    }
  };
});
define('pixy/mixins/react/layout_mixin',[ 'react', 'underscore', './util' ], function(React, _, Util) {
  var contains = _.contains;
  var update = React.addons.update;
  var render = Util.render;
  var getName = Util.getName;

  var getOutletOccupant = function(outlet, props) {
    var type = props.components[outlet];

    if (!type) {
      return undefined;
    }
    else if (type && 'function' === typeof type.canMount) {
      return type.canMount(props) ? type : undefined;
    }
    else {
      return type;
    }
  };

  var getDefaultOutlet = function(type) {
    return type.defaultOutlet;
  };

  return {
    statics: {
      canAdd: function(component, options) {
        var outlets = this.availableOutlets ? this.availableOutlets() : [];

        return contains(outlets, options.outlet || getDefaultOutlet(this));
      },

      /**
       * @return {Boolean}
       *         Whether any of the layout outlets are currently occupied by
       *         a component.
       */
      isEmpty: function(props, state) {
        var outlet;
        var outlets = props ? props.components : state[getName(this)];

        for (outlet in outlets) {
          if (outlets.hasOwnProperty(outlet) && !!outlets[outlet]) {
            return false;
          }
        }

        return true;
      },

      /**
       * @internal Assign a new outlet component.
       *
       * @param {React.Class} component
       *        The component type/constructor.
       *
       * @param {Object} options (required)
       * @param {String} outlet (required)
       *        Name of the outlet to mount the component in.
       *        If left unspecified, the primary outlet will be assumed.
       *
       * @param {Object} state
       *        The layout manager's state.
       *
       * @return {Object}
       *         The new layout manager's state that contains the newly added
       *         component.
       */
      addComponent: function(component, options, state) {
        var subState;
        var layoutName = getName(this);
        var outlet = options.outlet || getDefaultOutlet(this);
        var newState = {};

        
        if (!state[layoutName]) {
          newState[layoutName] = {};
          newState[layoutName][outlet] = component;
        }
        else {
          subState = {};
          subState[outlet] = {
            $set: component
          };

          newState[layoutName] = update(state[layoutName], subState);
        }

        return newState;
      },

      /**
       * @private
       */
      removeComponent: function(component, options, state) {
        var outlets, outlet, found;
        var layoutName = Util.getName(this);

        outlet = options.outlet || getDefaultOutlet(this);

        // if no "outlet" option was passed in, try to locate the outlet using
        // the component itself if it was occupying one
        if (!outlet) {
          outlets = state[layoutName];

          for (outlet in outlets) {
            if (outlets[outlet] === component) {
              found = true;
              break;
            }
          }

          if (!found) {
            return undefined;
          }
        }

        return this.addComponent(undefined, { outlet: outlet }, state);
      }
    },

    getDefaultProps: function() {
      return {
        /** @internal */
        components: {}
      };
    },

    /**
     * @param  {String}  outlet
     *         The outlet you want to test.
     *
     * @return {Boolean}
     *         Whether the specified outlet has a component to be occupied with.
     */
    hasOutletOccupant: function(outlet) {
      return !!getOutletOccupant(outlet, this.props);
    },

    renderOutlet: function(outlet, initialProps, dontTransferProps) {
      return render.apply(this, [
        getOutletOccupant(outlet, this.props),
        initialProps,
        dontTransferProps
      ]);
    }
  };
});
define('pixy/mixins/react/stacked_layout_mixin',[ 'react', 'underscore', './util' ], function(React, _, Util) {
  var without = _.without;
  var update = React.addons.update;
  var getName = Util.getName;
  var render = Util.render;

  return {
    statics: {
      canAdd: function(/*component, options*/) {
        return true;
      },

      /**
       * @return {Boolean}
       *         Whether the layout has any components to render.
       */
      isEmpty: function(props, state) {
        var components = props ? props.components : state[getName(this)];
        return !components || components.length < 1;
      },

      /**
       * @internal
       */
      addComponent: function(component, state) {
        var newState = {};
        var layoutName = getName(this);

        if (!state[layoutName]) {
          newState[layoutName] = [ component ];
        } else {
          newState[layoutName] = update(state[layoutName], {
            $unshift: [ component ]
          });
        }

        return newState;
      },

      /**
       * @internal
       */
      removeComponent: function(component, state) {
        var newState = {};
        var layoutName = getName(this);

        newState[layoutName] = without(state[layoutName], component);

        return newState;
      }
    },

    getDefaultProps: function() {
      return {
      /** @internal */
        components: []
      };
    },

    getNextComponentType: function() {
      return this.props.components[0];
    },

    renderComponent: function(initialProps, dontTransferProps) {
      return render.apply(this, [
        this.getNextComponentType(),
        initialProps,
        dontTransferProps
      ]);
    }
  };
});
define('pixy/mixins/events',[ 'underscore' ], function(_) {
  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  var slice = Array.prototype.slice;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Pixy events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Pixy.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Pixy.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
        return this;
      }

      if (!this._events) {
        this._events = {};
      }

      if (!this._events[name]) {
        this._events[name] = [];
      }

      this._events[name].push({
        callback: callback,
        context: context,
        ctx: context || this
      });

      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  return Events;
});
define('pixy/mixins/logger',[ 'underscore' ], function(_) {
  var CONTEXT = 'log';
  var Logger = {
    log: function() {
      if (this.options && this.options.mute) {
        return;
      }

      var params;
      var loggerId = this.toString();

      params = _.flatten(arguments || []);
      params.unshift('[' + loggerId + ']: ');

      
      return console[CONTEXT].apply(console, params);
    },

    mute: function() {
      this.__log  = this.log;
      this.log    = function() {};
    },

    unmute: function() {
      this.log    = this.__log;
      this.__log  = null;
    },
  };

  _.each([ 'debug', 'info', 'warn', 'error' ], function(logContext) {
    Logger[logContext] = function() {
      var out;
      CONTEXT = logContext;
      out = this.log.apply(this, arguments);
      CONTEXT = 'log';
      return out;
    };
  });

  return Logger;
});
define('pixy/util',[], function() {
  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) {
        error(model, resp, options);
      }

      model.trigger('error', model, resp, options);
    };
  };

  return {
    urlError: urlError,
    wrapError: wrapError
  };
});
define('pixy/util/sync',[ 'underscore', '../util' ], function(_, Util) {
  var urlError = Util.urlError;
  var result = _.result;
  var extend = _.extend;
  var contains = _.contains;

  // Pixy.sync
  // -------------

  // Map from CRUD to HTTP for our default `Pixy.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  var PAYLOAD_METHODS = [ 'create', 'update', 'patch' ];

  // Override this function to change the manner in which Pixy persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Pixy.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  return function(method, model, options) {
    var params, xhr, attrs;
    var type = methodMap[method];

    // Default options, unless specified.
    options = options || {};

    // Default JSON-request options.
    params = { type: type, dataType: 'json' };

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (!options.data && model && (contains(PAYLOAD_METHODS, method))) {
      attrs = options.attrs || model.toJSON(options);
      model.normalize(attrs);
      params.contentType = 'application/json';
      params.data = JSON.stringify(attrs);
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET') {
      params.processData = false;
    }

    // Make the request, allowing the user to override any Ajax options.
    xhr = options.xhr = this.ajax(extend(params, options));

    model.trigger('request', model, xhr, options);

    return xhr;
  };
});
/* global exports: false */

define('pixy/namespace',[
  'jquery',
  'underscore',
  'rsvp',
  './mixins/events',
  './mixins/logger',
  './util/sync'
], function($, _, RSVP, Events, Logger, sync) {
  var extend = _.extend;

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Pixy` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousPixy = root.Pixy;

  // The top-level namespace. All public Pixy classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Pixy;
  if (typeof exports !== 'undefined') {
    Pixy = exports;
  } else {
    Pixy = root.Pixy = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Pixy.VERSION = '1.8.1';

  Pixy.sync = _.bind(sync, Pixy);
  Pixy.$ = $;

  // Allow the `Pixy` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  extend(Pixy, Events, Logger, {
    name: 'Pixy'
  });

  // Runs Pixy.js in *noConflict* mode, returning the `Pixy` variable
  // to its previous owner. Returns a reference to this Pixy object.
  Pixy.noConflict = function() {
    root.Pixy = previousPixy;
    return this;
  };

  // Set the default implementation of `Pixy.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Pixy.ajax = function() {
    return RSVP.Promise.cast(Pixy.$.ajax.apply(Pixy.$, arguments));
  };

  Pixy.warn = function() {
    if (window.hasOwnProperty('PIXY_TEST')) {
      return;
    }

    return console.warn.apply(console, arguments);
  };

  return Pixy;
});
define('pixy/util/extend',[ 'underscore' ], function(_) {
  var slice = [].slice;
  var has = _.has;

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  //
  // Rip off of Backbone.extend. Adds mixin support.
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

    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    _.extend(child, parent);

    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    _.extend(child.prototype, protoProps);

    return child;
  }

  return extend;
});

define('pixy/object',[
  'underscore',
  './namespace',
  './util/extend',
  './mixins/events',
  './mixins/logger'
], function(_, Pixy, extend, Events, Logger) {
  

  var NOOP = function(){};
  var slice = [].slice;

  var initializeMixins = function() {
    if (!this.__mixinInitializers__) {
      return;
    }

    this.__mixinInitializers__.forEach(function(initializer) {
      try {
        initializer.apply(this, []);
      } catch (e) {
        console.warn('Mixin failed to initialize:', e.stack);
      }
    }.bind(this));

    delete this.__mixinInitializers__;
  };

  /**
   * @class Pixy.Object
   *
   * Creates a new object. This is not meant to be used directly, but instead
   * subclasses should implement their own constructor.
   *
   * See the implementation of resource like Collection or View for examples.
   *
   * @param {String} [type='object']
   *        Object class name.
   *
   * @param {Function} [ctor=null]
   *        If you're defining a new class, you can pass a function that will be
   *        executed after any mixins have been initialized but just before
   *        the user's #initialize() is called.
   *
   * @param {Mixed[]} [args=[]]
   *        Arguments to pass to Pixy.Object#initialize(), the user object
   *        initializer.
   */
  var PObject = function(type, ctor, attrs) {
    if (arguments.length <= 1) {
      attrs = slice.call(arguments);
      type = 'object';
      ctor = NOOP;
    }

    type = type || 'object';

    // Pixy.trigger(type + ':creating', this);

    initializeMixins.call(this);

    if (_.isFunction(ctor)) {
      ctor.call(this);
    } else {
      console.warn('Pixy::Object: expected a constructor function, got:', typeof ctor, this);
    }

    this.initialize.apply(this, attrs);

    // Pixy.trigger(type + ':created', this);

    return this;
  };

  _.extend(PObject.prototype, Events, Logger, {
    name: 'Object',

    initialize: function() {},
    toString: function() {
      return this.name || this.id;
    }
  });

  PObject.extend = extend;

  return PObject;
});

define('pixy/core/dispatcher',[ 'underscore', 'rsvp', '../object' ], function(_, RSVP, PObject) {
  var callbacks = [];
  var supportedActions = [];
  var extend = _.extend;
  var actionIndex = 0;
  var handlers = {};

  /**
   * @class Pixy.Dispatcher
   * @extends Pixy.Object
   *
   * An implementation of the Flux action dispatcher. Responsible for dispatching
   * action payload to Data Stores.
   */
  var Dispatcher = PObject.extend({
    name: 'Dispatcher',

    dispatch: function(actionType, payload, options) {
      var service, action;
      var storeKey, actionId;
      var promise;
      var fragments = actionType.split(':');

      if (fragments.length === 2) {
        storeKey = fragments[0];
        actionId = fragments[1];
      }

      action = extend({}, options, {
        id: actionId,
        storeKey: storeKey,
        type: actionType,
        index: ++actionIndex,
        payload: payload
      });

      if (actionId) {
        if (supportedActions.indexOf(actionType) === -1) {
          console.assert(false, 'No action handler registered to:', actionType);
          promise = RSVP.reject('Unknown action "' + actionId + '"');
        }
        else {
          console.debug('Dispatching targeted action "', actionId, '" with args:', action);
          promise = handlers[storeKey](action);
        }
      }
      else {
        console.debug('Dispatching generic action "',
          action.type,
          '" to all stores:',
          action.payload);

        promise = RSVP.all(callbacks.reduce(function(promises, callback) {
          return promises.concat(callback(action));
        }, []));
      }

      service = {
        promise: promise,
        index: action.index,
        // @deprecated
        actionIndex: action.index
      };

      return service;
    },

    register: function(callback) {
      callbacks.push(callback);
    },

    registerActionHandler: function(action, key) {
      supportedActions.push([ key , action ].join(':'));
    },

    registerHandler: function(key, handler) {
      handlers[key] = handler;
    }

      });

  return new Dispatcher();
});
define('pixy/mixins/react/actor_mixin',['require','../../core/dispatcher'],function(require) {
  var Dispatcher = require('../../core/dispatcher');

  var ActorMixin = {
    getInitialState: function() {
      return {
        actionIndex: null
      };
    },

    getDefaultProps: function() {
      return {
        storeError: null
      };
    },

    componentWillReceiveProps: function(nextProps) {
      var storeError = nextProps.storeError;

      if (storeError && storeError.actionIndex === this.state.actionIndex) {
        this.setState({ storeError: storeError });
      }
    },

    componentDidUpdate: function() {
      if (this.state.storeError) {
        if (this.onStoreError) {
          this.onStoreError(this.state.storeError);
        }

        this.setState({ storeError: null });
      }
    },

    componentWillUnmount: function() {
      this.lastAction = undefined;
    },

    /**
     * @internal
     * @param  {RSVP.Promise} service
     */
    trackAction: function(service) {
      this.lastAction = service.promise;

      this.setState({
        actionIndex: service.index
      });
    },

    /**
     * Convenient method for consuming events.
     *
     * @param {Event} e
     *        Something that responds to #preventDefault().
     */
    consume: function(e) {
      if (e) {
        e.preventDefault();
      }
    },

    /**
     * Send an action via the Dispatcher, track the action promise, and any
     * error the handler raises.
     *
     * A reference to the action handler's promise will be kept in
     * `this.lastAction`. The index of the action is tracked in
     * this.state.actionIndex.
     *
     * If an error is raised, it will be accessible in `this.state.storeError`.
     *
     * @param {String} action (required)
     *        Unique action identifier. Must be scoped by the store key, e.g:
     *        "categories:save", or "users:changePassword".
     *
     * @param {Object} [params={}]
     *        Action payload.
     *
     * @param {Object} [options={}]
     * @param {Boolean} [options.track=true]
     *        Pass as false if you don't want the mixin to perform any tracking.
     *
     * @return {RSVP.Promise}
     *         The action promise which will fulfill if the action succeeds,
     *         or fail if the action doesn't. Failure will be presented by
     *         an error that adheres to the UIError interface.
     */
    sendAction: function(action, params, options) {
      var setState = this.setState.bind(this);
      var service = Dispatcher.dispatch(action, params, {
        source: 'VIEW_ACTION'
      });

      if (options && options.track === false) {
        return;
      }

      this.trackAction(service);

      service.promise.then(null, function(error) {
        setState({
          storeError: {
            actionIndex: service.index,
            error: error
          }
        });
      });

      return service.promise;
    }
  };

  return ActorMixin;
});
define('pixy/ext/react',['require','react','../mixins/react/layout_manager_mixin','../mixins/react/layout_mixin','../mixins/react/stacked_layout_mixin','../mixins/react/actor_mixin'],function(require) {
  var React = require('react');
  var LayoutManagerMixin = require('../mixins/react/layout_manager_mixin');
  var LayoutMixin = require('../mixins/react/layout_mixin');
  var StackedLayoutMixin = require('../mixins/react/stacked_layout_mixin');
  var ActorMixin = require('../mixins/react/actor_mixin');

  React.addons.LayoutManagerMixin = LayoutManagerMixin;
  React.addons.LayoutMixin = LayoutMixin;
  React.addons.StackedLayoutMixin = StackedLayoutMixin;
  React.addons.ActorMixin = ActorMixin;

  return React;
});
define('pixy/ext/jquery',[ 'jquery' ], function($) {
  

  if ($.consume) {
    console.log('$.consume() is already defined, will not override the definition');
  }
  else {
    /**
     * Blocks an event from propagating or bubbling further.
     *
     * Example of *blocking a `click` event after handling it*:
     *
     *     $('#element').on('click', function(evt) {
     *       return $.consume(evt);
     *     });
     *
     * @param {Event} e The event to consume.
     * @return {Boolean} false
     */
    $.consume = function(e) {
      if (!e) {
        return;
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      e.cancelBubble = true;
      e.returnValue = false;

      return false;
    };
  }

  return $;
});
define('pixy/model',[
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
      }, function parseAndReportAPIFailure(xhrError) {
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
          setTimeout(function() {
            console.error('Unexpected API error:', xhrError);
          }, 1);
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
      }, function(err) {
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
/**
 *
 * Backbone.DeepModel v0.10.4
 *
 * Copyright (c) 2013 Charles Davison, Pow Media Ltd
 * Modified by Ahmad Amireh <ahmad@amireh.net> 2014
 *
 * https://github.com/powmedia/backbone-deep-model
 * Licensed under the MIT License
 */

define('pixy/deep_model',[ 'underscore', './model' ], function(_, Model) {
  /**
   * Takes a nested object and returns a shallow object keyed with the path names
   * e.g. { "level1.level2": "value" }
   *
   * @param  {Object}      Nested object e.g. { level1: { level2: 'value' } }
   * @return {Object}      Shallow object with path names e.g. { 'level1.level2': 'value' }
   */
  function objToPaths(obj) {
      var ret = {},
          separator = DeepModel.keyPathSeparator;

      for (var key in obj) {
          var val = obj[key];

          if (val && val.constructor === Object && !_.isEmpty(val)) {
              //Recursion for embedded objects
              var obj2 = objToPaths(val);

              for (var key2 in obj2) {
                  var val2 = obj2[key2];

                  ret[key + separator + key2] = val2;
              }
          } else {
              ret[key] = val;
          }
      }

      return ret;
  }

  /**
   * @param {Object}  Object to fetch attribute from
   * @param {String}  Object path e.g. 'user.name'
   * @return {Mixed}
   */
  function getNested(obj, path, return_exists) {
      var separator = DeepModel.keyPathSeparator;

      var fields = path.split(separator);
      var result = obj;
      return_exists || (return_exists === false);
      for (var i = 0, n = fields.length; i < n; i++) {
          if (return_exists && !_.has(result, fields[i])) {
              return false;
          }
          result = result[fields[i]];

          if (result == null && i < n - 1) {
              result = {};
          }

          if (typeof result === 'undefined') {
              if (return_exists)
              {
                  return true;
              }
              return result;
          }
      }
      if (return_exists)
      {
          return true;
      }
      return result;
  }

  /**
   * @param {Object} obj                Object to fetch attribute from
   * @param {String} path               Object path e.g. 'user.name'
   * @param {Object} [options]          Options
   * @param {Boolean} [options.unset]   Whether to delete the value
   * @param {Mixed}                     Value to set
   */
  function setNested(obj, path, val, options) {
      options = options || {};

      var separator = DeepModel.keyPathSeparator;

      var fields = path.split(separator);
      var result = obj;
      for (var i = 0, n = fields.length; i < n && result !== undefined ; i++) {
          var field = fields[i];

          //If the last in the path, set the value
          if (i === n - 1) {
              options.unset ? delete result[field] : result[field] = val;
          } else {
              //Create the child object if it doesn't exist, or isn't an object
              if (typeof result[field] === 'undefined' || ! _.isObject(result[field])) {
                  result[field] = {};
              }

              //Move onto the next part of the path
              result = result[field];
          }
      }
  }

  function deleteNested(obj, path) {
    setNested(obj, path, null, { unset: true });
  }

  var DeepModel = Model.extend({
    _assignDefaults: function(attrs) {
      return attrs = _.merge({}, _.result(this, 'defaults'), attrs);
    },

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.cloneDeep(this.attributes);
    },

    // Override get
    // Supports nested attributes via the syntax 'obj.attr' e.g. 'author.user.name'
    get: function(attr) {
      return getNested(this.attributes, attr);
    },

    // Override set
    // Supports nested attributes via the syntax 'obj.attr' e.g. 'author.user.name'
    set: function(key, val, options) {
        var attr, attrs, unset, changes, silent, changing, prev, current;
        if (key == null) return this;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (typeof key === 'object') {
          attrs = key;
          options = val || {};
        } else {
          (attrs = {})[key] = val;
        }

        options || (options = {});

        // Run validation.
        if (!this._validate(attrs, options)) return false;

        // Extract attributes and options.
        unset           = options.unset;
        silent          = options.silent;
        changes         = [];
        changing        = this._changing;
        this._changing  = true;

        if (!changing) {
          this._previousAttributes = _.cloneDeep(this.attributes); //<custom>: Replaced _.clone with _.cloneDeep
          this.changed = {};
        }
        current = this.attributes, prev = this._previousAttributes;

        // Check for changes of `id`.
        if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

        //<custom code>
        attrs = objToPaths(attrs);
        //</custom code>

        // For each `set` attribute, update or delete the current value.
        for (attr in attrs) {
          val = attrs[attr];

          //<custom code>: Using getNested, setNested and deleteNested
          if (!_.isEqual(getNested(current, attr), val)) changes.push(attr);
          if (!_.isEqual(getNested(prev, attr), val)) {
            setNested(this.changed, attr, val);
          } else {
            deleteNested(this.changed, attr);
          }
          unset ? deleteNested(current, attr) : setNested(current, attr, val);
          //</custom code>
        }

        // Trigger all relevant attribute changes.
        if (!silent) {
          if (changes.length) this._pending = true;

          //<custom code>
          var separator = DeepModel.keyPathSeparator;

          for (var i = 0, l = changes.length; i < l; i++) {
            var key = changes[i];

            this.trigger('change:' + key, this, getNested(current, key), options);

            var fields = key.split(separator);

            //Trigger change events for parent keys with wildcard (*) notation
            for(var n = fields.length - 1; n > 0; n--) {
              var parentKey = _.first(fields, n).join(separator),
                  wildcardKey = parentKey + separator + '*';

              this.trigger('change:' + wildcardKey, this, getNested(current, parentKey), options);
            }
            //</custom code>
          }
        }

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

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
    clear: function(options) {
      var attrs = {};
      var shallowAttributes = objToPaths(this.attributes);
      for (var key in shallowAttributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return getNested(this.changed, attr) !== undefined;
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      //<custom code>: objToPaths
      if (!diff) return this.hasChanged() ? objToPaths(this.changed) : false;
      //</custom code>

      var old = this._changing ? this._previousAttributes : this.attributes;

      //<custom code>
      diff = objToPaths(diff);
      old = objToPaths(old);
      //</custom code>

      var val, changed = false;
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

      //<custom code>
      return getNested(this._previousAttributes, attr);
      //</custom code>
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      //<custom code>
      return _.cloneDeep(this._previousAttributes);
      //</custom code>
    }
  });

  //Config; override in your app to customise
  DeepModel.keyPathSeparator = '.';

  //Exports
  // Pixy.DeepModel = DeepModel;

  return DeepModel;
});

define('pixy/util/wrap',[], function() {
  

  var sink = function() {};

  /**
   * Wrap a method with another that receives the wrapped method as its first
   * argument, as well as the original arguments the wrapped method would have
   * received.
   *
   * The wrapper does not need to test if the wrapped method exist (in case of
   * user-provided callbacks) because a "sink" method will be provided as
   * default.
   *
   * @param  {Function} method
   *         Method to wrap.
   * @param  {Function} callback
   *         Your wrapper.
   * @param  {[type]}   thisArg
   *         Context to execute the wrapper in.
   * @return {Function}
   *         The wrapper wrapper method.
   */
  return function(method, callback, thisArg) {
    method = method || sink;

    return function() {
      var params = Array.prototype.slice.call(arguments, 0);
      params.unshift(method);
      return callback.apply(thisArg, params);
    }
  };
});
define('pixy/collection',[
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
    add: { add: true, merge: false, remove: false, sort: true }
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
define('pixy/core/history',[
  'underscore',
  '../namespace',
  '../util/extend',
  '../mixins/events'
], function(_, Pixy, extend, Events) {
  var $ = Pixy.$;

  // Pixy.History
  // ----------------

  var normalize = function(fragment) {
    if (!fragment) {
      fragment = '';
    }

    if (fragment[0] === '/') {
      fragment = fragment.slice(1);
    }

    return fragment;
  };

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  var _updateHash = function(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  };

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Pixy.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    /**
     * @cfg {Number} [trackerLimit=50]
     *
     * The maximum number of routes to keep track of.
     */
    trackerLimit: 50,

    /**
     * @property {String[]} routeHistory
     *
     * A history of the visited URIs during this Backbone session..
     */
    routeHistory: [],

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      // return normalize(fragment.replace(routeStripper, ''));
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Pixy.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        $(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        $(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }
    },

    // Disable Pixy.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      $(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    // route: function(route, callback) {
    //   this.handlers.unshift({route: route, callback: callback});
    // },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();

      console.debug('Hash/URL changed:', current)

      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }

      if (current === this.fragment) {
        return false;
      }

      if (this.onHashChange) {
        this.onHashChange(current);
      }

      if (this.iframe) {
        this.navigate(current);
      }
    },

    /**
     * Make history fire a 'navigate' event everytime it navigates and
     * track all the navigated routes.
     */
    navigate: function(fragment, options) {
      var hasChanged, rc;

      // fragment = normalize(fragment);
      // fragment = normalize(this.getFragment(fragment));
      fragment = this.getFragment(fragment);

      hasChanged = this.fragment !== fragment;

      if (!hasChanged) {
        return true;
      }

      rc = this.__navigate(fragment, options);

      if (_.last(this.routeHistory) !== fragment) {
        this.routeHistory.push(fragment);
      }

      if (this.routeHistory.length > this.trackerLimit) {
        this.routeHistory.splice(0,1);
      }

      /**
       * @event navigate
       *
       * Marks that the history object has just successfully navigated
       * to a new route.
       *
       * **This event is triggered on `Backbone`.**
       *
       * @param {String} fragment
       * The URI of the new route.
       */
      this.trigger('navigate', fragment);

      return rc;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    __navigate: function(fragment, options) {
      var url;

      if (!History.started) return false;

      if (!options) {
        options = {};
      }

      this.fragment = fragment;
      url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        _updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          _updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
    },

  });

  return new History();
});
/**
 * @class lodash
 *
 * Pibi.js lodash extensions.
 */
define('pixy/ext/underscore',[ 'underscore' ], function() {
  var defer = _.defer;

  /**
   * @method  defer
   *
   * Defers executing the `func` function until the current call stack has cleared.
   * Additional arguments will be passed to `func` when it is invoked.
   *
   * @param  {Function} func
   * The function to be deferred.
   *
   * @param  {Object} [thisArg=null]
   * The `this` context to apply the function as.
   *
   * @return {Number}
   * The timer id as returned by `setTimeout`.
   */
  _.defer = function(func, thisArg) {
    if (!thisArg) {
      return defer(func);
    }

    return defer(_.bind.apply(null, arguments));
  };

  return _;
});
define('pixy/config',[ './ext/underscore', './namespace', 'rsvp' ], function(_, Pixy, RSVP) {
  

  var extend = _.extend;

  /**
   * @class Config
   *
   * Configuration parameters that are required, or utilized, by different Pixy
   * modules to function correctly.
   *
   * Refer to each parameter for more info.
   */
  var Config = {};

  /**
   * @param {Boolean} [isAuthenticated=false]
   *
   * Required by Mixins.Routes.AccessPolicy
   *
   * @return {Boolean}
   *         Whether the current user is logged in (using an authentic session.)
   */
  Config.isAuthenticated = function() {
    return false;
  };

  /**
   * In case a route defines a view specification and not does specify a layout,
   * this method gives you a chance to provide a default layout name.
   *
   * Since this is a function, you get to provide different layouts based on
   * application state, like authentication.
   *
   * @see Mixins.Routes.Renderer
   *
   * @return {String}
   *         Name of the "default" layout the RendererMixin should render into
   *         if none was specified.
   */
  Config.getCurrentLayoutName = function() {
  };

  /**
   * @cfg {String} [defaultAccessPolicy]
   *
   * An access policy to assume for all routes that do not explicitly define
   * one. Used by Mixins.Routes.AccessPolicy.
   */
  Config.defaultAccessPolicy = undefined;

  /**
   * @cfg {String} [defaultWindowTitle]
   *
   * A string to use as a default window title for all routes that mix-in
   * Mixins.Routes.WindowTitle and do not specify a title.
   */
  Config.getDefaultWindowTitle = function() {
    return 'Pixy';
  };

  Config.getRootRoute = function() {
    return Pixy.routeMap.root;
  };

  Config.loadRoute = function(url, done) {
    return done();
  };

  Pixy.configure = function(config) {
    extend(Config, config);
  };

  return Config;
});
define('pixy/core/router',['require','router','../ext/jquery','rsvp','./history','../config'],function(require) {
  var RouterJS = require('router');
  var $ = require('../ext/jquery');
  var RSVP = require('rsvp');
  var locationBar = require('./history');
  var config = require('../config');

  var replaceState;
  var history = window.history;

  /**
   * @class Pixy.ApplicationRouter
   * @singleton
   *
   * A router.js singleton that manages routing throughout a Pixy app.
   */
  var router;

  /**
   * @internal
   * Normalize a route by adding a leading slash if necessary.
   */
  function normalize(url) {
    url = String(url || '');

    if (url[0] !== '/') {
      url = '/' + url;
    }

    return url;
  }

  /**
   * @internal
   */
  function transitionTo(rawUrl) {
    return router.loadAndTransitionTo(rawUrl);
  }

  /**
   * @internal
   */
  function interceptLink(e) {
    var consumed = $.consume(e);

    transitionTo($(e.currentTarget).attr('href'));

    return consumed;
  }

  router = new RouterJS['default']();

  router.loadAndTransitionTo = function(rawUrl, followRedirects) {
    var svc = RSVP.defer();
    var url = normalize(rawUrl);

    config.loadRoute(url, function onLoad() {
      var transition = router.transitionTo(url);

      console.log('Route bundle for', rawUrl, 'has been loaded. Transitioning...');

      if (followRedirects) {
        svc.resolve(transition.followRedirects());
      }
      else {
        svc.resolve(transition);
      }

      console.debug('\t', transition);
    });

    return svc.promise;
  };

  router.updateURL = function(url) {
    console.info('History URL has changed to:', url);

    this.navigate(url, {
      silent: true,
      trigger: false,
      replace: replaceState
    });

    replaceState = false;
  }.bind(locationBar);

  /**
   * Start the routing engine.
   *
   * @param {Object} options
   *
   * @param {String} [options.root="/"]
   *        Root URL to route from.
   *
   * @param {Boolean} [options.pushState=false]
   *        Whether to use pushState or hash-based routing.
   *
   * @param {Boolean} [options.preload=false]
   *        When true, the router will automatically fire the current route
   *        once the engine has been started.
   *
   * @param {String} [options.locale=null]
   *        If present, the URL root will be prefixed by the locale you specify.
   *        For example, pass in "en" to make the root at "/en/".
   *
   * @return {RSVP.Promise}
   */
  router.start = function(options) {
    var root;
    var initialRoute, search;

    if (!this.getHandler) {
      throw "#getHandler() must be defined before starting the router!";
    }

    options = options || {};

    root = options.root || '/';

    if (options.locale) {
      root += options.locale;
    }

    // Location changes via the back/forward browser buttons
    locationBar.onHashChange = function(url) {
      console.debug('Hash/URL changed:', normalize(url));
      replaceState = true;
      transitionTo(url);
    };

    // Start the history tracker
    locationBar.start({
      pushState: options.pushState,
      root: root,
      silent: true
    });

    // Route all non-external links
    $(document).on('click.appRouter', 'a[href^="/"][target!=_blank]', interceptLink);

    if (!options.preload) {
      return RSVP.resolve();
    }

    initialRoute = normalize(locationBar.fragment);
    search = locationBar.location.search;

    replaceState = true;

    return this.loadAndTransitionTo(initialRoute, true).then(function() {
      // Restore the search query parameters, if there were any:
      if (options.pushState && history.pushState) {
        history.replaceState({}, document.title,
          root + normalize(locationBar.fragment) + search);
      }
    });
  };

  /**
   * Stop the routing engine. Visiting local links will no longer do anything.
   */
  router.stop = function() {
    $(document).off('click.appRouter');
    locationBar.onHashChange = null;
    locationBar.stop();
  };

  return router;
});
define('pixy/util/get',[], function() {
  var get = function(attr, callback) {
    var _attr = this[attr];

    // promise property
    if (_attr && _attr.promise) {
      console.assert(callback && callback.call,
        "You must provide a callback to yield with a promise attribute: " + attr);

      return _attr.promise.then(callback.bind(this));
    }
    // function property
    else if (_attr && this[attr].call) {
      return this[attr].call(this);
    }
    else {
      return _attr;
    }
  };

  return get;
});
define('pixy/route',[
  'underscore',
  './util/extend',
  './util/get',
  './namespace',
  './core/router',
  './mixins/events'
], function(_, extendPrototype, get, Pixy, Router, Events) {
  var extend = _.extend;
  var omit = _.omit;
  var pick = _.pick;
  var pluck = _.pluck;
  var compact = _.compact;
  var keys = _.keys;

  /**
   * @property {Object} routeMap
   * @private
   *
   * A map of the registered route handlers.
   */
  var routeMap = {};
  var lifeCycleHooks = [ 'beforeModel', 'model', 'afterModel', 'enter', 'exit' ];
  var eventHooks = [ 'willTransition', 'didTransition' ];
  var allHooks = lifeCycleHooks.concat(eventHooks);

  var registerRoute = function(name, route) {
    routeMap[name] = route;
  };

  var EventedMixin = {
    exit: function() {
      this.stopListening();
    }
  };

  /**
   * @class Pixy.Route
   *
   * A router.js target handler.
   *
   * @param {String} name (required)
   *        A unique name for the route that will be defined in the routeMap.
   *
   * @param {Object} proto
   *        Your route definition.
   *
   * @param {Boolean} [dontRegister=false]
   *        Pass false if you don't want the route to be automatically
   *        registered in the app route map.
   *
   * Refer to the router.js documentation for handler definitions:
   *
   *     https://github.com/tildeio/router.js
   *
   * ### Mixins
   *
   * Route objects support mixins on the life-cycle hook level. Any mixins that
   * you include in a route will have their life-cycle hooks run _before_ the
   * one that your route implementation defines, giving them the chance to
   * completely bypass your implementation.
   *
   * This is particularly useful for having an authentication mixin.
   *
   * A mixin's life-cycle hook will abort execution of others only if it returns
   * anything other than undefined. You can make use of router.js's propagation
   * of errors by returning a rejected RSVP.Promise, or by throwing an Error,
   * which will be triggered as an event up the chain of routes.
   *
   * Example:
   *
   *     var ProtectedRouteMixin = {
   *       beforeModel: function(transition) {
   *         if (!this.authenticated) {
   *           transition.abort();
   *           this.transitionTo('/login');
   *           return false;
   *         }
   *       }
   *     };
   *
   *     var MyRoute = new Pixy.Route('privateRoute', {
   *       mixins: [ ProtectedRouteMixin ],
   *
   *       beforeModel: function() {
   *         // this will only be called if the mixin's beforeModel doesn't
   *         // reject
   *       },
   *
   *       setup: function() {
   *         // now we're sure we're authenticated
   *       }
   *     })
   *
   * ### Registry
   *
   * Routes are automatically checked-in with the Pixy.Registry and support
   * the "requires" attribute to specify dependencies.
   *
   * Example
   *
   *     var BudgetShowRoute = new Pixy.Route('budgetShow', {
   *       requires: [ 'user' ],
   *
   *       model: function(id) {
   *         // you can use the resolved user dependency now:
   *         return this.user.budgets.get(id);
   *       }
   *     });
   */
  function Route(name, proto, dontRegister) {
    var inheritedProps = extend(this, proto);
    var ownPropKeys = keys(inheritedProps);
    var hooks = pick(inheritedProps, lifeCycleHooks);
    var mixins = inheritedProps.mixins || [];
    var mixinProps, mixinMethods;

    // Don't mix this in if it had already been mixed-in to a parent route.
    if (mixins.indexOf(EventedMixin) === -1) {
      mixins.push(EventedMixin);
    }

    mixinProps = mixins.reduce(function(methods, mixin) {
      var mixinProps = mixin.mixinProps;

      
      extend(methods, mixinProps);
      return methods;
    }, {});

    extend(this, omit(mixinProps, ownPropKeys), {
      name: name
    });

    lifeCycleHooks.forEach(function(hookName) {
      var hook = hooks[hookName];
      var mixinHooks = compact(pluck(mixins, hookName));
      var mixinHooksSz = mixinHooks.length;

      this[hookName] = function() {
        var rc, i;

        // Call all mixin hooks, if any explicitly returns false, abort.
        for (i = 0; i < mixinHooksSz; ++i) {
          rc = mixinHooks[i].apply(this, arguments);

          if (rc !== undefined) {
            return rc;
          }
        }

        // Call our own hook, if defined.
        if (hook) {
          return hook.apply(this, arguments);
        }
      };

      this['__' + hookName] = hook;
    }.bind(this));

    mixins.filter(function(mixin) {
      return !!mixin.initialize;
    }).forEach(function(mixin) {
      mixin.initialize.call(this);
    }.bind(this));

    if (!dontRegister) {
      registerRoute(name, this);
    }

    // Registry.checkObject(this);

    return this;
  }

  extend(Route.prototype, Events, {
    get: get,

    transitionTo: Router.loadAndTransitionTo.bind(Router),
    replaceWith: Router.replaceWith.bind(Router),
    trigger: Router.trigger.bind(Router),

    toString: function() {
      return this.name;
    },

    modelFor: function(routeName) {
      console.assert(routeMap[routeName], 'No route by name of "' + routeName + '"');
      return routeMap[routeName].context;
    },

    /**
     * Reload the model you resolved earlier in #model().
     *
     * @return {RSVP.Promise|Any}
     *         Whatever your #model() returned.
     */
    reload: function() {
      return this.__model();
    },

    injectStoreError: function(action, actionIndex, storeError) {
      if (arguments.length === 2) {
        storeError = actionIndex;
        actionIndex = action;
      }

      this.trigger('storeError', {
        actionIndex: actionIndex,
        error: storeError
      });
    },
  });

  Route.extend = extendPrototype.withoutMixins;

  Pixy.routeMap = routeMap;
  Pixy.registerRoute = registerRoute;

  return Route;
});
define('pixy/util/wrap_array',[],function() {
  return function wrapArray(array) {
    return Array.isArray(array) ? array : [ array ];
  }
});
define('pixy/store',['require','underscore','./mixins/logger','./mixins/events','./core/dispatcher','./util/extend','./util/wrap_array','rsvp','inflection'],function(require) {
  var _ = require('underscore');
  var Logger = require('./mixins/logger');
  var Events = require('./mixins/events');
  var Dispatcher = require('./core/dispatcher');
  var extendPrototype = require('./util/extend');
  var wrapArray = require('./util/wrap_array');
  var RSVP = require('rsvp');
  var InflectionJS = require('inflection');

  var extend = _.extend;
  var keys = _.keys;
  var CHANGE_EVENT = 'change';
  var ACTION_SUCCESS_EVENT = 'actionSuccess';
  var ACTION_ERROR_EVENT = 'actionError';
  var RESPONSE_JSON = 'responseJSON';

  function actionSuccessEventName(action) {
    if (!action) {
      return undefined;
    }

    return [ ACTION_SUCCESS_EVENT, action ].join(':');
  }

  function actionErrorEventName(action) {
    if (!action) {
      return undefined;
    }

    return [ ACTION_ERROR_EVENT, action ].join(':');
  }

  function onPayload(action) {
    var handler;

    if (action.storeKey === this._key) {
      handler = this.actions[action.id];
    }

    return new RSVP.Promise(function(resolve, reject) {
      var onChange = this._actionEmitter(action, resolve);
      var onError = this._errorPropagator(action, reject);

      if (handler) {
        try {
          handler.call(this, action.payload, onChange, onError);
        } catch(error) {
          onError(error);
        }
      }
      else {
        this.onAction(action.type, action.payload, onChange, onError);
        resolve();
      }

    }.bind(this));
  }

  function bind(store, event, callback, context) {
    if (context && context.listenTo) {
      context.listenTo(store, event, callback);
    } else {
      store.on(event, callback, context);
    }
  }

  function unbind(store, event, callback, context) {
    if (context && context.listenTo) {
      context.stopListening(store, event, callback);
    } else {
      store.off(event, callback, context);
    }
  }

  /**
   * @class Pixy.Store
   *
   * An implementation of the Flux Data Store objects.
   */
  var Store = function(name, schema) {
    var key;
    var onAction = onPayload.bind(this);

    extend(this, schema, {
      name: name
    });

    this.reset();

    if (!this._key) {
      key = this._key = name.underscore().replace(/_store$/, '').pluralize().camelize(true);
    }
    else {
      key = this._key;
    }

    Dispatcher.register(onAction);
    Dispatcher.registerHandler(key, onAction);

    keys(this.actions).forEach(function(actionId) {
      Dispatcher.registerActionHandler(actionId, key);
    });

    // Registry.checkObject(this);

    if (this.initialize) {
      this.initialize();
    }
  };


  extend(Store.prototype, Logger, Events, {
    name: 'GenericStore',
    actions: {},

    /**
     * Notify all subscribed listeners that the store's data has been updated.
     */
    emitChange: function(attr, value) {
      this.debug('Broadcasting change.');

      if (attr) {
        this.trigger('change:' + attr, value);
      }

      this.trigger(CHANGE_EVENT);
    },

    emitActionSuccess: function(action, actionIndex) {
      this.debug('Broadcasting action success:', action);
      this.trigger(actionSuccessEventName(action), actionIndex, action);
      this.trigger(ACTION_SUCCESS_EVENT, action, actionIndex);
    },

    /**
     * Notify subscribers that an error was raised performing a specific store
     * action.
     *
     * @param  {String} action
     *         Name of the action in which the error was raisde.
     *
     * @param  {Integer} actionIndex
     *         The action index generated by the dispatcher.
     *
     * @param  {Object} error
     *         The error.
     */
    emitActionError: function(action, actionIndex, error) {
      this.warn('Broadcasting action error:', action, '#', actionIndex);
      this.warn(error, (error && error.stack ? error.stack : undefined));

      this.trigger(actionErrorEventName(action), actionIndex, error);
      this.trigger(ACTION_ERROR_EVENT, action, actionIndex, error);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback, thisArg) {
      bind(this, CHANGE_EVENT, callback, thisArg);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback, thisArg) {
      unbind(this, CHANGE_EVENT, callback, thisArg);
    },

    /**
     * Register an action success handler for a specific store action.
     *
     * @param {String}   action
     * @param {Function} callback
     */
    addActionSuccessListener: function(actions, callback, thisArg) {
      var that = this;
      wrapArray(actions).forEach(function(action) {
        bind(that, actionSuccessEventName(action), callback, thisArg);
      });
    },

    removeActionSuccessListener: function(action, callback, thisArg) {
      unbind(this, actionSuccessEventName(action), callback, thisArg);
    },

    /**
     * Register an error handler for a specific store action.
     *
     * @param {String}   action
     *        A specific action to listen to for errors. Errors caused in other
     *        actions will not be dispatched to your callback.
     *
     * @param {Function} callback
     */
    addActionErrorListener: function(action, callback, thisArg) {
      bind(this, actionErrorEventName(action), callback, thisArg);
    },

    removeActionErrorListener: function(action, callback, thisArg) {
      unbind(this, actionErrorEventName(action), callback, thisArg);
    },

    /**
     * Register an error handler to be called on any store action error.
     *
     * @param {Function} callback
     */
    addErrorListener: function(callback, thisArg) {
      bind(this, ACTION_ERROR_EVENT, callback, thisArg);
    },

    removeErrorListener: function(callback, thisArg) {
      unbind(this, ACTION_ERROR_EVENT, callback, thisArg);
    },

    /**
     * @protected
     *
     * Dispatcher callback for this store. This is where you receive the payload
     * from the dispatcher and get a chance to handle the action if you know how
     * to.
     *
     * @param  {String} action
     *         Unique action id. Usually identified by a constant.
     *
     * @param  {Object} payload
     *         Action-specific parameters.
     *
     * @param {Function} onError
     *        Call this if your handler was unable to process the action.
     *        See #_errorPropagator for more information.
     */
    onAction: function(/*action, payload, onError*/) {
    },

    /**
     * @private
     *
     * @note This is automatically generated for you and passed as an argument
     *       to #onAction.
     *
     * @param {Object} action
     *        The action specification.
     *
     * @param {String} action.type (required)
     *        Unique name of the action.
     *
     * @param {Integer} action.index (required)
     *        Action instance identifier as generated by the dispatcher.
     *
     * @return {Function}
     *         An "onError" function to pass to your action handler so that it
     *         calls it if it couldn't process the action.
     *
     *         The callback receives a single argument which should be an object
     *         describing your error.
     *
     *         The callback will emit the appropate action error.
     */
    _errorPropagator: function(action, reject) {
      return function(error) {
        if (error && _.isObject(error) && RESPONSE_JSON in error) {
          error = error.responseJSON;
        }

        this.emitActionError(action.type, action.index, error);
        reject(error);
      }.bind(this);
    },

    _actionEmitter: function(action, resolve) {
      return function(attr, value) {
        this.emitActionSuccess(action.type, action.index);
        this.emitChange(attr, value);
        resolve(arguments.length === 2 ? value : attr);
      }.bind(this);
    },

    toString: function() {
      return this.name;
    },

    reset: function() {
      this.state = this.getInitialState();
    },

    getInitialState: function() {
      return {};
    },

    setState: function(newState) {
      extend(this.state, newState);
      this.emitChange();
    }
  });

  Store.extend = extendPrototype;

  return Store;
});
define('pixy/logging_context',[ 'underscore', './mixins/logger' ], function(_, Logger) {
  

  /**
   * @class Pixy.LoggingContext
   *
   * A free-form logger object. You can instantiate a logging context with
   * a certain name, and utilize the Pixy.Logger facilities on it.
   *
   * @example
   *
   *     var boot;
   *     boot = new Pixy.LoggingContext('Boot');
   *     boot.debug('loading data'); // => console.debug('Boot: loading data')
   */
  var LoggingContext = function(name) {
    this.toString = function() { return name; }
  };

  _.extend(LoggingContext.prototype, Logger);

  return LoggingContext;
});
define('pixy/core/cache',[
  'underscore',
  '../namespace',
  '../object',
  '../model',
  '../deep_model',
  '../collection',
], function(_, Pixy, PObject, Model, DeepModel, Collection) {
  

  var useCache = false;
  var hasCache = false;
  var adapter;
  var result = function(object, prop, thisArg) {
    if (typeof object[prop] === 'function') {
      return object[prop].call(thisArg || this);
    } else {
      return object[prop];
    }
  };

  var CacheEvents = {
    Model: {
      updateOn: 'sync',
      purgeOn:  'clear destroy'
    },

    Collection: {
      updateOn: 'add sync remove',
      purgeOn:  'reset'
    }
  };

  /**
   * @ignore
   */
  var shouldUseCache = function(options) {
    options = options || {};

    if (options.noCache) {
      return false;
    }

    return options.useCache === void 0 ?
      hasCache && useCache :
      hasCache && options.useCache;
  };

  /**
   * @ignore
   */
  var parseEvents = function(that) {
    var
    defaultEvents = _.clone(that._cacheEvents),
    updateOn      = that.cache.updateOn || that.cache.events,
    purgeOn       = that.cache.purgeOn;

    if (that.cache.updateOn === void 0) {
      updateOn = defaultEvents.updateOn;
    }

    if (that.cache.purgeOn === void 0) {
      purgeOn = defaultEvents.purgeOn;
    }

    return { updateOn: updateOn, purgeOn: purgeOn };
  };

  /**
   * @class Pixy.Cacheable
   *
   * Modules that can be transparently persisted into a storage layer.
   *
   * **This interface should not be used directly, use Pixy.CachePlugin instead.**
   */
  var Cacheable = {
    addCacheListeners: function() {
      if (!this.cache.manual) {
        // var events = parseEvents(this);
        var events = this._cacheEvents;

        if (events.updateOn) {
          this.on(events.updateOn, this.updateCacheEntry, this);
        }

        if (events.purgeOn) {
          this.on(events.purgeOn, this.purgeCacheEntry, this);
        }

        return true;
      }
    },

    removeCacheListeners: function() {
      if (!this.cache.manual) {
        // var events = parseEvents(this);
        var events = this._cacheEvents;

        if (events.updateOn) {
          this.off(events.updateOn, this.updateCacheEntry, this);
        }

        if (events.purgeOn) {
          this.off(events.purgeOn, this.purgeCacheEntry, this);
        }

        return true;
      }
    },

    /**
     * A cache-enabled drop-in for Pixy#fetch.
     *
     * Looks up the cache for an entry for this resource and calls back
     * the appropriate handlers detailed below.
     *
     * **This is not an async OP.**
     *
     * > You can reference `options.cached` in your handlers to tell whether
     * > the response was pulled out of the cache or from the remote endpoint.
     *
     * @param {Object} [options={}]
     * Regulard Pixy request options construct, with special callbacks.
     *
     * @param {Function} [options.success]
     * A function to be called when a cached version was found.
     * @param {Object} options.success.data
     * The cached response.
     * @param {Object} options.success.options
     * The request options.
     *
     * @param {Function} [options.error]
     * A function to be called when no cached version is available.
     * @param {Mixed} options.error.resource
     * The resource being cached.
     * @param {Object} options.error.options
     * The request options.
     *
     * @param {Function} [options.complete]
     * A function to be called when fetch completes, with either status.
     * @param {Mixed} options.complete.resource
     * The resource being cached.
     * @param {Object} options.complete.options
     * The request options.
     */
    fetchCached: function(options) {
      options = options || {};
      options.cached = true;
      options.transport = 'localStorage';
      options.data = this.getCacheEntry();

      return Pixy.sync.call(this, 'read', this, options);
    },

    /**
     * Retrieve the cached version (if any) of this resource.
     *
     * @return {Object/null}
     * The cached JSON entry for this resource, or `null` when the adapter isn't
     * available.
     */
    getCacheEntry: function() {
      var key;

      if (!hasCache) {
        return null;
      }

      key = result(this.cache, 'key', this);

      return adapter.get(key);
    },

    /**
     * Create or update the cache entry.
     *
     * The entry can be 'namespaced' based on the cache.usePrefix variable.
     * If set to `true`, the `cache.key` will be used as a namespace, and if
     * set to a String or a Function, the value will be used as a namespace.
     *
     * @note
     * This is a no-op if caching for this resource has been disabled,
     * the adapter isn't available, or the resource cache key does not evaluate
     * to true.
     */
    updateCacheEntry: function(resource, response, options) {
      var prefix;
      var data = {};
      var key = result(this.cache, 'key', this);

      if (this.cacheDisabled || !hasCache || !key) {
        return this;
      }
      else if (options && options.cached) {
        return this;
      }

      // Resolve the entry prefix
      if (this.cache.usePrefix) {
        if (_.isBoolean(this.cache.usePrefix)) {
          prefix = result(this.cache, 'key', this);
        }
        else {
          prefix = result(this.cache, 'usePrefix', this);
        }

        data[prefix] = this.toJSON();
      }
      else {
        data = this.toJSON();
      }

      
      adapter.set(key, data);

      return this;
    },

    /**
     * Remove the cache entry (if any).
     *
     * @note
     * This is a no-op if caching for this resource has been disabled,
     * the adapter isn't available, or the resource cache key does not evaluate
     * to true.
     */
    purgeCacheEntry: function() {
      var key = result(this.cache, 'key', this);

      if (this.cacheDisabled || !shouldUseCache({}) || !key) {
        return this;
      }

      adapter.remove(key);

      return this;
    },

    /**
     * Freezes the cache entry. Updates and purges will no longer go through.
     *
     * This is particularly helpful for collections when you know you'll be
     * modifying the resource heavily while resetting or fetching, so you can
     * choose to disable caching prior to fetching, and re-enable it once all
     * the models have been added.
     *
     * This is a no-op if caching was already disabled for this resource.
     *
     * See #enableCaching
     */
    disableCaching: function() {
      if (!this.cacheDisabled) {
        this.cacheDisabled = true;
        console.warn(this.toString() + ': caching disabled.');
      }

      return this;
    },

    /**
     * Updates and purges of the cache entry will once again be processed.
     *
     * This is a no-op if caching was not disabled for this resource.
     *
     * See #disableCaching
     */
    enableCaching: function() {
      if (this.cacheDisabled) {
        delete this.cacheDisabled;
      }

      return this;
    }
  };

  /**
   * @class Pixy.CacheableModel
   * @extends Pixy.Model
   * @mixins Pixy.Cacheable
   */
  var CacheableModel = {
    /**
     * Sync the model with the server version, and update the cache entry
     * unless #manual or options.cached are enabled.
     */
    sync: function(op, resource, options) {
      options = options || {};

      if (op === 'read') {
        var success = options.success;
        var useCache = shouldUseCache(options);
        var that = this;

        options.success = function(data, options) {
          var out = success && success(data, options);

          if (!options.cached && !that.cache.manual) {
            that.updateCacheEntry();
          }

          return out;
        };

        if ( useCache ) {
          return this.fetchCached(options);
        }
      }

      return this._noCache.sync.apply(this, arguments);
    },

    /**
     * Update the model's cache entry unless options.silent is on, or
     * this.cache.manual is on.
     *
     * Delegates to Pixy.Model#set.
     */
    set: function(key, value, options) {
      var out = this._noCache.set.apply(this, arguments);

      if (!key) {
        return out;
      }

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (_.isObject(key)) {
        options = value;
      }

      options = options || {};

      if (!this._changing && !options.silent && !this.cache.manual) {
        this.updateCacheEntry();
      }

      return out;
    },

    clear: function() {
      if (!this.cache.manual) {
        this.purgeCacheEntry();
      }

      return this._noCache.clear.apply(this, arguments);
    }
  };

  /**
   * @class Pixy.CacheableCollection
   * @extends Pixy.Model
   * @mixins Pixy.Cacheable
   */
  var CacheableCollection = {
    /**
     * Updates the cache entry on successful non-cache requests.
     *
     * On 'use cache' requests, this method intercepts #fetch and returns a cached
     * version, otherwise the original #fetch is delegated.
     *
     * Caching is disabled during the fetch operation.
     *
     * See Cacheable#shouldUseCache
     */
    sync: function(op, resource, options) {
      options = options || {};

      if (op == 'read') {
        var that = this;
        var success = options.success;
        var complete = options.complete;
        var useCache = shouldUseCache(options);
        var oldXhrSuccess = options.xhrSuccess;

        // update the pagination meta if we're using the cached version
        options.xhrSuccess = function() {
          oldXhrSuccess.apply(this, arguments);

          if (!options.cached) {
            that.meta.cached = false;
          } else {
            that.meta.totalCount = that.length;
            that.meta.remainder = 0;
            that.meta.cached = true;
          }
        };

        options.success = function() {
          var out;

          if (success) {
            out = success.apply(success, arguments);
          }

          // Cache the response if the collection supports caching and the response
          // wasn't pulled from the cache.
          if (!options.cached) {
            that.updateCacheEntry();
          }

          return out;
        };

        options.complete = function() {
          that.addCacheListeners();

          if (complete) {
            return complete.apply(complete, arguments);
          }
        };

        this.removeCacheListeners();

        // Should we get a cached version?
        if ( useCache ) {
          return this.fetchCached(options);
        }
      }

      return this._noCache.sync.apply(this, arguments);
    }
  };

  var Cacheables = {
    Model: CacheableModel,
    Collection: CacheableCollection
  };

  /**
   * @class Pixy.Plugin.Cache
   * @extends Pixy.Plugin
   *
   * A caching layer for Pixy models and collections.
   */
  var Cache = PObject.extend({
    name: 'Cache',

    options: {
      preloadingEnabled: true,
      events: {}
    },

    constructor: function(options) {
      options = options || {};

      var ensureKlassName = function(klass, klassName) {
        if (!klass.prototype.klass) {
          klass.prototype.klass = klassName;
        }
      };

      var trackOverriddenMethods = function(klass, cacheableName) {
        var methodId;
        var proto = klass.prototype;
        var cacheable = Cacheables[cacheableName];

        proto._noCache = {};

        for (methodId in cacheable) {
          proto._noCache[methodId] = proto[methodId];
        }
      };

      _.merge(CacheEvents, this.options.events, options.events);

      ensureKlassName(Model, 'Model');
      ensureKlassName(Collection, 'Collection');

      trackOverriddenMethods(Model, 'Model');
      trackOverriddenMethods(Collection, 'Collection');
    },

    destroy: function() {
      _.each([ Model, Collection ], function(klass) {
        delete klass.prototype._noCache;
        delete klass.prototype.klass;
      });
    },

    makeCacheable: function(entity) {
      // Cache-enabled objects must have a 'cache' object defined.
      if (!entity.cache || !_.isObject(entity.cache)) {
        return;
      }

      var klass = entity.klass;
      var klassEvents = CacheEvents[klass];
      var klassCacheableInterface = Cacheables[klass];

      // The next part deals with resolving conflicts between method overrides:
      //
      // If the entity has defined any of the methods we'll be overriding,
      // we must track the instance methods instead of the prototype ones
      // in the _noCache key, otherwise the instance methods will never be
      // called.
      //
      // It's good to keep in mind that there may be 3 versions of each method:
      //
      // - the prototype base version
      // - the instance override/implementation version
      // - the Cacheable version
      //
      // Chain goes like Cacheable -> Instance -> Prototype
      var instanceMethods = [];
      for (var cacheableMethod in klassCacheableInterface) {
        if (entity[cacheableMethod]) {
          instanceMethods.push( cacheableMethod );
        }
      }

      if (instanceMethods.length) {
        // Start with the prototype methods, and override as needed
        //
        // Important: must use _.clone, otherwise we'll be overriding the methods
        // for _all_ instances of this class
        entity._noCache = _.clone(Pixy[klass].prototype._noCache);

        _.each(instanceMethods, function(idMethod) {
          // Use instance version
          entity._noCache[idMethod] = entity[idMethod];
        });
      }

      // Mixin the Cacheable interface(s)
      _.extend(entity, Cacheable, klassCacheableInterface, {
        _cacheEvents: _.clone(klassEvents)
      });

      entity._cacheEvents = parseEvents(entity);
      entity.addCacheListeners();

      // Preload cached data, if requested.
      if (entity.cache.preload && this.options.preloadingEnabled) {
        var preload = function() {
          if (!hasCache) {
            console.error('can not preload', entity.id, 'as cache is not available.');
            return;
          }

          entity.set(entity.getCacheEntry());
        };

        hasCache ? preload() : _.defer(preload) /* try later */;
      }

      // console.log('added cache listeners:', entity._cacheEvents);
      // this.log('entity#', entity.id || entity.name, 'is now cacheable.');
    },

    /**
     * Install a storage adapter to use as a caching persistence layer.
     *
     * The adapter must provide an implementation of the methods outlined below:
     *
     * **Note**:
     *
     * I don't think it's possible to test whether the adapter actually
     * conforms to the argument types without an external tool, so my best bet
     * is to say that the behaviour is undefined if the adapter *does* implement
     * the methods but does not accept the expected arguments.
     *
     * @param {Object} in_adapter
     *
     * A storage adapter which must provide an implementation of the methods
     * outlined below.
     *
     * @param {Function} in_adapter.set       A method for storing records.
     * @param {String} in_adapter.set.key     The key to use for storing the record.
     * @param {Mixed} in_adapter.set.value    The value to store.
     *
     * @param {Function} in_adapter.get       A method for retrieving records.
     * @param {String} in_adapter.get.key     The record key.
     *
     * @param {Function} in_adapter.remove    A method for removing records.
     * @param {String} in_adapter.remove.key  Key of the record to remove.
     *
     * @param {Function} in_adapter.clear     Clear all stored records.
     *
     * @fires adapter_installed
     */
    setAdapter: function(in_adapter) {
      // Make sure the adapter adopts an interface we can use.
      _.each([ 'set', 'get', 'remove', 'clear' ], function(required_method) {
        var method = in_adapter[required_method];

        if (!_.isFunction(method)) {
          throw new TypeError([
            this.name, 'bad adapter: missing method implemention #',
            required_method
          ].join(' '));
        }
      });

      adapter = in_adapter;

      /**
       * @event adapter_installed
       *
       * A caching adapter has been installed for use to cache Pixy entities.
       *
       * **This event is triggered on Pixy.Cache.**
       *
       * @param {Pixy.Cache} Cache
       * Pixy.Cache plugin instance (`this`).
       *
       * @param {Object} adapter
       * The cache adapter that has been installed.
       */
      return this.trigger('adapter_installed', this, adapter);
    },

    getAdapter: function() {
      return adapter;
    },

    /**
     * Tell the plug-in whether the cache adapter is available for use.
     *
     * IE, localStorage might not be supported on the current browser, in which
     * case you should pass false and caching will be transparently disabled.
     *
     * @fires available
     */
    setAvailable: function(flag) {
      this.__ensureAdapterSet();

      hasCache = flag;

      /**
       * @event available
       *
       * A storage adapter has been installed and Pixy.Cache is ready to
       * be used.
       *
       * @param {Pixy.Cache} Cache
       * The (`this`) Pixy.Cache plugin instance.
       */
      return this.trigger('available', this);
    },

    /**
     * Whether an adapter is installed and is available for use.
     *
     * @note
     * An adapter being available does not necessarily mean that caching will
     * be enabled. The adapter must be both available and the plugin enabled
     * for caching to be enabled.
     *
     * See #isEnabled
     */
    isAvailable: function() {
      this.__ensureAdapterSet();

      return hasCache;
    },

    /**
     * If available,
     *
     * @note An adapter must be set first using #setAdapter.
     *
     * @fires enabled
     */
    enable: function() {
      if (!this.isEnabled() && (useCache = this.isAvailable())) {

        /**
         * @event enabled
         *
         * A storage adapter is available and the plugin was disabled, and has
         * just been enabled.
         *
         * @param {Pixy.Cache} Cache
         * The (`this`) Pixy.Cache plugin instance.
         */
        this.trigger('enabled', this);
      }

      return this;
    },

    /**
     * Turn off caching for all modules.
     *
     * @fires disabled
     */
    disable: function() {
      useCache = false;

      /**
       * @event disabled
       *
       * Pixy entities will no longer be cached.
       *
       * @param {Pixy.Cache} Cache
       * The (`this`) Pixy.Cache plugin instance.
       */
      return this.trigger('disabled', this);
    },

    /**
     * Whether an adapter is set, is available, and the plugin (and caching) enabled.
     */
    isEnabled: function() {
      return this.isAvailable() && useCache;
    },

    /** @private */
    __ensureAdapterSet: function() {
      if (!adapter) {
        throw this.name + ': you must set an adapter first! use #setAdapter';
      }
    }
  });

  return new Cache();
});
define('pixy/mixins/filterable_collection',[
  'underscore',
  '../collection',
  '../model'
], function(_, Collection, Model) {
  

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


  /**
   * @class Backbone.Filterable
   * @alternateClassName Filterable
   *
   * Backbone.Collection add-on that enables soft-filtering of a collection's models.
   */
  var Filterable = {
    __initialize__: function() {
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
    },

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

  return Filterable;
});
define('pixy/mixins/routes/access_policy',[ '../../config', 'rsvp' ], function(Config, RSVP) {
  var RC_PASS = void 0;

  var logTransition = function(transition) {
    return [ transition.intent.url, transition.targetName ].join(' => ');
  };

  /**
   * @class Mixins.Routes.AccessPolicy
   *
   * @requires Config
   */
  return {
    mixinProps: {
      /**
       * @cfg {"public"|"private"} accessPolicy
       *
       * Set to "public" if you don't want this route to be visited by a user
       * that is logged-in.
       *
       * Set to "private" to restrict access to the route to logged-in users.
       *
       * Unset to skip the access policy checks, then routes can be visited
       * at any time.
       *
       * @see Config.defaultAccessPolicy
       */
      accessPolicy: Config.defaultAccessPolicy,

      isAccessible: function() {
        var isAuthenticated = Config.isAuthenticated();

        if (this.accessPolicy === 'public' && isAuthenticated) {
          return false;
        }
        else if (this.accessPolicy === 'private' && !isAuthenticated) {
          return false;
        }
        else {
          return true;
        }
      }
    },

    beforeModel: function(transition) {
      if (this.isAccessible()) {
        return RC_PASS;
      }
      else if (this.accessPolicy === 'public' ) {
        console.warn('Over-privileged access to:', logTransition(transition));
        return RSVP.reject('Overauthorized');
      }
      else {
        console.warn('Unprivileged access to:', logTransition(transition));
        return RSVP.reject('Unauthorized');
      }
    }
  };
});
define('pixy/mixins/routes/loading',[], function() {
  var canTrigger = function(transition) {
    return !!transition.router.currentHandlerInfos;
  };

  /**
   * @class Mixins.Routes.Loading
   *
   * Trigger a "loading" event as soon as the route starts resolving its model,
   * and another once it's been resolved.
   *
   * You must define a "loading" event handler to make use of this. For example,
   * to show a progress indicator.
   */
  return {
    model: function(params, transition) {
      if (!canTrigger(transition) || !this.__model) {
        return;
      }

      this.trigger('loading', true);
      this._loading = true;
      console.info(this.name, 'Loading');
    },

    afterModel: function(/*model, transition*/) {
      if (!this._loading) {
        return;
      }

      console.info(this.name, 'Hiding loading status.');
      this._loading = false;
      this.trigger('loading', false);
    }
  };
});
define('pixy/mixins/routes/props',[ 'underscore', '../../config' ], function(_, Config) {
  var uniq = _.uniq;
  var keys = _.keys;
  var rootRoute;

  /** @internal */
  var extractKeys = function(oldKeys, newProps) {
    return uniq(keys(newProps).concat(oldKeys || []));
  };

  var setProps = function(props, route, callback) {
    if (!rootRoute) {
      rootRoute = Config.getRootRoute();
    }

    console.assert(rootRoute, 'You must assign a root route that responds to' +
    ' #update and #ready() to use the PropsMixin.');

    // We need to be sure that the layout has been mounted before we attempt
    // to update the props.
    //
    // This is really smelly but it's necessary.
    rootRoute.ready(function() {
      route.trigger('update', props);

      if (callback) {
        callback.call(route);
      }
    });
  };

  /**
   * @class Mixins.Routes.Props
   *
   * Utility for injecting props into the master layout.
   *
   * The mixin automatically takes care of cleaning up any props you inject
   * after the route exits.
   */
  return {
    mixinProps: {
      /** @internal  */
      _propKeys: [],

      update: function(props) {
        setProps(props, this, function() {
          // Track the injected props so we can clean them up on exit.
          this._propKeys = extractKeys(this._propKeys, props);
        });
      },
    },

    afterModel: function(model) {
      this.context = this.context || model;
    },

    exit: function() {
      var props = this._propKeys.reduce(function(props, key) {
        props[key] = undefined;
        return props;
      }, {});

      setProps(props, this);
      this.context = undefined;
    }
  };
});
define('pixy/mixins/routes/renderer',[ '../../config' ], function(Config) {
  /**
   * @class Mixins.Routes.Renderer
   *
   * Convenience mixin for mounting and unmounting components into layouts and
   * outlets automatically when a route is entered and exitted.
   *
   * ### Usage example
   *
   * Here's an example of an Index page that utilizes three outlets: content,
   * the toolbar, and the sidebar.
   *
   *     new Pixy.Route('transactionIndex', {
   *       views: [
   *         { component: Listing },
   *         { component: Sidebar, outlet: 'sidebar' },
   *         { component: Toolbar, outlet: 'toolbar' }
   *       ]
   *     })
   *
   * Here's another example of rendering into a different layout, say "dialogs":
   *
   *     new Pixy.Route('login', {
   *       views: [{ component: Dialog, into: 'dialogs' }]
   *     })
   */
  var RendererMixin = {
    mixinProps: {
      /**
       * @property {Object[]} views
       *           Your view listing.
       *
       * @property {React.Class} views.component (required)
       *           A renderable React component.
       *
       * @property {String} [views.into]
       *           Layout to mount the component in. If unspecified, the proper
       *           layout based on the authentication status will be used (guest
       *           or member).
       *
       * @property {String} [views.outlet="content"]
       *           Sugar for defining the "outlet" option for OutletLayouts.
       *
       * @property {Object} [views.options={}]
       *           Any custom options to pass to the layout.
       */
      views: [],

      /**
       * Manually mount a component.
       *
       * See Pixy.Mixins.LayoutManagerMixin#add for the parameters.
       */
      mount: function(component, layoutName, options) {
        this.trigger('render', component, layoutName, options);
      },

      /**
       * Unmount a previously-mounted component.
       *
       * See Pixy.Mixins.LayoutManagerMixin#remove for the parameters.
       */
      unmount: function(component, layoutName, options) {
        this.trigger('remove', component, layoutName, options);
      },

      shouldUnmount: function() {
        return true;
      }
    },

    /**
     * @internal Mount defined components.
     */
    enter: function() {
      var mount = this.mount.bind(this);
      var specs = this.views.reduce(function(specs, spec) {
        var layoutName = spec.into;
        var layoutOptions = spec.options || {};

        if (!spec.into) {
          // store the current layout name in the spec so we can properly
          // unmount from the same layout on #exit()
          layoutName = spec.into = Config.getCurrentLayoutName();

          console.assert(layoutName,
            "RendererMixin: you must specify a layout name using 'into' or" +
            " define Pixy.Config#getCurrentLayoutName().");
        }

        if (spec.outlet) {
          layoutOptions.outlet = spec.outlet;
          // again, store it for the same reason as above
          spec.options = layoutOptions;
        }

        return specs.concat({
          component: spec.component,
          layoutName: layoutName,
          options: layoutOptions
        });
      }, []);

      this.trigger('renderMany', specs);
    },

    /**
     * @internal Unmount components mounted in #enter().
     */
    exit: function() {
      var unmount;

      if (this.shouldUnmount()) {
        unmount = this.unmount.bind(this);

        this.views.forEach(function(spec) {
          unmount(spec.component, spec.into, spec.options);
        });
      }
    }
  };

  return RendererMixin;
});
define('pixy/mixins/routes/secondary_transitions',[ 'underscore' ], function(_) {
  

  var pluck = _.pluck;
  var slice = Array.prototype.slice;

  /**
   * @internal Returning undefined will not interrupt execution of route/mixins.
   */
  var RC_PASS;

  /**
   * @internal Returning true will.
   */
  var RC_INTERRUPT = true;

  /**
   * @internal Set of routes that have been guarded.
   *
   * Need to keep track of these so we can release at the right time, see notes
   * on #willTransition.
   */
  var guarded;

  /** @internal */
  function log(router) {
      }

  /** @internal */
  function isSecondary(route) {
    return route.isSecondary;
  }

  /** @internal */
  function isPrimary(route) {
    return !isSecondary(route);
  }

  /** @internal */
  function guard(route) {
    log(route, "transitioning to a secondary route, I won't re-load on next enter.");

    route._contextResolved = true;
    route._previousContext = route._context;
  }

  /** @internal */
  function isGuarded(route) {
    return route._contextResolved === true;
  }

  /**
   * @internal This method is re-entrant.
   */
  function release(route) {
    log(route, "releasing guards");

    route._contextResolved = route._context = route._previousContext = null;
  }

  /**
   * @class Mixins.Routes.SecondaryTransitions
   *
   * This mixin allows routes to be aware of "secondary" ones that should not
   * interrupt the life-cycle of the current, primary one.
   *
   * A route is considered secondary if it defines a "secondary" property
   * with a truthy value.
   *
   * The use case for this mixin is with dialog routes interrupting the
   * execution of the current base route. The expected behavior is that entering
   * a dialog route should not cause the base one to #exit(), and when the
   * dialog route exits, the base one should not need to restart its life-cycle
   * and re-resolve its models, etc.
   *
   * ### Gotchas
   *
   * The mixin has a few assumptions about your route that you should probably
   * be aware of (and adhere to:)
   *
   *  - your model resolution happens in #model()
   *  - your setup and teardown routines happen in #enter() and #exit()
   *    respectively
   *
   * ### Internals
   *
   * The mixin listens to the "willTransition" event, and checks the destination
   * route of the transition. If that's a secondary one, it will guard the
   * life-cycle hooks of the current route and all its parent up to the pivot
   * handler until the route is re-entered.
   *
   * Once re-entered, the mixin will release its guards and restore the route
   * to its normal behavior.
   *
   * The guards are released in the following situations:
   *
   *   - the route has transitioned to a secondary route, then was re-entered
   *   - the route has transitioned to a secondary route, which has transitioned
   *     to a different primary route
   *   - the route has transitioned to another primary route
   */
  return {

    /**
     * @private
     *
     * @return {Any} What-ever was returned in the last call to #model().
     */
    model: function() {
      if (isGuarded(this)) {
        log(this, "I'm considering myself already loaded.");
        return this._previousContext;
      }
    },

    /**
     * @private
     *
     * Cache the model resolved in #model(), because router.js discards the
     * context once the route is exited.
     */
    afterModel: function(model/*, transition*/) {
      if (isPrimary(this)) {
        this._context = model;
      }
    },

    /**
     * @private If guarded, interrupt this one call and then release the guards.
     */
    enter: function() {
      if (isGuarded(this)) {
        log(this, '\tblocking #enter');
        release(this);
        return RC_INTERRUPT;
      }
    },

    /**
     * @private
     */
    exit: function() {
      if (isGuarded(this)) {
        log(this, '\tblocking #exit');
        return RC_INTERRUPT;
      }
    },

    willTransition: function(transition) {
      var router = transition.router;
      var targetHandler = router.getHandler(transition.targetName);
      var pivotHandler = transition.pivotHandler;

      // we're transitioning to a secondary route (case #1) so install the
      // guard and keep a reference to the guarded routes so we can handle
      // case #2
      if (isSecondary(targetHandler) && isPrimary(this)) {
        guarded = pluck(router.currentHandlerInfos, 'handler');
        guarded.forEach(guard);

        return RC_PASS;
      }

      // reset if we're transitioning to a primary route other than the one
      // we had guarded
      if (guarded && isPrimary(targetHandler) && !isGuarded(targetHandler)) {
        guarded.forEach(release);
        guarded.forEach(function(route) {
          // Don't call exit() on the pivot handler, it should never be exited
          // unless the router switches off.
          if (route !== pivotHandler) {
            route.exit();
          }
        });
        guarded = undefined;
      }
    }
  };
});
define('pixy/mixins/routes/window_title',[ '../../config' ], function(Config) {
  var previousTitle;

  /**
   * @class Mixins.Routes.WindowTitle
   *
   * Set a custom document title while a route is active.
   *
   * @see Config.defaultWindowTitle
   *
   * ### Example usage
   *
   *     define('i18n!transactions/index', function(t) {
   *       new Pixy.Route('transactionsIndex', function() {
   *         windowTitle: function() {
   *           return t('windowTitle', 'Transactions - Pibi');
   *         }
   *       });
   *     });
   */
  return {
    mixinProps: {
      /**
       * @property {String|#call} [windowTitle]
       *
       * A string, or a function that returns a string to use as the document
       * title.
       *
       * You should probably i18nize the title in a function.
       *
       * @see Config.defaultWindowTitle
       */
      windowTitle: function() {
        return Config.getDefaultWindowTitle();
      }
    },

    enter: function() {
      var title = this.get('windowTitle');

      if (title) {
        previousTitle = document.title;
        document.title = title;
      }
    },

    exit: function() {
      if (previousTitle) {
        document.title = previousTitle;
        previousTitle = null;
      }
    }
  };
});
define('pixy/mixins/routes',[
  './routes/access_policy',
  './routes/loading',
  './routes/props',
  './routes/renderer',
  './routes/secondary_transitions',
  './routes/window_title',
], function(
  AccessPolicy,
  Loading,
  Props,
  Renderer,
  SecondaryTransitions,
  WindowTitle) {
  var exports = {};

  exports.AccessPolicy = AccessPolicy;
  exports.Loading = Loading;
  exports.Props = Props;
  exports.Renderer = Renderer;
  exports.SecondaryTransitions = SecondaryTransitions;
  exports.WindowTitle = WindowTitle;

  return exports;
});
define('pixy/mixins/react',['require','./react/layout_manager_mixin','./react/layout_mixin','./react/stacked_layout_mixin','./react/actor_mixin'],function(require) {
  var exports = {};

  exports.LayoutManagerMixin = require('./react/layout_manager_mixin');
  exports.LayoutMixin = require('./react/layout_mixin');
  exports.StackedLayoutMixin = require('./react/stacked_layout_mixin');
  exports.ActorMixin = require('./react/actor_mixin');

  return exports;
});
define('pixy/mixins/cacheable',['require','../core/cache'],function(require) {
  var Cache = require('../core/cache');

  /**
   * @class Pibi.Mixins.Cacheable
   *
   * Makes a Model or a Collection automatically cacheable to localStorage.
   */
  return {
    __initialize__: function() {
      if (!this.cache) {
        throw new Error("Cacheable resource must define a #cache property.");
      }

      Cache.makeCacheable(this);
    }
  };
});

define('pixy/mixins',['require','./mixins/routes','./mixins/react','./mixins/filterable_collection','./mixins/cacheable'],function(require) {
  var exports = {};

  exports.Routes = require('./mixins/routes');
  exports.React = require('./mixins/react');
  exports.FilterableCollection = require('./mixins/filterable_collection');
  exports.Cacheable = require('./mixins/cacheable');

  return exports;
});
define('pixy/main',['require','underscore','inflection','rsvp','./ext/react','./ext/jquery','router','./namespace','./object','./model','./deep_model','./collection','./core/router','./route','./store','./logging_context','./core/cache','./core/dispatcher','./mixins/filterable_collection','./mixins/logger','./mixins'],function(require) {
  var _ = require('underscore');
  var InflectionJS = require('inflection');
  var RSVP = require('rsvp');
  var React = require('./ext/react');
  var $ = require('./ext/jquery');
  var RouterJS = require('router');
  var Pixy = require('./namespace');
  var PixyObject = require('./object');
  var PixyModel = require('./model');
  var PixyDeepModel = require('./deep_model');
  var PixyCollection = require('./collection');
  var PixyRouter = require('./core/router');
  var PixyRoute = require('./route');
  var PixyStore = require('./store');
  var PixyLoggingContext = require('./logging_context');
  var PixyCache = require('./core/cache');
  var PixyDispatcher = require('./core/dispatcher');
  var FilterableCollection = require('./mixins/filterable_collection');
  var PixyLogger = require('./mixins/logger');
  var Mixins = require('./mixins');

  Pixy.Object = PixyObject;
  Pixy.Model = PixyModel;
  Pixy.DeepModel = PixyDeepModel;
  Pixy.Collection = PixyCollection;
  Pixy.Route = PixyRoute;
  Pixy.Store = PixyStore;
  Pixy.Logger = PixyLogger;
  Pixy.LoggingContext = PixyLoggingContext;

  // Singletons
  // Pixy.Mutator = PixyMutator;
  // Pixy.Registry = PixyRegistry;
  Pixy.Cache = PixyCache;
  Pixy.Dispatcher = PixyDispatcher;
  Pixy.ApplicationRouter = PixyRouter;

  // Pixy.Mutator.add(AttributeInheritanceMutation);
  // Pixy.Mutator.add(CachingMutation);
  // Pixy.Mutator.add(RegistrationMutation);

  Pixy.Mixins = Mixins;

  console.info("Pixy", Pixy.VERSION, "initialized.");

  Pixy.start = function() {
    return PixyRouter.start()
  };

  return Pixy;
});
define('pixy',["pixy/main"], function (Pixy) { return Pixy; });
