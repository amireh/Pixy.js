define([ 'inflection' ], function() {
  return {
    getName: function(component) {
      return (component.displayName || component.type.displayName)
        .underscore()
        .camelize();
    }
  };
});