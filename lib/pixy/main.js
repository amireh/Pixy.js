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
  './packages/registry',
  './packages/cache',
  './packages/mutator',
  './packages/mutations/attribute_inheritance',
  './packages/mutations/caching',
  './packages/mutations/registration',
  './packages/mixins/filterable_collection'
],
function(
  _,
  InflectionJS,
  Pixy,
  PObject,
  PixyModel,
  PixyDeepModel,
  PixyCollection,
  PixyView,
  PixyHistory,
  PixyRouter,
  PixyController,
  PixyRegistry,
  PixyCache,
  PixyMutator,
  AttributeInheritanceMutation,
  CachingMutation,
  RegistrationMutation
  ) {

  Pixy.Object = PObject;
  Pixy.Model = PixyModel;
  Pixy.DeepModel = PixyDeepModel;
  Pixy.Collection = PixyCollection;
  Pixy.View = PixyView;
  Pixy.Router = PixyRouter;
  Pixy.Controller = PixyController;

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