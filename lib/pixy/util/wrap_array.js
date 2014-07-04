define(function() {
  return function wrapArray(array) {
    return Array.isArray(array) ? array : [ array ];
  }
});