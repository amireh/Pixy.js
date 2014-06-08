define([ 'underscore' ], function(_) {
  var CONTEXT = 'log';
  var Logger = {
    log: function() {
      if (this.options && this.options.mute) {
        return;
      }

      var params;
      var loggerId = this.toString();

      params = _.flatten(arguments || []);
      params.unshift('[' + loggerId + ']: ');

      //>>excludeStart("production", pragmas.production);
      if (navigator.userAgent.indexOf("Chrome") > -1) {
        var err = new Error();
        var fileTokens = String(err.stack).split('\n')[3].trim();

        params.push('(at ' + fileTokens.match(/(http[^\)]+)/)[0] + ')');
      }
      //>>excludeEnd("production");

      return console[CONTEXT].apply(console, params);
    },

    mute: function() {
      this.__log  = this.log;
      this.log    = function() {};
    },

    unmute: function() {
      this.log    = this.__log;
      this.__log  = null;
    },
  };

  _.each([ 'debug', 'info', 'warn', 'error' ], function(logContext) {
    Logger[logContext] = function() {
      var out;
      CONTEXT = logContext;
      out = this.log.apply(this, arguments);
      CONTEXT = 'log';
      return out;
    };
  });

  return Logger;
});