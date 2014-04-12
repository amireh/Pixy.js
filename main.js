/**
 * @class  Pixy
 *
 * Pibi.js Pixy extensions, hacks, and overrides.
 */
define([
  'underscore',
  './packages/namespace',
  './packages/object',
  './packages/model',
  './packages/deep_model',
  './packages/collection',
  './packages/view',
  './packages/router',
  './packages/history',
  './packages/controller',
  // './packages/sync',
  // './packages/plugin_manager',
  // './packages/plugins/registry',
  // './packages/plugins/cache',
  // './packages/plugins/inherits',
  // './packages/plugins/logger',
  // './packages/plugins/journalling'
],
function(
  _,
  Pixy,
  PixyObject,
  PixyModel,
  PixyDeepModel,
  PixyCollection,
  PixyView,
  PixyRouter,
  PixyHistory,
  PixyController
  // PixySync,
  // PluginManager,
  // RegistryPlugin,
  // CachePlugin,
  // InheritsPlugin,
  // LoggerPlugin,
  // JournallingPlugin
  ) {

  console.debug(Pixy)

  Pixy.Object = PixyObject;
  Pixy.Model = PixyModel;
  Pixy.DeepModel = PixyDeepModel;
  Pixy.Collection = PixyCollection;
  Pixy.View = PixyView;
  Pixy.Router = PixyRouter;
  Pixy.Controller = PixyController;

  // Install the Pixy plugins we'll be using.
  // Pixy.PluginManager = new PluginManager();
  // Pixy.PluginManager.install(new LoggerPlugin());

  // _.extend(Pixy.Object.prototype,     Pixy.Logger);
  // _.extend(Pixy.Model.prototype,      Pixy.Logger);
  // _.extend(Pixy.Collection.prototype, Pixy.Logger);
  // _.extend(Pixy.View.prototype,       Pixy.Logger);
  // _.extend(Pixy.Router.prototype,     Pixy.Logger);

  // Pixy.PluginManager.install(new InheritsPlugin());
  // Pixy.PluginManager.install(new RegistryPlugin());
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