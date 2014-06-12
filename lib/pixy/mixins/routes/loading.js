define([], function() {
  var canTrigger = function(transition) {
    return !!transition.router.currentHandlerInfos;
  };

  /**
   * @class Mixins.Routes.Loading
   *
   * Trigger a "loading" event as soon as the route starts resolving its model,
   * and another once it's been resolved.
   *
   * You must define a "loading" event handler to make use of this. For example,
   * to show a progress indicator.
   */
  return {
    model: function(params, transition) {
      if (!canTrigger(transition) || !this.__model) {
        return;
      }

      this.trigger('loading', true);
      this._loading = true;
      console.info(this.name, 'Loading');
    },

    afterModel: function(/*model, transition*/) {
      if (!this._loading) {
        return;
      }

      console.info(this.name, 'Hiding loading status.');
      this._loading = false;
      this.trigger('loading', false);
    }
  };
});