define([
  'underscore',
  'inflection',
  'when',
  'rsvp',
  'react',
  'router',
  './packages/namespace',
  './packages/object',
  './packages/model',
  './packages/deep_model',
  './packages/collection',
  './packages/router',
  './packages/route',
  './packages/store',
  './packages/logging_context',
  './packages/registry',
  './packages/cache',
  './packages/dispatcher',
  './packages/mutator',
  './packages/mutations/attribute_inheritance',
  './packages/mutations/caching',
  './packages/mutations/registration',
  './packages/mixins/filterable_collection',
  './packages/mixins/logger'
],
function(
  _,
  InflectionJS,
  when,
  RSVP,
  React,
  RouterJS,
  Pixy,
  PixyObject,
  PixyModel,
  PixyDeepModel,
  PixyCollection,
  // PixyView,
  // PixyHistory,
  PixyRouter,
  PixyRoute,
  // PixyController,
  PixyStore,
  PixyLoggingContext,
  // PixyViewport,
  PixyRegistry,
  PixyCache,
  PixyDispatcher,
  PixyMutator,
  AttributeInheritanceMutation,
  CachingMutation,
  RegistrationMutation,
  PixyLogger
  ) {

  Pixy.Object = PixyObject;
  Pixy.Model = PixyModel;
  Pixy.DeepModel = PixyDeepModel;
  Pixy.Collection = PixyCollection;
  // Pixy.View = PixyView;
  Pixy.Route = PixyRoute;
  Pixy.Store = PixyStore;
  Pixy.Logger = PixyLogger;
  Pixy.LoggingContext = PixyLoggingContext;

  // Singletons
  //
  // Create the default Pixy.history.
  // Pixy.history = PixyHistory;
  // Pixy.Viewport = PixyViewport;
  Pixy.Mutator = PixyMutator;
  Pixy.Registry = PixyRegistry;
  Pixy.Cache = PixyCache;
  Pixy.Dispatcher = PixyDispatcher;
  Pixy.ApplicationRouter = PixyRouter;

  Pixy.Mutator.add(AttributeInheritanceMutation);
  Pixy.Mutator.add(CachingMutation);
  Pixy.Mutator.add(RegistrationMutation);

  // Pixy.Registry.checkObject(Pixy.Viewport);

  // Pixy.PluginManager.install(new CachePlugin(), {
  //   events: {
  //     Collection: {
  //       purgeOn: null
  //     }
  //   }
  // });

  // Pixy.PluginManager.install(new JournallingPlugin());

  console.info("Pixy", Pixy.VERSION, "initialized.");

  Pixy.start = function() {
    return PixyRouter.start()
  };

  return Pixy;
});