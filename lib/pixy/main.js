/**
 * @class  Pixy
 *
 * Pibi.js Pixy extensions, hacks, and overrides.
 */
define([
  'underscore',
  'inflection',
  './packages/namespace',
  './packages/object',
  './packages/model',
  './packages/deep_model',
  './packages/collection',
  './packages/view',
  './packages/history',
  './packages/router',
  './packages/controller',
  './packages/logging_context',
  './packages/registry',
  './packages/cache',
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
  Pixy,
  PixyObject,
  PixyModel,
  PixyDeepModel,
  PixyCollection,
  PixyView,
  PixyHistory,
  PixyRouter,
  PixyController,
  PixyLoggingContext,
  PixyRegistry,
  PixyCache,
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
  Pixy.View = PixyView;
  Pixy.Router = PixyRouter;
  Pixy.Controller = PixyController;
  Pixy.Logger = PixyLogger;
  Pixy.LoggingContext = PixyLoggingContext;

  // Singletons
  //
  // Create the default Pixy.history.
  Pixy.history = PixyHistory;
  Pixy.Mutator = PixyMutator;
  Pixy.Registry = PixyRegistry;
  Pixy.Cache = PixyCache;

  Pixy.Mutator.add(AttributeInheritanceMutation);
  Pixy.Mutator.add(CachingMutation);
  Pixy.Mutator.add(RegistrationMutation);

  // Pixy.PluginManager.install(new CachePlugin(), {
  //   events: {
  //     Collection: {
  //       purgeOn: null
  //     }
  //   }
  // });

  // Pixy.PluginManager.install(new JournallingPlugin());

  console.info("Pixy", Pixy.VERSION, "initialized.");

  return Pixy;
});