define([
  './ext/underscore', // for _.defer
  './ext/jquery', // for $.consume and $.fn.serializeObject
  'when',
  './object',
  './mixins/scheduler'
], function(_, $, when, PixyObject, SchedulerMixin) {

  // Pixy.View
  // -------------

  var delegateAction = function(e) {
    var action;

    action = $(e.currentTarget).attr('data-action');
    action = ('on_' + action.underscore()).camelize(true);

    this.consume(e);

    if (!_.isFunction(this[action])) {
      throw new Error(this.toString() + ' has no action handler: ' + action);
    }

    return this[action].apply(this, arguments);
  };

  // Pixy Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Pixy.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  // var View = function() {
  //   Pixy.trigger('view:creating', this);

  //   this.cid = _.uniqueId('view');
  //   this._ensureElement();
  //   initializeMixins.apply(this, []);
  //   this.initialize.apply(this, arguments);

  //   Pixy.trigger('view:created', this);

  //   return this;
  // };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'events'];

  var View = PixyObject.extend(SchedulerMixin, {
    name: 'View',
    queues: [ 'render', 'remove' ],
    inherits: [ 'options' ],

    constructor: function() {
      PixyObject.call(this, 'view', function() {
        this.cid = _.uniqueId('view');
        this._ensureElement();

        this.scheduleAction('render', this.delegateEvents, this);
        this.scheduleAction('render', this.delegateActions, this);
        this.scheduleAction('remove', this.undelegateActions, this);
        this.scheduleAction('remove', this.undelegateEvents, this);
      }, arguments);
    },

    /**
     * @cfg {String} container
     * A DOM selector for an element to use as a parent for this view.
     * If you specify a container, the view will be automatically _appended_
     * to this element after rendering.
     *
     * See #attachToContainer() for more info.
     */
    container: null,

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    /**
     * Any resources that require loading or initializing should be done in
     * this method, as rendering will not happen until load returns true, or
     * a promise that fulfills.
     *
     * @return {Boolean|Promise}
     *         A signal that the view has the necessary data to render.
     */
    load: function() { return true; },

    /**
     * Stock rendering routine. Binds the event and action handlers, and if
     * a Handlebars template was found in `#template`, it will be rendered into
     * `this.$el` with the compound options.
     *
     * > **Note**
     * >
     * > When you override this, make sure you either call this method somewhere
     * > after you set the $el, or fulfill the promise manually yourself.
     *
     * @param  {Object} options
     *         Extra rendering options by the caller.
     *
     * @param  {Resolver} [resolver=null]
     *         A resolver for the rendering promise. You must call
     *         `resolver.resolve();` once you're done rendering, otherwise the
     *         Viewport will never know when the view is ready.
     *
     * @return {this}
     *         Doesn't matter what you return really.
     */
    render: function(options, resolver) {
      var templateData;
      var signalRendered;
      var customTemplateData = {};

      if (_.isFunction(this.template)) {
        templateData = {
          options: this.compoundOptions(options)
        };

        if (_.isFunction(this.templateData)) {
          customTemplateData = this.templateData(templateData.options);
        } else if (_.isObject(this.templateData)) {
          customTemplateData = this.templateData;
        }

        _.extend(templateData, customTemplateData);

        this.$el = $(this.template(templateData).trim());
      }

      if (resolver && _.isFunction(resolver.resolve)) {
        signalRendered = _.bind(resolver.resolve, resolver);
      }

      this.run('render', options).then(signalRendered);

      return this;
    },

    /**
     * Execute any post-rendering logic.
     */
    mount: function() {},

    /**
     * A convenience method for performing an atomic remove and then render.
     *
     * @param  {Object} options
     *         Will be forwarded to #render().
     */
    reload: function(options) {
      var that = this;
      var $container;

      this.debug('Reloading ASAP.');

      // A removal job in progress?
      if (this._removing) {
        this.warn('Will not reload just yet; a removal job is in progress.');

        // Queue a rendering job after the current removal job is done
        return this._removing.ensure(function() {
          return that._render(options);
        });
      }
      // A rendering job in progress?
      else if (this._rendering) {
        this.warn('Will not reload just yet; a rendering job is in progress.');

        // Queue a reloading job after the current render job is done
        return this._rendering.ensure(function() {
          return that.reload(options);
        });
      }
      // Good to reload:
      else {
        $container = this.$el.parent();
        // Queue a removal job followed by a rendering one
        return this._remove().then(function() {
          return that._render(options).then(function(rc) {
            // Re-attach to the previous parent.
            that.$el.appendTo($container);
            return rc;
          });
        });
      }
    },

    /**
     * Execute any pre-removal logic.
     */
    unmount: function() {},

    /**
     * Remove the view and clean up any resources it had allocated.
     *
     * This takes care of removing the element from DOM, unbinding all event and
     * action handlers, as well as clearing any FormErrors attached to the view.
     *
     * @param  {Resolver} [resolver=null]
     *         The promise resolver for the removal process which will be
     *         resolved once the view is completely removed.
     *
     * @return {Promise}
     *         Of the view being removed.
     *
     * @warning
     *   If you override this, you must resolve the deferred object, if one is
     *   passed, once you're done removing by calling `resolver.resolve();`,
     *   or just call the super method to let it take care of things.
     *
     * **Example**
     *
     *     Backbone.View.extend({
     *       remove: function(deferred) {
     *         // your clean-up logic here
     *         // ...
     *         return Backbone.View.prototype.apply(this, arguments);
     *       }
     *     });
     */
    remove: function(resolver) {
      var signalRemoved;

      this.$el.remove();
      this.stopListening();

      if (resolver && _.isFunction(resolver.resolve)) {
        signalRemoved = _.bind(resolver.resolve, resolver);
      }

      return this.run('remove').then(signalRemoved);
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) {
        this.undelegateEvents();
      }

      this.$el = element instanceof $ ? element : $(element);
      this.el = this.$el[0];

      if (delegate !== false) {
        this.delegateEvents();
      }

      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      events = _.result(this, 'events');

      if (!events) {
        return this;
      }

      this.undelegateEvents();

      for (var key in events) {
        var method = events[key];

        if (!_.isFunction(method)) {
          method = this[events[key]];
        }

        if (!method) {
          continue;
        }

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Pixy views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    /**
     * Bind [data-action] elements to defined handlers.
     *
     * The handler is expected to be named as the camelCased version of the
     * action prefixed by on, examples:
     *
     *    - <button data-action="save" /> => onSave
     *    - <button data-action="sendReport" /> => onSendReport
     *
     */
    delegateActions: function() {
      this.undelegateActions();
      this.$el.on(this.$exclusive('click'), '[data-action]',
        _.bind(delegateAction, this));

      return this;
    },

    /**
     * Unbind action handlers.
     */
    undelegateActions: function() {
      this.$el.off(this.$exclusive('click'), '[data-action]');

      return this;
    },

    consume: function(e) {
      if ($.consume) {
        return $.consume(e);
      }

      return false;
    },

    toString: function() {
      return [ this.name, this.id || this.cid ].join('#');
    },

    /** Alias for serialize() */
    toJSON: function() {
      return this.serialize();
    },

    /**
     * Converts the view's form to a JSON object.
     *
     * The form locator works like this:
     *   - uses the view's element itself if it's a <form />
     *   - uses any child form
     *   - uses the closest enclosing form
     *
     * @return {Object}
     */
    serialize: function() {
      var $form;

      if (this.$el.is('form')) {
        $form = this.$el;
      } else {
        $form = this.$('form');

        if (!$form.length) {
          $form = this.$el.closest('form');
        }
      }

      return $form.serializeObject();
    },

    /**
     * A nice set of the View's current options mixed in with extra option
     * overrides specified at call-time.
     *
     * @param  {Object} [extraOptions={}]
     *         Option overrides.
     *
     * @return {Object}
     *         The composite set of options.
     */
    compoundOptions: function(extraOptions) {
      return _.extend({}, _.result(this, 'options', this), extraOptions);
    },

    /**
     * @protected
     * @param  {String} event
     *         A DOM event.
     *
     * @return {String}
     *         A jQuery-compatible namespaced event name that will be exclusive
     *         to this view during its lifetime.
     *
     * Example:
     *
     *     var myView;
     *
     *     myView = new Backbone.View();
     *     myView.cid; // => view1
     *     myView.$exclusive('click'); // => 'click.view1'
     *
     *     // binding handlers:
     *     $('body').on(myView.$exclusive('click'), function(e) {
     *       // ...
     *     });
     *
     *     // and later on, we can safely undelegate:
     *     $('body').off(myView.$exclusive('click'));
     */
    $exclusive: function(event) {
      return event + '.' + this.cid;
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(e.g. model, collection, id, className)* are
    // attached directly to the view.  See `viewOptions` for an exhaustive
    // list.
    _configure: function(options) {
      if (this.options) {
        options = _.extend({}, _.result(this, 'options'), options);
      }

      _.extend(this, _.pick(options, viewOptions));

      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      var $el = _.result(this, 'el') || this.$el || $('<div/>');
      this.setElement($el, false);
    },
/**
     * Dispatch a rendering request, and attach the view to its container after
     * it has been rendered - if viable.
     *
     * @param {Object} [options={}]
     *        Rendering options to pass to #render().
     *
     * @async
     * @return {Promise} Of the view being rendered.
     */
    _render: function(options) {
      var deferred = when.defer();
      var that = this;

      if (this._rendering) {
        this.warn('Rejecting request to render; currently busy.');
        return this._rendering;
      }

      this._rendering = deferred.promise;
      this._renderer = deferred;

      deferred.promise.ensure(function() {
        that._rendering = null;
        that._renderer = null;
        that._rendered = true;
      });

      // Once rendered, attach to a container, if any.
      if (this.container) {
        deferred.promise.then(function() {
          return that._attachToContainer();
        });
      }

      // Once rendered, execute any mounting logic.
      deferred.promise.then(function() {
        return that.mount(options);
      }).otherwise(function(error) {
        that.error('Mounting failed:', error.stack, arguments);
        deferred.reject(error);
      });

      when(that.load()).then(function() {
        return that.render(options, deferred.resolver);
      }).otherwise(function(error) {
        that.error('Rendering failed:', error.stack, arguments);
        deferred.reject(error);
      });

      this.info("rendering...");

      return deferred.promise;
    },

    isRendered: function() {
      return this._rendered;
    },

    /**
     * Dispatch a removal request.
     * @async
     *
     * @return {Promise} Of the view being removed.
     */
    _remove: function(_deferred) {
      var deferred = _deferred || when.defer();
      var that = this;

      if (this._removing) {
        this.warn('Rejecting request to remove; currently busy.');
        return this._removing;
      }
      else if (this._rendering) {
        this.warn('Instructed to remove while a render is in progress: removal might go hairy.');
        this._rendering.done(function() {
          that.info('\tRendering is complete, now requesting a removal.');
          return that._remove(deferred);
        });

        return deferred.promise;
      }

      this._removing = deferred.promise;

      deferred.promise.ensure(function() {
        that._removing = false;
        that._rendered = false;
      });

      this.unmount();

      _.defer(function() {
        this.remove(deferred.resolver);
      }, this);

      return deferred.promise;
    },

    /**
     * Attach this view to the configured container.
     *
     * @protected
     */
    _attachToContainer: function() {
      var $container;

      if (this.container) {
        if (this.$el) {
          // this.debug('Attaching to DOM node:', this.container);
          $container = $(this.container);
          $container.append(this.$el);
        }
      }
    }
  });

  return View;
});
