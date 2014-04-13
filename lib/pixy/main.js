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
  './packages/router',
  './packages/history',
  './packages/controller',
  './packages/registry',
  './packages/cache',
  './packages/mutator',
  './packages/mutations/attribute_inheritance',
  './packages/mutations/caching'
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
  PixyRouter,
  PixyHistory,
  PixyController,
  PixyRegistry,
  PixyCache,
  PixyMutator,
  PixyAttributeInheritanceMutation,
  PixyCachingMutation
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

  Pixy.Mutator.add(PixyAttributeInheritanceMutation);
  Pixy.Mutator.add(PixyCachingMutation);

  // Pixy.PluginManager.install(new CachePlugin(), {
  //   events: {
  //     Collection: {
  //       purgeOn: null
  //     }
  //   }
  // });

  // Pixy.PluginManager.install(new JournallingPlugin());

  return Pixy;
});