define(['pixy/util/wrap'], function(wrap) {
  describe('Util.wrap', function() {
    it('should wrap a method', function() {
      var x, y;
      var wrapped = function() { x = 5; };
      var wrapper = wrap(wrapped, function(callback) {
        callback();
        return y = 10;
      });

      wrapper();
      expect(x).toEqual(5);
      expect(y).toEqual(10);
    });

    it('should provide wrapped arguments to the wrapper', function() {
      var x, y;
      var wrapped = function(number) { x = 5 + number; };
      var wrapper = wrap(wrapped, function(callback, number) {
        callback(number);
        return y = 10 + number;
      });

      wrapper(5);
      expect(x).toEqual(10);
      expect(y).toEqual(15);
    });

    it('should provide a sink', function() {
      var x;
      var wrapper = wrap(null, function(callback) {
        callback();
        return x = 5;
      });

      expect(function() { wrapper(); }).not.toThrow();
      expect(x).toEqual(5);
    })
  });
});