define([ 'inflection' ], function() {
  return {
    getName: function(component) {
      return (component.displayName || component.type.displayName)
        .underscore()
        .camelize();
    },

    render: function(type, initialProps, dontTransferProps) {
      if (!type) {
        return false;
      }
      else if (!type.call) {
        return type;
      }
      else {
        return dontTransferProps ?
          type(initialProps) :
          this.transferPropsTo(type(initialProps));
      }
    }
  };
});