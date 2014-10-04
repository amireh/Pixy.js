define([ 'inflection' ], function() {
  var Util = {
    getName: function(component) {
      return (component.displayName || Util.getStatic(component, 'displayName'))
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
    },

    getStatic: function(component, name) {
      if (component.originalSpec) { // react 0.11
        return component.originalSpec[name];
      }
      else if (component.constructor) { // react 0.11
        return component.constructor[name];
      }
      else if (component.type) { // react 0.10
        return component.type[name];
      }
      else if (component[name]) {
        return component[name];
      }
      else {
        console.warn(component);
        throw new Error("Unable to get a reference to #statics of component. See console.");
      }
    }
  };

  return Util;
});