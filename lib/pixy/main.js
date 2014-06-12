define([
  'underscore',
  'inflection',
  'when',
  'rsvp',
  './ext/react',
  'router',
  './namespace',
  './object',
  './model',
  './deep_model',
  './collection',
  './core/router',
  './route',
  './store',
  './logging_context',
  './core/registry',
  './core/cache',
  './core/dispatcher',
  './core/mutator',
  './mutations/attribute_inheritance',
  './mutations/caching',
  './mutations/registration',
  './mixins/filterable_collection',
  './mixins/logger',
  './mixins'
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
  PixyRouter,
  PixyRoute,
  PixyStore,
  PixyLoggingContext,
  PixyRegistry,
  PixyCache,
  PixyDispatcher,
  PixyMutator,
  AttributeInheritanceMutation,
  CachingMutation,
  RegistrationMutation,
  PixyLogger,
  Mixins
  ) {

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