define([
  'underscore',
  'jquery',
  './namespace',
  './events',
  './util/extend',
  './mixins/scheduler'
], function(_, $, Pixy, Events, extend, SchedulerMixin) {

  // Pixy.View
  // -------------
  var initializeMixins = function() {
    _.extend(this, SchedulerMixin);
    SchedulerMixin.__initialize__.apply(this, []);

    this.scheduleAction('render', this.delegateEvents, this, 'delegateEvents');
    // this.scheduleAction('render', this.delegateActions, this, 'delegateActions');
    // this.scheduleAction('remove', this.undelegateActions, this);

    _.each(this.__mixinInitializers__, function(initializer) {
      try {
        initializer.apply(this, []);
      } catch (e) {
        console.warn('Mixin failed to initialize:', e.stack);
      }
    }, this);
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
  var View = function() {
    Pixy.trigger('view:creating', this);

    this.cid = _.uniqueId('view');
    this._ensureElement();
    initializeMixins.apply(this, []);
    this.initialize.apply(this, arguments);

    Pixy.trigger('view:created', this);

    return this;
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'events'];

  // Set up all inheritable **Pixy.View** properties and methods.
  _.extend(View.prototype, Events, {
    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    queues: [ 'render', 'remove' ],
    inherits: [ 'options' ],

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Pixy.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
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
    }
  });

  View.extend = extend;
  Pixy.View = View;

  return View;
});