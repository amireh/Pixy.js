/*!
 * jQuery serializeObject
 * http://github.com/macek/jquery-serialize-object
 *
 * Copyright 2013 Paul Macek <paulmacek@gmail.com>
 * Released under the BSD license
 */
define([ 'jquery' ], function($) {
  var FormSerializer = function FormSerializer(helper, options) {
    this.options   = options || {};
    this._helper    = helper;
    this._object    = {};
    this._pushes    = {};
    this._patterns  = {
      validate: /^[a-z][a-z0-9_]*(?:\[(?:\d*|[a-z0-9_]+)\])*$/i,
      key:      /[a-z0-9_]+|(?=\[\])/gi,
      push:     /^$/,
      fixed:    /^\d+$/,
      named:    /^[a-z0-9_]+$/i
    };
  };

  FormSerializer.prototype._convert = function _convert(value) {
    var v = value;

    if (this.options.convert) {
      if ($.isArray(v)) {
        v = _.map(v, function(value) {
          return this._convert(value);
        }, this);
      }
      else if ($.isNumeric(v) && !!Number(v)) {
        return parseFloat(v, 10);
      }
      else if (v === 'true') {
        return true;
      }
      else if (v === 'false') {
        return false;
      }
    }

    return v;
  };

  FormSerializer.prototype._build = function _build(base, key, value) {
    base[key] = value;

    return base;
  };

  FormSerializer.prototype._makeObject = function _nest(root, value) {

    var keys = root.match(this._patterns.key), k;

    // nest, nest, ..., nest
    while ((k = keys.pop()) !== undefined) {
      // foo[]
      if (this._patterns.push.test(k)) {
        var idx = this._incrementPush(root.replace(/\[\]$/, ''));
        value = this._build([], idx, this._convert(value));
      }

      // foo[n]
      else if (this._patterns.fixed.test(k)) {
        value = this._build([], k, this._convert(value));
      }

      // foo; foo[bar]
      else if (this._patterns.named.test(k)) {
        value = this._build({}, k, this._convert(value));
      }
    }

    return value;
  };

  FormSerializer.prototype._incrementPush = function _incrementPush(key) {
    if (this._pushes[key] === undefined) {
      this._pushes[key] = 0;
    }
    return this._pushes[key]++;
  };

  FormSerializer.prototype.addPair = function addPair(pair) {
    if (!this._patterns.validate.test(pair.name)) return this;
    var obj = this._makeObject(pair.name, pair.value);
    this._object = this._helper.extend(true, this._object, obj);
    return this;
  };

  FormSerializer.prototype.addPairs = function addPairs(pairs) {
    var that = this;

    if (!this._helper.isArray(pairs)) {
      throw new Error("formSerializer.addPairs expects an Array");
    }

    pairs.forEach(function(pair) {
      that.addPair(pair);
    });

    return this;
  };

  FormSerializer.prototype.serialize = function serialize() {
    return this._object || {};
  };

  FormSerializer.prototype.serializeJSON = function serializeJSON() {
    return JSON.stringify(this.serialize());
  };

  var Helper = function Helper(jQuery) {

    // jQuery.extend requirement
    if (typeof jQuery.extend === 'function') {
      this.extend = jQuery.extend;
    }
    else {
      throw new Error("jQuery is required to use jquery-serialize-object");
    }

    // Array.isArray polyfill
    if(typeof Array.isArray === 'function') {
      this.isArray = Array.isArray;
    }
    else {
      this.isArray = function isArray(input) {
        return Object.prototype.toString.call(input) === "[object Array]";
      };
    }

  };

  var helper = new Helper($ || {});

  return function(options) {
    var form = $(this);

    if (form.length > 1) {
      return new Error("jquery-serialize-object can only serialize one form at a time");
    }

    return new FormSerializer(helper, options).
      addPairs(form.serializeArray()).
      serialize();
  };
});