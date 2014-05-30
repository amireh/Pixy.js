define([ 'router', 'when' ], function(Router, when) {
  xdescribe('Router.js', function() {
    it('should work', function() {
      var router = new Router['default']();
      var myHandlers = {};

      router.map(function(match) {
        match("/posts").to("postIndex");
        match("/posts/:id").to("showPost");
        match("/posts/new").to("newPost");
      });

      myHandlers.showPost = {
        model: function(params) {
          return App.Post.find(params.id);
        },

        setup: function(post) {
          // render a template with the post
        }
      };

      myHandlers.postIndex = {
        events: {
          error: function() {
            console.warn('Error raised while routing:', arguments);
          }
        },

        model: function(params) {
          console.debug('Success! Looking up the model for PostsIndex route.');
          return adooken;
          // return App.Post.findAll();
        },

        setup: function(posts) {
          // render a template with the posts
        }
      };

      myHandlers.newPost = {
        setup: function(post) {
          // render a template with the post
        }
      };

      router.getHandler = function(name) {
        return myHandlers[name];
      };

      router.handleURL('/posts');
    });
  });
});