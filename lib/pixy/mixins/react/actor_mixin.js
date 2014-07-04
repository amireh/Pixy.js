define(function(require) {
  var Dispatcher = require('../../core/dispatcher');

  var ActorMixin = {
    getInitialState: function() {
      return {
        actionIndex: null
      };
    },

    getDefaultProps: function() {
      return {
        storeError: null
      };
    },

    componentDidUpdate: function() {
      var storeError = this.props.storeError;

      if (storeError && storeError.actionIndex === this.state.actionIndex) {
        if (this.onStoreError) {
          this.onStoreError(storeError);
        }
      }
    },

    trackAction: function(service) {
      this.setState({
        actionIndex: service.index
      });
    },

    sendAction: function(action, params) {
      var service = Dispatcher.dispatch(action, params, {
        source: 'VIEW_ACTION'
      });

      this.trackAction(service);

      return service.promise;
    }
  };

  return ActorMixin;
});