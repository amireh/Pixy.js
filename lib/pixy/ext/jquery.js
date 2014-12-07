define([ 'jquery' ], function($) {
  'use strict';

  if ($.consume) {
    console.log('$.consume() is already defined, will not override the definition');
  }
  else {
    /**
     * Blocks an event from propagating or bubbling further.
     *
     * Example of *blocking a `click` event after handling it*:
     *
     *     $('#element').on('click', function(evt) {
     *       return $.consume(evt);
     *     });
     *
     * @param {Event} e The event to consume.
     * @return {Boolean} false
     */
    $.consume = function(e) {
      if (!e) {
        return;
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      e.cancelBubble = true;
      e.returnValue = false;

      return false;
    };
  }

  return $;
});