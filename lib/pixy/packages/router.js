define([ 'router', 'jquery', 'rsvp', './history' ],
function(RouterJS, $, RSVP, locationBar) {
  var replaceState;
  var consume = $.consume;
  var history = window.history;

  /**
   * @class Pixy.ApplicationRouter
   * @singleton
   *
   * A router.js singleton that manages routing throughout a Pixy app.
   */
  var router;

  /**
   * @internal
   * Normalize a route by adding a leading slash if necessary.
   */
  function normalize(url) {
    url = String(url || '');

    if (url[0] !== '/') {
      url = '/' + url;
    }

    return url;
  }

  /**
   * @internal
   */
  function transitionTo(url) {
    return router.transitionTo(normalize(url));
  }

  /**
   * @internal
   */
  function interceptLink(e) {
    var consumed = consume(e);

    transitionTo($(e.currentTarget).attr('href'));

    return consumed;
  }

  router = new RouterJS['default']();

  router.updateURL = function(url) {
    console.info('History URL has changed to:', url);

    this.navigate(url, {
      silent: true,
      trigger: false,
      replace: replaceState
    });

    replaceState = false;
  }.bind(locationBar);

  /**
   * Start the routing engine.
   *
   * @param {Object} options
   *
   * @param {String} [options.root="/"]
   *        Root URL to route from.
   *
   * @param {Boolean} [options.pushState=false]
   *        Whether to use pushState or hash-based routing.
   *
   * @param {Boolean} [options.preload=false]
   *        When true, the router will automatically fire the current route
   *        once the engine has been started.
   *
   * @param {String} [options.locale=null]
   *        If present, the URL root will be prefixed by the locale you specify.
   *        For example, pass in "en" to make the root at "/en/".
   *
   * @return {RSVP.Promise}
   */
  router.start = function(options) {
    var root;
    var initialRoute;

    options = options || {};

    root = options.root || '/';

    if (options.locale) {
      root += options.locale;
    }

    // Location changes via the back/forward browser buttons
    locationBar.onHashChange = function(url) {
      console.debug('Hash/URL changed:', normalize(url));
      replaceState = true;
      this.transitionTo(url);
    }.bind(this);

    // Start the history tracker
    locationBar.start({
      pushState: options.pushState,
      root: root,
      silent: true
    });

    // Route all non-external links
    $(document).on('click.appRouter', 'a[href^="/"][target!=_blank]', interceptLink);

    if (!options.preload) {
      return RSVP.resolve();
    }

    initialRoute = locationBar.fragment;

    return transitionTo(initialRoute).then(function() {
      // Restore the search query parameters, if there were any:
      if (options.pushState && history.pushState) {
        history.replaceState({}, document.title, root + initialRoute);
      }
    }.bind(this));
  };

  /**
   * Stop the routing engine. Visiting local links will no longer do anything.
   */
  router.stop = function() {
    $(document).off('click.appRouter');
    locationBar.onHashChange = null;
    locationBar.stop();
  };

  return router;
});
