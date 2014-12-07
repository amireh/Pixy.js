define(function(require) {
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
