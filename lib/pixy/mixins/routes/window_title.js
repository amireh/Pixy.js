define([ '../../config' ], function(Config) {
  var previousTitle;

  /**
   * @class Mixins.Routes.WindowTitle
   *
   * Set a custom document title while a route is active.
   *
   * @see Config.defaultWindowTitle
   *
   * ### Example usage
   *
   *     define('i18n!transactions/index', function(t) {
   *       new Pixy.Route('transactionsIndex', function() {
   *         windowTitle: function() {
   *           return t('windowTitle', 'Transactions - Pibi');
   *         }
   *       });
   *     });
   */
  return {
    mixinProps: {
      /**
       * @property {String|#call} [windowTitle]
       *
       * A string, or a function that returns a string to use as the document
       * title.
       *
       * You should probably i18nize the title in a function.
       *
       * @see Config.defaultWindowTitle
       */
      windowTitle: function() {
        return Config.getDefaultWindowTitle();
      }
    },

    enter: function() {
      var title = this.get('windowTitle');

      if (title) {
        previousTitle = document.title;
        document.title = title;
      }
    },

    exit: function() {
      if (previousTitle) {
        document.title = previousTitle;
        previousTitle = null;
      }
    }
  };
});