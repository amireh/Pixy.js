define(function(require) {
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
  var PixyRegistry = require('./core/registry');
  var PixyCache = require('./core/cache');
  var PixyDispatcher = require('./core/dispatcher');
  var PixyMutator = require('./core/mutator');
  var AttributeInheritanceMutation = require('./mutations/attribute_inheritance');
  var CachingMutation = require('./mutations/caching');
  var RegistrationMutation = require('./mutations/registration');
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
  Pixy.Mutator = PixyMutator;
  Pixy.Registry = PixyRegistry;
  Pixy.Cache = PixyCache;
  Pixy.Dispatcher = PixyDispatcher;
  Pixy.ApplicationRouter = PixyRouter;

  Pixy.Mutator.add(AttributeInheritanceMutation);
  Pixy.Mutator.add(CachingMutation);
  Pixy.Mutator.add(RegistrationMutation);

  Pixy.Mixins = Mixins;

  console.info("Pixy", Pixy.VERSION, "initialized.");

  Pixy.start = function() {
    return PixyRouter.start()
  };

  return Pixy;
});