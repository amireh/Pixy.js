define([ '../../config', 'rsvp' ], function(Config, RSVP) {
  var RC_PASS = void 0;

  var logTransition = function(transition) {
    return [ transition.intent.url, transition.targetName ].join(' => ');
  };

  /**
   * @class Mixins.Routes.AccessPolicy
   *
   * @requires Config
   */
  return {
    mixinProps: {
      /**
       * @cfg {"public"|"private"} accessPolicy
       *
       * Set to "public" if you don't want this route to be visited by a user
       * that is logged-in.
       *
       * Set to "private" to restrict access to the route to logged-in users.
       *
       * Unset to skip the access policy checks, then routes can be visited
       * at any time.
       *
       * @see Config.defaultAccessPolicy
       */
      accessPolicy: Config.defaultAccessPolicy,

      isAccessible: function() {
        var isAuthenticated = Config.isAuthenticated();

        if (this.accessPolicy === 'public' && isAuthenticated) {
          return false;
        }
        else if (this.accessPolicy === 'private' && !isAuthenticated) {
          return false;
        }
        else {
          return true;
        }
      }
    },

    beforeModel: function(transition) {
      if (this.isAccessible()) {
        return RC_PASS;
      }
      else if (this.accessPolicy === 'public' ) {
        console.warn('Over-privileged access to:', logTransition(transition));
        return RSVP.reject('Overauthorized');
      }
      else {
        console.warn('Unprivileged access to:', logTransition(transition));
        return RSVP.reject('Unauthorized');
      }
    }
  };
});