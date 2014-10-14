/**
  @class RSVP
  @module RSVP
  */
define('rsvp/all', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.all`.

      @method all
      @static
      @for RSVP
      @param {Array} array Array of promises.
      @param {String} label An optional label. This is useful
      for tooling.
    */
    __exports__['default'] = function all(array, label) {
        return Promise.all(array, label);
    };
});
define('rsvp/all_settled', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    
    var Promise = __dependency1__['default'];
    var isArray = __dependency2__.isArray;
    var isNonThenable = __dependency2__.isNonThenable;
    /**
      `RSVP.allSettled` is similar to `RSVP.all`, but instead of implementing
      a fail-fast method, it waits until all the promises have returned and
      shows you all the results. This is useful if you want to handle multiple
      promises' failure states together as a set.

      Returns a promise that is fulfilled when all the given promises have been
      settled. The return promise is fulfilled with an array of the states of
      the promises passed into the `promises` array argument.

      Each state object will either indicate fulfillment or rejection, and
      provide the corresponding value or reason. The states will take one of
      the following formats:

      ```javascript
      { state: 'fulfilled', value: value }
        or
      { state: 'rejected', reason: reason }
      ```

      Example:

      ```javascript
      var promise1 = RSVP.Promise.resolve(1);
      var promise2 = RSVP.Promise.reject(new Error('2'));
      var promise3 = RSVP.Promise.reject(new Error('3'));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.allSettled(promises).then(function(array){
        // array == [
        //   { state: 'fulfilled', value: 1 },
        //   { state: 'rejected', reason: Error },
        //   { state: 'rejected', reason: Error }
        // ]
        // Note that for the second item, reason.message will be "2", and for the
        // third item, reason.message will be "3".
      }, function(error) {
        // Not run. (This block would only be called if allSettled had failed,
        // for instance if passed an incorrect argument type.)
      });
      ```

      @method allSettled
      @static
      @for RSVP
      @param {Array} promises
      @param {String} label - optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled with an array of the settled
      states of the constituent promises.
    */
    __exports__['default'] = function allSettled(entries, label) {
        return new Promise(function (resolve, reject) {
            if (!isArray(entries)) {
                throw new TypeError('You must pass an array to allSettled.');
            }
            var remaining = entries.length;
            var entry;
            if (remaining === 0) {
                resolve([]);
                return;
            }
            var results = new Array(remaining);
            function fulfilledResolver(index) {
                return function (value) {
                    resolveAll(index, fulfilled(value));
                };
            }
            function rejectedResolver(index) {
                return function (reason) {
                    resolveAll(index, rejected(reason));
                };
            }
            function resolveAll(index, value) {
                results[index] = value;
                if (--remaining === 0) {
                    resolve(results);
                }
            }
            for (var index = 0; index < entries.length; index++) {
                entry = entries[index];
                if (isNonThenable(entry)) {
                    resolveAll(index, fulfilled(entry));
                } else {
                    Promise.resolve(entry).then(fulfilledResolver(index), rejectedResolver(index));
                }
            }
        }, label);
    };
    function fulfilled(value) {
        return {
            state: 'fulfilled',
            value: value
        };
    }
    function rejected(reason) {
        return {
            state: 'rejected',
            reason: reason
        };
    }
});
define('rsvp/asap', ['exports'], function (__exports__) {
    
    __exports__['default'] = function asap(callback, arg) {
        var length = queue.push([
                callback,
                arg
            ]);
        if (length === 1) {
            // If length is 1, that means that we need to schedule an async flush.
            // If additional callbacks are queued before the queue is flushed, they
            // will be processed by this flush that we are scheduling.
            scheduleFlush();
        }
    };
    var browserGlobal = typeof window !== 'undefined' ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    // node
    function useNextTick() {
        return function () {
            process.nextTick(flush);
        };
    }
    function useMutationObserver() {
        var iterations = 0;
        var observer = new BrowserMutationObserver(flush);
        var node = document.createTextNode('');
        observer.observe(node, { characterData: true });
        return function () {
            node.data = iterations = ++iterations % 2;
        };
    }
    function useSetTimeout() {
        return function () {
            setTimeout(flush, 1);
        };
    }
    var queue = [];
    function flush() {
        for (var i = 0; i < queue.length; i++) {
            var tuple = queue[i];
            var callback = tuple[0], arg = tuple[1];
            callback(arg);
        }
        queue = [];
    }
    var scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
        scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
        scheduleFlush = useMutationObserver();
    } else {
        scheduleFlush = useSetTimeout();
    }
});
define('rsvp/config', [
    './events',
    'exports'
], function (__dependency1__, __exports__) {
    
    var EventTarget = __dependency1__['default'];
    var config = { instrument: false };
    EventTarget.mixin(config);
    function configure(name, value) {
        if (name === 'onerror') {
            // handle for legacy users that expect the actual
            // error to be passed to their function added via
            // `RSVP.configure('onerror', someFunctionHere);`
            config.on('error', value);
            return;
        }
        if (arguments.length === 2) {
            config[name] = value;
        } else {
            return config[name];
        }
    }
    __exports__.config = config;
    __exports__.configure = configure;
});
define('rsvp/defer', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    
    var Promise = __dependency1__['default'];
    /**
      `RSVP.defer` returns an object similar to jQuery's `$.Deferred`.
      `RSVP.defer` should be used when porting over code reliant on `$.Deferred`'s
      interface. New code should use the `RSVP.Promise` constructor instead.

      The object returned from `RSVP.defer` is a plain object with three properties:

      * promise - an `RSVP.Promise`.
      * reject - a function that causes the `promise` property on this object to
        become rejected
      * resolve - a function that causes the `promise` property on this object to
        become fulfilled.

      Example:

       ```javascript
       var deferred = RSVP.defer();

       deferred.resolve("Success!");

       defered.promise.then(function(value){
         // value here is "Success!"
       });
       ```

      @method defer
      @static
      @for RSVP
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Object}
     */
    __exports__['default'] = function defer(label) {
        var deferred = {};
        deferred.promise = new Promise(function (resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        }, label);
        return deferred;
    };
});
define('rsvp/events', ['exports'], function (__exports__) {
    
    var indexOf = function (callbacks, callback) {
        for (var i = 0, l = callbacks.length; i < l; i++) {
            if (callbacks[i] === callback) {
                return i;
            }
        }
        return -1;
    };
    var callbacksFor = function (object) {
        var callbacks = object._promiseCallbacks;
        if (!callbacks) {
            callbacks = object._promiseCallbacks = {};
        }
        return callbacks;
    };
    /**
      @class RSVP.EventTarget
    */
    __exports__['default'] = {
        mixin: function (object) {
            object.on = this.on;
            object.off = this.off;
            object.trigger = this.trigger;
            object._promiseCallbacks = undefined;
            return object;
        },
        on: function (eventName, callback) {
            var allCallbacks = callbacksFor(this), callbacks;
            callbacks = allCallbacks[eventName];
            if (!callbacks) {
                callbacks = allCallbacks[eventName] = [];
            }
            if (indexOf(callbacks, callback) === -1) {
                callbacks.push(callback);
            }
        },
        off: function (eventName, callback) {
            var allCallbacks = callbacksFor(this), callbacks, index;
            if (!callback) {
                allCallbacks[eventName] = [];
                return;
            }
            callbacks = allCallbacks[eventName];
            index = indexOf(callbacks, callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        },
        trigger: function (eventName, options) {
            var allCallbacks = callbacksFor(this), callbacks, callbackTuple, callback, binding;
            if (callbacks = allCallbacks[eventName]) {
                // Don't cache the callbacks.length since it may grow
                for (var i = 0; i < callbacks.length; i++) {
                    callback = callbacks[i];
                    callback(options);
                }
            }
        }
    };
});
define('rsvp/filter', [
    './all',
    './map',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var all = __dependency1__['default'];
    var map = __dependency2__['default'];
    var isFunction = __dependency3__.isFunction;
    var isArray = __dependency3__.isArray;
    /**
     `RSVP.filter` is similar to JavaScript's native `filter` method, except that it
      waits for all promises to become fulfilled before running the `filterFn` on
      each item in given to `promises`. `RSVP.filter` returns a promise that will
      become fulfilled with the result of running `filterFn` on the values the
      promises become fulfilled with.

      For example:

      ```javascript

      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);

      var filterFn = function(item){
        return item > 1;
      };

      RSVP.filter(promises, filterFn).then(function(result){
        // result is [ 2, 3 ]
      });
      ```

      If any of the `promises` given to `RSVP.filter` are rejected, the first promise
      that is rejected will be given as an argument to the returned promise's
      rejection handler. For example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      var filterFn = function(item){
        return item > 1;
      };

      RSVP.filter(promises, filterFn).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "2"
      });
      ```

      `RSVP.filter` will also wait for any promises returned from `filterFn`.
      For instance, you may want to fetch a list of users then return a subset
      of those users based on some asynchronous operation:

      ```javascript

      var alice = { name: 'alice' };
      var bob   = { name: 'bob' };
      var users = [ alice, bob ];

      var promises = users.map(function(user){
        return RSVP.resolve(user);
      });

      var filterFn = function(user){
        // Here, Alice has permissions to create a blog post, but Bob does not.
        return getPrivilegesForUser(user).then(function(privs){
          return privs.can_create_blog_post === true;
        });
      };
      RSVP.filter(promises, filterFn).then(function(users){
        // true, because the server told us only Alice can create a blog post.
        users.length === 1;
        // false, because Alice is the only user present in `users`
        users[0] === bob;
      });
      ```

      @method filter
      @static
      @for RSVP
      @param {Array} promises
      @param {Function} filterFn - function to be called on each resolved value to
      filter the final results.
      @param {String} label optional string describing the promise. Useful for
      tooling.
      @return {Promise}
    */
    function filter(promises, filterFn, label) {
        return all(promises, label).then(function (values) {
            if (!isArray(promises)) {
                throw new TypeError('You must pass an array to filter.');
            }
            if (!isFunction(filterFn)) {
                throw new TypeError('You must pass a function to filter\'s second argument.');
            }
            return map(promises, filterFn, label).then(function (filterResults) {
                var i, valuesLen = values.length, filtered = [];
                for (i = 0; i < valuesLen; i++) {
                    if (filterResults[i])
                        filtered.push(values[i]);
                }
                return filtered;
            });
        });
    }
    __exports__['default'] = filter;
});
define('rsvp/hash', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    
    var Promise = __dependency1__['default'];
    var isNonThenable = __dependency2__.isNonThenable;
    var keysOf = __dependency2__.keysOf;
    /**
      `RSVP.hash` is similar to `RSVP.all`, but takes an object instead of an array
      for its `promises` argument.

      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The returned promise
      is fulfilled with a hash that has the same key names as the `promises` object
      argument. If any of the values in the object are not promises, they will
      simply be copied over to the fulfilled object.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.resolve(1),
        yourPromise: RSVP.resolve(2),
        theirPromise: RSVP.resolve(3),
        notAPromise: 4
      };

      RSVP.hash(promises).then(function(hash){
        // hash here is an object that looks like:
        // {
        //   myPromise: 1,
        //   yourPromise: 2,
        //   theirPromise: 3,
        //   notAPromise: 4
        // }
      });
      ````

      If any of the `promises` given to `RSVP.hash` are rejected, the first promise
      that is rejected will be given as the reason to the rejection handler.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.resolve(1),
        rejectedPromise: RSVP.reject(new Error("rejectedPromise")),
        anotherRejectedPromise: RSVP.reject(new Error("anotherRejectedPromise")),
      };

      RSVP.hash(promises).then(function(hash){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "rejectedPromise"
      });
      ```

      An important note: `RSVP.hash` is intended for plain JavaScript objects that
      are just a set of keys and values. `RSVP.hash` will NOT preserve prototype
      chains.

      Example:

      ```javascript
      function MyConstructor(){
        this.example = RSVP.resolve("Example");
      }

      MyConstructor.prototype = {
        protoProperty: RSVP.resolve("Proto Property")
      };

      var myObject = new MyConstructor();

      RSVP.hash(myObject).then(function(hash){
        // protoProperty will not be present, instead you will just have an
        // object that looks like:
        // {
        //   example: "Example"
        // }
        //
        // hash.hasOwnProperty('protoProperty'); // false
        // 'undefined' === typeof hash.protoProperty
      });
      ```

      @method hash
      @static
      @for RSVP
      @param {Object} promises
      @param {String} label optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when all properties of `promises`
      have been fulfilled, or rejected if any of them become rejected.
    */
    __exports__['default'] = function hash(object, label) {
        return new Promise(function (resolve, reject) {
            var results = {};
            var keys = keysOf(object);
            var remaining = keys.length;
            var entry, property;
            if (remaining === 0) {
                resolve(results);
                return;
            }
            function fulfilledTo(property) {
                return function (value) {
                    results[property] = value;
                    if (--remaining === 0) {
                        resolve(results);
                    }
                };
            }
            function onRejection(reason) {
                remaining = 0;
                reject(reason);
            }
            for (var i = 0; i < keys.length; i++) {
                property = keys[i];
                entry = object[property];
                if (isNonThenable(entry)) {
                    results[property] = entry;
                    if (--remaining === 0) {
                        resolve(results);
                    }
                } else {
                    Promise.resolve(entry).then(fulfilledTo(property), onRejection);
                }
            }
        });
    };
});
define('rsvp/hash_settled', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    
    var Promise = __dependency1__['default'];
    var isNonThenable = __dependency2__.isNonThenable;
    var keysOf = __dependency2__.keysOf;
    /**
      `RSVP.hashSettled` is similar to `RSVP.allSettled`, but takes an object
      instead of an array for its `promises` argument.

      Unlike `RSVP.all` or `RSVP.hash`, which implement a fail-fast method,
      but like `RSVP.allSettled`, `hashSettled` waits until all the
      constituent promises have returned and then shows you all the results
      with their states and values/reasons. This is useful if you want to
      handle multiple promises' failure states together as a set.

      Returns a promise that is fulfilled when all the given promises have been
      settled, or rejected if the passed parameters are invalid.

      The returned promise is fulfilled with a hash that has the same key names as
      the `promises` object argument. If any of the values in the object are not
      promises, they will be copied over to the fulfilled object and marked with state
      'fulfilled'.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.Promise.resolve(1),
        yourPromise: RSVP.Promise.resolve(2),
        theirPromise: RSVP.Promise.resolve(3),
        notAPromise: 4
      };

      RSVP.hashSettled(promises).then(function(hash){
        // hash here is an object that looks like:
        // {
        //   myPromise: { state: 'fulfilled', value: 1 },
        //   yourPromise: { state: 'fulfilled', value: 2 },
        //   theirPromise: { state: 'fulfilled', value: 3 },
        //   notAPromise: { state: 'fulfilled', value: 4 }
        // }
      });
      ```

      If any of the `promises` given to `RSVP.hash` are rejected, the state will
      be set to 'rejected' and the reason for rejection provided.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.Promise.resolve(1),
        rejectedPromise: RSVP.Promise.reject(new Error('rejection')),
        anotherRejectedPromise: RSVP.Promise.reject(new Error('more rejection')),
      };

      RSVP.hashSettled(promises).then(function(hash){
        // hash here is an object that looks like:
        // {
        //   myPromise:              { state: 'fulfilled', value: 1 },
        //   rejectedPromise:        { state: 'rejected', reason: Error },
        //   anotherRejectedPromise: { state: 'rejected', reason: Error },
        // }
        // Note that for rejectedPromise, reason.message == 'rejection',
        // and for anotherRejectedPromise, reason.message == 'more rejection'.
      });
      ```

      An important note: `RSVP.hashSettled` is intended for plain JavaScript objects that
      are just a set of keys and values. `RSVP.hashSettled` will NOT preserve prototype
      chains.

      Example:

      ```javascript
      function MyConstructor(){
        this.example = RSVP.Promise.resolve('Example');
      }

      MyConstructor.prototype = {
        protoProperty: RSVP.Promise.resolve('Proto Property')
      };

      var myObject = new MyConstructor();

      RSVP.hashSettled(myObject).then(function(hash){
        // protoProperty will not be present, instead you will just have an
        // object that looks like:
        // {
        //   example: { state: 'fulfilled', value: 'Example' }
        // }
        //
        // hash.hasOwnProperty('protoProperty'); // false
        // 'undefined' === typeof hash.protoProperty
      });
      ```

      @method hashSettled
      @for RSVP
      @param {Object} promises
      @param {String} label optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when when all properties of `promises`
      have been settled.
      @static
    */
    __exports__['default'] = function hashSettled(object, label) {
        return new Promise(function (resolve, reject) {
            var results = {};
            var keys = keysOf(object);
            var remaining = keys.length;
            var entry, property;
            if (remaining === 0) {
                resolve(results);
                return;
            }
            function fulfilledResolver(property) {
                return function (value) {
                    resolveAll(property, fulfilled(value));
                };
            }
            function rejectedResolver(property) {
                return function (reason) {
                    resolveAll(property, rejected(reason));
                };
            }
            function resolveAll(property, value) {
                results[property] = value;
                if (--remaining === 0) {
                    resolve(results);
                }
            }
            for (var i = 0; i < keys.length; i++) {
                property = keys[i];
                entry = object[property];
                if (isNonThenable(entry)) {
                    resolveAll(property, fulfilled(entry));
                } else {
                    Promise.resolve(entry).then(fulfilledResolver(property), rejectedResolver(property));
                }
            }
        });
    };
    function fulfilled(value) {
        return {
            state: 'fulfilled',
            value: value
        };
    }
    function rejected(reason) {
        return {
            state: 'rejected',
            reason: reason
        };
    }
});
define('rsvp/instrument', [
    './config',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    
    var config = __dependency1__.config;
    var now = __dependency2__.now;
    __exports__['default'] = function instrument(eventName, promise, child) {
        // instrumentation should not disrupt normal usage.
        try {
            config.trigger(eventName, {
                guid: promise._guidKey + promise._id,
                eventName: eventName,
                detail: promise._detail,
                childGuid: child && promise._guidKey + child._id,
                label: promise._label,
                timeStamp: now(),
                stack: new Error(promise._label).stack
            });
        } catch (error) {
            setTimeout(function () {
                throw error;
            }, 0);
        }
    };
});
define('rsvp/map', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    
    var Promise = __dependency1__['default'];
    var isArray = __dependency2__.isArray;
    var isFunction = __dependency2__.isFunction;
    /**
     `RSVP.map` is similar to JavaScript's native `map` method, except that it
      waits for all promises to become fulfilled before running the `mapFn` on
      each item in given to `promises`. `RSVP.map` returns a promise that will
      become fulfilled with the result of running `mapFn` on the values the promises
      become fulfilled with.

      For example:

      ```javascript

      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      var mapFn = function(item){
        return item + 1;
      };

      RSVP.map(promises, mapFn).then(function(result){
        // result is [ 2, 3, 4 ]
      });
      ```

      If any of the `promises` given to `RSVP.map` are rejected, the first promise
      that is rejected will be given as an argument to the returned promise's
      rejection handler. For example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      var mapFn = function(item){
        return item + 1;
      };

      RSVP.map(promises, mapFn).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "2"
      });
      ```

      `RSVP.map` will also wait if a promise is returned from `mapFn`. For example,
      say you want to get all comments from a set of blog posts, but you need
      the blog posts first becuase they contain a url to those comments.

      ```javscript

      var mapFn = function(blogPost){
        // getComments does some ajax and returns an RSVP.Promise that is fulfilled
        // with some comments data
        return getComments(blogPost.comments_url);
      };

      // getBlogPosts does some ajax and returns an RSVP.Promise that is fulfilled
      // with some blog post data
      RSVP.map(getBlogPosts(), mapFn).then(function(comments){
        // comments is the result of asking the server for the comments
        // of all blog posts returned from getBlogPosts()
      });
      ```

      @method map
      @static
      @for RSVP
      @param {Array} promises
      @param {Function} mapFn function to be called on each fulfilled promise.
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled with the result of calling
      `mapFn` on each fulfilled promise or value when they become fulfilled.
       The promise will be rejected if any of the given `promises` become rejected.
      @static
    */
    __exports__['default'] = function map(promises, mapFn, label) {
        return Promise.all(promises, label).then(function (results) {
            if (!isArray(promises)) {
                throw new TypeError('You must pass an array to map.');
            }
            if (!isFunction(mapFn)) {
                throw new TypeError('You must pass a function to map\'s second argument.');
            }
            var resultLen = results.length, mappedResults = [], i;
            for (i = 0; i < resultLen; i++) {
                mappedResults.push(mapFn(results[i]));
            }
            return Promise.all(mappedResults, label);
        });
    };
});
define('rsvp/node', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    
    var Promise = __dependency1__['default'];
    var isArray = __dependency2__.isArray;
    /**
      `RSVP.denodeify` takes a "node-style" function and returns a function that
      will return an `RSVP.Promise`. You can use `denodeify` in Node.js or the
      browser when you'd prefer to use promises over using callbacks. For example,
      `denodeify` transforms the following:

      ```javascript
      var fs = require('fs');

      fs.readFile('myfile.txt', function(err, data){
        if (err) return handleError(err);
        handleData(data);
      });
      ```

      into:

      ```javascript
      var fs = require('fs');
      var readFile = RSVP.denodeify(fs.readFile);

      readFile('myfile.txt').then(handleData, handleError);
      ```

      If the node function has multiple success parameters, then `denodeify`
      just returns the first one:

      ```javascript
      var request = RSVP.denodeify(require('request'));

      request('http://example.com').then(function(res) {
        // ...
      });
      ```

      However, if you need all success parameters, setting `denodeify`'s
      second parameter to `true` causes it to return all success parameters
      as an array:

      ```javascript
      var request = RSVP.denodeify(require('request'), true);

      request('http://example.com').then(function(result) {
        // result[0] -> res
        // result[1] -> body
      });
      ```

      Or if you pass it an array with names it returns the parameters as a hash:

      ```javascript
      var request = RSVP.denodeify(require('request'), ['res', 'body']);

      request('http://example.com').then(function(result) {
        // result.res
        // result.body
      });
      ```

      Sometimes you need to retain the `this`:

      ```javascript
      var app = require('express')();
      var render = RSVP.denodeify(app.render.bind(app));
      ```

      Using `denodeify` makes it easier to compose asynchronous operations instead
      of using callbacks. For example, instead of:

      ```javascript
      var fs = require('fs');

      fs.readFile('myfile.txt', function(err, data){
        if (err) { ... } // Handle error
        fs.writeFile('myfile2.txt', data, function(err){
          if (err) { ... } // Handle error
          console.log('done')
        });
      });
      ```

      you can chain the operations together using `then` from the returned promise:

      ```javascript
      var fs = require('fs');
      var readFile = RSVP.denodeify(fs.readFile);
      var writeFile = RSVP.denodeify(fs.writeFile);

      readFile('myfile.txt').then(function(data){
        return writeFile('myfile2.txt', data);
      }).then(function(){
        console.log('done')
      }).catch(function(error){
        // Handle error
      });
      ```

      @method denodeify
      @static
      @for RSVP
      @param {Function} nodeFunc a "node-style" function that takes a callback as
      its last argument. The callback expects an error to be passed as its first
      argument (if an error occurred, otherwise null), and the value from the
      operation as its second argument ("function(err, value){ }").
      @param {Boolean|Array} successArgumentNames An optional paramter that if set
      to `true` causes the promise to fulfill with the callback's success arguments
      as an array. This is useful if the node function has multiple success
      paramters. If you set this paramter to an array with names, the promise will
      fulfill with a hash with these names as keys and the success parameters as
      values.
      @return {Function} a function that wraps `nodeFunc` to return an
      `RSVP.Promise`
      @static
    */
    __exports__['default'] = function denodeify(nodeFunc, argumentNames) {
        return function () {
            /* global nodeArgs, $a_slice */
            var length = arguments.length;
            var nodeArgs = new Array(length);
            for (var i = 0; i < length; i++) {
                nodeArgs[i] = arguments[i];
            }
            ;
            var asArray = argumentNames === true;
            var asHash = isArray(argumentNames);
            var thisArg;
            if (!asArray && !asHash && argumentNames) {
                console.warn('Deprecation: RSVP.denodeify() doesn\'t allow setting the ' + '"this" binding anymore. Use yourFunction.bind(yourThis) instead.');
                thisArg = argumentNames;
            } else {
                thisArg = this;
            }
            return Promise.all(nodeArgs).then(function (nodeArgs$2) {
                return new Promise(resolver);
                // sweet.js has a bug, this resolver can't defined in the constructor
                // or the $a_slice macro doesn't work
                function resolver(resolve, reject) {
                    function callback() {
                        /* global args, $a_slice */
                        var length$2 = arguments.length;
                        var args = new Array(length$2);
                        for (var i$2 = 0; i$2 < length$2; i$2++) {
                            args[i$2] = arguments[i$2];
                        }
                        ;
                        var error = args[0];
                        var value = args[1];
                        if (error) {
                            reject(error);
                        } else if (asArray) {
                            resolve(args.slice(1));
                        } else if (asHash) {
                            var obj = {};
                            var successArguments = args.slice(1);
                            var name;
                            var i$3;
                            for (i$3 = 0; i$3 < argumentNames.length; i$3++) {
                                name = argumentNames[i$3];
                                obj[name] = successArguments[i$3];
                            }
                            resolve(obj);
                        } else {
                            resolve(value);
                        }
                    }
                    nodeArgs$2.push(callback);
                    nodeFunc.apply(thisArg, nodeArgs$2);
                }
            });
        };
    };
});
define('rsvp/promise', [
    './config',
    './events',
    './instrument',
    './utils',
    './promise/cast',
    './promise/all',
    './promise/race',
    './promise/resolve',
    './promise/reject',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __exports__) {
    
    var config = __dependency1__.config;
    var EventTarget = __dependency2__['default'];
    var instrument = __dependency3__['default'];
    var objectOrFunction = __dependency4__.objectOrFunction;
    var isFunction = __dependency4__.isFunction;
    var now = __dependency4__.now;
    var cast = __dependency5__['default'];
    var all = __dependency6__['default'];
    var race = __dependency7__['default'];
    var Resolve = __dependency8__['default'];
    var Reject = __dependency9__['default'];
    var guidKey = 'rsvp_' + now() + '-';
    var counter = 0;
    function noop() {
    }
    __exports__['default'] = Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error("getJSON: `" + url + "` failed with status: [" + this.status + "]");
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class RSVP.Promise
      @param {function}
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @constructor
    */
    function Promise(resolver, label) {
        if (!isFunction(resolver)) {
            throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
        }
        if (!(this instanceof Promise)) {
            throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');
        }
        this._id = counter++;
        this._label = label;
        this._subscribers = [];
        if (config.instrument) {
            instrument('created', this);
        }
        if (noop !== resolver) {
            invokeResolver(resolver, this);
        }
    }
    function invokeResolver(resolver, promise) {
        function resolvePromise(value) {
            resolve(promise, value);
        }
        function rejectPromise(reason) {
            reject(promise, reason);
        }
        try {
            resolver(resolvePromise, rejectPromise);
        } catch (e) {
            rejectPromise(e);
        }
    }
    Promise.cast = cast;
    Promise.all = all;
    Promise.race = race;
    Promise.resolve = Resolve;
    Promise.reject = Reject;
    var PENDING = void 0;
    var SEALED = 0;
    var FULFILLED = 1;
    var REJECTED = 2;
    function subscribe(parent, child, onFulfillment, onRejection) {
        var subscribers = parent._subscribers;
        var length = subscribers.length;
        subscribers[length] = child;
        subscribers[length + FULFILLED] = onFulfillment;
        subscribers[length + REJECTED] = onRejection;
    }
    function publish(promise, settled) {
        var child, callback, subscribers = promise._subscribers, detail = promise._detail;
        if (config.instrument) {
            instrument(settled === FULFILLED ? 'fulfilled' : 'rejected', promise);
        }
        for (var i = 0; i < subscribers.length; i += 3) {
            child = subscribers[i];
            callback = subscribers[i + settled];
            invokeCallback(settled, child, callback, detail);
        }
        promise._subscribers = null;
    }
    Promise.prototype = {
        constructor: Promise,
        _id: undefined,
        _guidKey: guidKey,
        _label: undefined,
        _state: undefined,
        _detail: undefined,
        _subscribers: undefined,
        _onerror: function (reason) {
            config.trigger('error', reason);
        },
        then: function (onFulfillment, onRejection, label) {
            var promise = this;
            this._onerror = null;
            var thenPromise = new this.constructor(noop, label);
            if (this._state) {
                var callbacks = arguments;
                config.async(function invokePromiseCallback() {
                    invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
                });
            } else {
                subscribe(this, thenPromise, onFulfillment, onRejection);
            }
            if (config.instrument) {
                instrument('chained', promise, thenPromise);
            }
            return thenPromise;
        },
        'catch': function (onRejection, label) {
            return this.then(null, onRejection, label);
        },
        'finally': function (callback, label) {
            var constructor = this.constructor;
            return this.then(function (value) {
                return constructor.cast(callback()).then(function () {
                    return value;
                });
            }, function (reason) {
                return constructor.cast(callback()).then(function () {
                    throw reason;
                });
            }, label);
        }
    };
    function invokeCallback(settled, promise, callback, detail) {
        var hasCallback = isFunction(callback), value, error, succeeded, failed;
        if (hasCallback) {
            try {
                value = callback(detail);
                succeeded = true;
            } catch (e) {
                failed = true;
                error = e;
            }
        } else {
            value = detail;
            succeeded = true;
        }
        if (handleThenable(promise, value)) {
            return;
        } else if (hasCallback && succeeded) {
            resolve(promise, value);
        } else if (failed) {
            reject(promise, error);
        } else if (settled === FULFILLED) {
            resolve(promise, value);
        } else if (settled === REJECTED) {
            reject(promise, value);
        }
    }
    function handleThenable(promise, value) {
        var then = null, resolved;
        try {
            if (promise === value) {
                throw new TypeError('A promises callback cannot return that same promise.');
            }
            if (objectOrFunction(value)) {
                then = value.then;
                if (isFunction(then)) {
                    then.call(value, function (val) {
                        if (resolved) {
                            return true;
                        }
                        resolved = true;
                        if (value !== val) {
                            resolve(promise, val);
                        } else {
                            fulfill(promise, val);
                        }
                    }, function (val) {
                        if (resolved) {
                            return true;
                        }
                        resolved = true;
                        reject(promise, val);
                    }, 'Settle: ' + (promise._label || ' unknown promise'));
                    return true;
                }
            }
        } catch (error) {
            if (resolved) {
                return true;
            }
            reject(promise, error);
            return true;
        }
        return false;
    }
    function resolve(promise, value) {
        if (promise === value) {
            fulfill(promise, value);
        } else if (!handleThenable(promise, value)) {
            fulfill(promise, value);
        }
    }
    function fulfill(promise, value) {
        if (promise._state !== PENDING) {
            return;
        }
        promise._state = SEALED;
        promise._detail = value;
        config.async(publishFulfillment, promise);
    }
    function reject(promise, reason) {
        if (promise._state !== PENDING) {
            return;
        }
        promise._state = SEALED;
        promise._detail = reason;
        config.async(publishRejection, promise);
    }
    function publishFulfillment(promise) {
        publish(promise, promise._state = FULFILLED);
    }
    function publishRejection(promise) {
        if (promise._onerror) {
            promise._onerror(promise._detail);
        }
        publish(promise, promise._state = REJECTED);
    }
});
define('rsvp/promise/all', [
    '../utils',
    'exports'
], function (__dependency1__, __exports__) {
    
    var isArray = __dependency1__.isArray;
    var isNonThenable = __dependency1__.isNonThenable;
    /**
      `RSVP.Promise.all` accepts an array of promises, and returns a new promise which
      is fulfilled with an array of fulfillment values for the passed promises, or
      rejected with the reason of the first passed promise to be rejected. It casts all
      elements of the passed iterable to promises as it runs this algorithm.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.Promise.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.Promise.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @static
      @param {Array} entries array of promises
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
      @static
    */
    __exports__['default'] = function all(entries, label) {
        /*jshint validthis:true */
        var Constructor = this;
        return new Constructor(function (resolve, reject) {
            if (!isArray(entries)) {
                throw new TypeError('You must pass an array to all.');
            }
            var remaining = entries.length;
            var results = new Array(remaining);
            var entry, pending = true;
            if (remaining === 0) {
                resolve(results);
                return;
            }
            function fulfillmentAt(index) {
                return function (value) {
                    results[index] = value;
                    if (--remaining === 0) {
                        resolve(results);
                    }
                };
            }
            function onRejection(reason) {
                remaining = 0;
                reject(reason);
            }
            for (var index = 0; index < entries.length; index++) {
                entry = entries[index];
                if (isNonThenable(entry)) {
                    results[index] = entry;
                    if (--remaining === 0) {
                        resolve(results);
                    }
                } else {
                    Constructor.resolve(entry).then(fulfillmentAt(index), onRejection);
                }
            }
        }, label);
    };
});
define('rsvp/promise/cast', ['exports'], function (__exports__) {
    
    /**
      @deprecated

      `RSVP.Promise.cast` coerces its argument to a promise, or returns the
      argument if it is already a promise which shares a constructor with the caster.

      Example:

      ```javascript
      var promise = RSVP.Promise.resolve(1);
      var casted = RSVP.Promise.cast(promise);

      console.log(promise === casted); // true
      ```

      In the case of a promise whose constructor does not match, it is assimilated.
      The resulting promise will fulfill or reject based on the outcome of the
      promise being casted.

      Example:

      ```javascript
      var thennable = $.getJSON('/api/foo');
      var casted = RSVP.Promise.cast(thennable);

      console.log(thennable === casted); // false
      console.log(casted instanceof RSVP.Promise) // true

      casted.then(function(data) {
        // data is the value getJSON fulfills with
      });
      ```

      In the case of a non-promise, a promise which will fulfill with that value is
      returned.

      Example:

      ```javascript
      var value = 1; // could be a number, boolean, string, undefined...
      var casted = RSVP.Promise.cast(value);

      console.log(value === casted); // false
      console.log(casted instanceof RSVP.Promise) // true

      casted.then(function(val) {
        val === value // => true
      });
      ```

      `RSVP.Promise.cast` is similar to `RSVP.Promise.resolve`, but `RSVP.Promise.cast` differs in the
      following ways:

      * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
      have something that could either be a promise or a value. RSVP.resolve
      will have the same effect but will create a new promise wrapper if the
      argument is a promise.
      * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
      promises of the exact class specified, so that the resulting object's `then` is
      ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

      @method cast
      @static
      @param {Object} object to be casted
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise
    */
    __exports__['default'] = function cast(object, label) {
        /*jshint validthis:true */
        var Constructor = this;
        if (object && typeof object === 'object' && object.constructor === Constructor) {
            return object;
        }
        return new Constructor(function (resolve) {
            resolve(object);
        }, label);
    };
});
define('rsvp/promise/race', [
    '../utils',
    'exports'
], function (__dependency1__, __exports__) {
    
    /* global toString */
    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;
    var isNonThenable = __dependency1__.isNonThenable;
    /**
      `RSVP.Promise.race` returns a new promise which is settled in the same way as the
      first passed promise to settle.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.Promise.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.Promise.race` is deterministic in that only the state of the first
      settled promise matters. For example, even if other promises given to the
      `promises` array argument are resolved, but the first settled promise has
      become rejected before the other promises became fulfilled, the returned
      promise will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.Promise.race([promise1, promise2]).then(function(result){
        // Code here never runs
      }, function(reason){
        // reason.message === "promise2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      An example real-world use case is implementing timeouts:

      ```javascript
      RSVP.Promise.race([ajax('foo.json'), timeout(5000)])
      ```

      @method race
      @static
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise which settles in the same way as the first passed
      promise to settle.
    */
    __exports__['default'] = function race(entries, label) {
        /*jshint validthis:true */
        var Constructor = this, entry;
        return new Constructor(function (resolve, reject) {
            if (!isArray(entries)) {
                throw new TypeError('You must pass an array to race.');
            }
            var pending = true;
            function onFulfillment(value) {
                if (pending) {
                    pending = false;
                    resolve(value);
                }
            }
            function onRejection(reason) {
                if (pending) {
                    pending = false;
                    reject(reason);
                }
            }
            for (var i = 0; i < entries.length; i++) {
                entry = entries[i];
                if (isNonThenable(entry)) {
                    pending = false;
                    resolve(entry);
                    return;
                } else {
                    Constructor.resolve(entry).then(onFulfillment, onRejection);
                }
            }
        }, label);
    };
});
define('rsvp/promise/reject', ['exports'], function (__exports__) {
    
    /**
      `RSVP.Promise.reject` returns a promise rejected with the passed `reason`.
      It is shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.Promise.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @static
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise rejected with the given `reason`.
    */
    __exports__['default'] = function reject(reason, label) {
        /*jshint validthis:true */
        var Constructor = this;
        return new Constructor(function (resolve, reject$2) {
            reject$2(reason);
        }, label);
    };
});
define('rsvp/promise/resolve', ['exports'], function (__exports__) {
    
    /**
      `RSVP.Promise.resolve` returns a promise that will become resolved with the
      passed `value`. It is shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        resolve(1);
      });

      promise.then(function(value){
        // value === 1
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.Promise.resolve(1);

      promise.then(function(value){
        // value === 1
      });
      ```

      @method resolve
      @static
      @param {Any} value value that the returned promise will be resolved with
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    __exports__['default'] = function resolve(object, label) {
        /*jshint validthis:true */
        var Constructor = this;
        if (object && typeof object === 'object' && object.constructor === Constructor) {
            return object;
        }
        return new Constructor(function (resolve$2) {
            resolve$2(object);
        }, label);
    };
});
define('rsvp/race', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.race`.

      @method race
      @static
      @for RSVP
      @param {Array} array Array of promises.
      @param {String} label An optional label. This is useful
      for tooling.
     */
    __exports__['default'] = function race(array, label) {
        return Promise.race(array, label);
    };
});
define('rsvp/reject', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.reject`.

      @method reject
      @static
      @for RSVP
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise rejected with the given `reason`.
    */
    __exports__['default'] = function reject(reason, label) {
        return Promise.reject(reason, label);
    };
});
define('rsvp/resolve', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.resolve`.

      @method resolve
      @static
      @for RSVP
      @param {Any} value value that the returned promise will be resolved with
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    __exports__['default'] = function resolve(value, label) {
        return Promise.resolve(value, label);
    };
});
define('rsvp/rethrow', ['exports'], function (__exports__) {
    
    /**
      `RSVP.rethrow` will rethrow an error on the next turn of the JavaScript event
      loop in order to aid debugging.

      Promises A+ specifies that any exceptions that occur with a promise must be
      caught by the promises implementation and bubbled to the last handler. For
      this reason, it is recommended that you always specify a second rejection
      handler function to `then`. However, `RSVP.rethrow` will throw the exception
      outside of the promise, so it bubbles up to your console if in the browser,
      or domain/cause uncaught exception in Node. `rethrow` will also throw the
      error again so the error can be handled by the promise per the spec.

      ```javascript
      function throws(){
        throw new Error('Whoops!');
      }

      var promise = new RSVP.Promise(function(resolve, reject){
        throws();
      });

      promise.catch(RSVP.rethrow).then(function(){
        // Code here doesn't run because the promise became rejected due to an
        // error!
      }, function (err){
        // handle the error here
      });
      ```

      The 'Whoops' error will be thrown on the next turn of the event loop
      and you can watch for it in your console. You can also handle it using a
      rejection handler given to `.then` or `.catch` on the returned promise.

      @method rethrow
      @static
      @for RSVP
      @param {Error} reason reason the promise became rejected.
      @throws Error
      @static
    */
    __exports__['default'] = function rethrow(reason) {
        setTimeout(function () {
            throw reason;
        });
        throw reason;
    };
});
define('rsvp/utils', ['exports'], function (__exports__) {
    
    function objectOrFunction(x) {
        return typeof x === 'function' || typeof x === 'object' && x !== null;
    }
    __exports__.objectOrFunction = objectOrFunction;
    function isFunction(x) {
        return typeof x === 'function';
    }
    __exports__.isFunction = isFunction;
    function isNonThenable(x) {
        return !objectOrFunction(x);
    }
    __exports__.isNonThenable = isNonThenable;
    var _isArray;
    if (!Array.isArray) {
        _isArray = function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
        };
    } else {
        _isArray = Array.isArray;
    }
    var isArray = _isArray;
    __exports__.isArray = isArray;
    // Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function () {
            return new Date().getTime();
        };
    __exports__.now = now;
    var keysOf = Object.keys || function (object) {
            var result = [];
            for (var prop in object) {
                result.push(prop);
            }
            return result;
        };
    __exports__.keysOf = keysOf;
});
define('rsvp', [
    './rsvp/promise',
    './rsvp/events',
    './rsvp/node',
    './rsvp/all',
    './rsvp/all_settled',
    './rsvp/race',
    './rsvp/hash',
    './rsvp/hash_settled',
    './rsvp/rethrow',
    './rsvp/defer',
    './rsvp/config',
    './rsvp/map',
    './rsvp/resolve',
    './rsvp/reject',
    './rsvp/filter',
    './rsvp/asap',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __exports__) {
    
    var Promise = __dependency1__['default'];
    var EventTarget = __dependency2__['default'];
    var denodeify = __dependency3__['default'];
    var all = __dependency4__['default'];
    var allSettled = __dependency5__['default'];
    var race = __dependency6__['default'];
    var hash = __dependency7__['default'];
    var hashSettled = __dependency8__['default'];
    var rethrow = __dependency9__['default'];
    var defer = __dependency10__['default'];
    var config = __dependency11__.config;
    var configure = __dependency11__.configure;
    var map = __dependency12__['default'];
    var resolve = __dependency13__['default'];
    var reject = __dependency14__['default'];
    var filter = __dependency15__['default'];
    var asap = __dependency16__['default'];
    config.async = asap;
    // default async is asap;
    function async(callback, arg) {
        config.async(callback, arg);
    }
    function on() {
        config.on.apply(config, arguments);
    }
    function off() {
        config.off.apply(config, arguments);
    }
    // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
    if (typeof window !== 'undefined' && typeof window.__PROMISE_INSTRUMENTATION__ === 'object') {
        var callbacks = window.__PROMISE_INSTRUMENTATION__;
        configure('instrument', true);
        for (var eventName in callbacks) {
            if (callbacks.hasOwnProperty(eventName)) {
                on(eventName, callbacks[eventName]);
            }
        }
    }
    __exports__.Promise = Promise;
    __exports__.EventTarget = EventTarget;
    __exports__.all = all;
    __exports__.allSettled = allSettled;
    __exports__.race = race;
    __exports__.hash = hash;
    __exports__.hashSettled = hashSettled;
    __exports__.rethrow = rethrow;
    __exports__.defer = defer;
    __exports__.denodeify = denodeify;
    __exports__.configure = configure;
    __exports__.on = on;
    __exports__.off = off;
    __exports__.resolve = resolve;
    __exports__.reject = reject;
    __exports__.async = async;
    __exports__.map = map;
    __exports__.filter = filter;
});
define('pixy/mixins/react/util',[ 'inflection' ], function() {
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
define('pixy/mixins/react/layout_manager_mixin',[ 'react', 'lodash', 'rsvp', './util' ], function(React, _, RSVP, Util) {
  var extend = _.extend;
  var merge = _.merge;
  var slice = [].slice;
  var getName = Util.getName;

  var log = function() {
    var params = slice.call(arguments);
    var context = params[0];

    params[0] = getName(context) + ':';

    console.debug.apply(console, params);
  };

  /**
   * Required implementation:
   *
   *  statics: {
   *    getLayout: function(layoutName, props, state) {
   *      return myLayouts[layoutName];
   *    }
   *  }
   */
  return {
    getInitialState: function() {
      return {
      };
    },

    /**
     * Add a new component to a specific layout.
     *
     * @param {React.Class} component
     *        The component factory/type.
     *
     * @param {String} layoutName
     *        Name of the layout to add the component to.
     *
     * @param {Object} [options={}]
     *        Layout-exclusive options.
     *
     * @return {RSVP.Promise}
     */
    add: function(component, layoutName, options) {
      var newState, errorMessage;
      var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
      var svc = RSVP.defer();

      options = options || {};

      if (!layout) {
        return svc.reject('Unknown layout "' + layoutName + '"');
      }

      if (!layout.canAdd(component, options)) {
        errorMessage = 'Component ' + getName(component) +
                       ' can not be added to the layout ' + getName(layout);

        return svc.reject(errorMessage);
      }

      newState = layout.addComponent(component, options, this.state);

      if (!newState) {
        return svc.resolve();
      }

      log(this, 'adding component', getName(component), 'to layout', layoutName);

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    addMany: function(specs) {
      var newState;
      var svc = RSVP.defer();

      newState = specs.reduce(function(state, item) {
        var component = item.component;
        var layoutName = item.layoutName;
        var options = item.options || {};
        var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
        var stateEntry;

        if (!layout) {
          console.error('Unknown layout "' + layoutName + '"');
          return state;
        }

        if (!layout.canAdd(component, options)) {
          console.error(
            'Component ' + getName(component) +
            ' can not be added to the layout ' + getName(layout)
          );

          return state;
        }

        stateEntry = layout.addComponent(component, options, this.state);

        if (!stateEntry) {
          return state;
        }

        log(this, 'adding component', getName(component), 'to layout', layoutName);
        log(this, stateEntry);

        return merge(state, stateEntry);
      }.bind(this), {});

      console.log('Adding many components:', newState, 'from:', specs);

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    /**
     * Detach a component from a layout.
     *
     * @param  {React.Class} component
     *         The component you passed to #add and want to remove.
     *
     * @param  {String} layoutName
     *         The layout the component was mounted in.
     *
     * @return {RSVP.Promise}
     */
    remove: function(component, layoutName, options) {
      var newState;
      var layout = Util.getStatic(this, 'getLayout')(layoutName, this.props, this.state);
      var svc = RSVP.defer();

      options = options || {};

      if (!layout) {
        return svc.reject('Unknown layout "' + layoutName + '"');
      }

      log(this, 'removing component', getName(component), 'from layout', layoutName);

      newState = layout.removeComponent(component, options, this.state);

      if (!newState) {
        return svc.resolve();
      }

      this.setState(newState, svc.resolve);

      return svc.promise;
    },

    /**
     * Create a renderable instance of a given layout and assign its children.
     *
     * @param  {React.Class} type
     *         The layout type/constructor.
     *
     * @param  {Object} [props={}]
     *         Layout-specific props, like "key" or "ref".
     *
     * @param  {Boolean} [dontTransferProps=false]
     *         Pass true if you don't want to pass all the props down to the
     *         layout.
     *
     * @return {React.Component}
     *         The renderable instance you can attach in #render().
     */
    renderLayout: function(type, props, dontTransferProps) {
      var layout = type(extend({}, props, {
        components: this.getLayoutChildren(type)
      }));

      return dontTransferProps ? layout : this.transferPropsTo(layout);
    },

    clearLayout: function(type) {
      var newState = {};
      newState[getName(type)] = undefined;
      this.setState(newState);
    },

    /**
     * @internal
     *
     * The components that were added to the layout. The manager doesn't really
     * know what to do with this set, but the layouts do. It is passed to them
     * as the "components" property and they should know how to render them.
     *
     * @param  {React.Class} type
     *         The layout to search for its children.
     *
     * @return {Mixed}
     *         The set of component types the layout can render. This differs
     *         between layouts, refer to its documentation for the structure
     *         of this output.
     */
    getLayoutChildren: function(type) {
      return this.state[getName(type)];
    }
  };
});
define('pixy/mixins/react/layout_mixin',[ 'react', 'underscore', './util' ], function(React, _, Util) {
  var contains = _.contains;
  var update = React.addons.update;
  var render = Util.render;
  var getName = Util.getName;

  var getOutletOccupant = function(outlet, props) {
    var type = props.components[outlet];

    if (!type) {
      return undefined;
    }
    else if (type && 'function' === typeof type.canMount) {
      return type.canMount(props) ? type : undefined;
    }
    else {
      return type;
    }
  };

  var getDefaultOutlet = function(type) {
    return type.defaultOutlet;
  };

  return {
    statics: {
      canAdd: function(component, options) {
        var outlets = this.availableOutlets ? this.availableOutlets() : [];

        return contains(outlets, options.outlet || getDefaultOutlet(this));
      },

      /**
       * @return {Boolean}
       *         Whether any of the layout outlets are currently occupied by
       *         a component.
       */
      isEmpty: function(props, state) {
        var outlet;
        var outlets = props ? props.components : state[getName(this)];

        for (outlet in outlets) {
          if (outlets.hasOwnProperty(outlet) && !!outlets[outlet]) {
            return false;
          }
        }

        return true;
      },

      /**
       * @internal Assign a new outlet component.
       *
       * @param {React.Class} component
       *        The component type/constructor.
       *
       * @param {Object} options (required)
       * @param {String} outlet (required)
       *        Name of the outlet to mount the component in.
       *        If left unspecified, the primary outlet will be assumed.
       *
       * @param {Object} state
       *        The layout manager's state.
       *
       * @return {Object}
       *         The new layout manager's state that contains the newly added
       *         component.
       */
      addComponent: function(component, options, state) {
        var subState;
        var layoutName = getName(this);
        var outlet = options.outlet || getDefaultOutlet(this);
        var newState = {};

        
        if (!state[layoutName]) {
          newState[layoutName] = {};
          newState[layoutName][outlet] = component;
        }
        else {
          subState = {};
          subState[outlet] = {
            $set: component
          };

          newState[layoutName] = update(state[layoutName], subState);
        }

        return newState;
      },

      /**
       * @private
       */
      removeComponent: function(component, options, state) {
        var outlets, outlet, found;
        var layoutName = Util.getName(this);

        outlet = options.outlet || getDefaultOutlet(this);

        // if no "outlet" option was passed in, try to locate the outlet using
        // the component itself if it was occupying one
        if (!outlet) {
          outlets = state[layoutName];

          for (outlet in outlets) {
            if (outlets[outlet] === component) {
              found = true;
              break;
            }
          }

          if (!found) {
            return undefined;
          }
        }

        return this.addComponent(undefined, { outlet: outlet }, state);
      }
    },

    getDefaultProps: function() {
      return {
        /** @internal */
        components: {}
      };
    },

    /**
     * @param  {String}  outlet
     *         The outlet you want to test.
     *
     * @return {Boolean}
     *         Whether the specified outlet has a component to be occupied with.
     */
    hasOutletOccupant: function(outlet) {
      return !!getOutletOccupant(outlet, this.props);
    },

    renderOutlet: function(outlet, initialProps, dontTransferProps) {
      return render.apply(this, [
        getOutletOccupant(outlet, this.props),
        initialProps,
        dontTransferProps
      ]);
    }
  };
});
define('pixy/mixins/react/stacked_layout_mixin',[ 'react', 'underscore', './util' ], function(React, _, Util) {
  var without = _.without;
  var update = React.addons.update;
  var getName = Util.getName;
  var render = Util.render;

  return {
    statics: {
      canAdd: function(/*component, options*/) {
        return true;
      },

      /**
       * @return {Boolean}
       *         Whether the layout has any components to render.
       */
      isEmpty: function(props, state) {
        var components = props ? props.components : state[getName(this)];
        return !components || components.length < 1;
      },

      /**
       * @internal
       */
      addComponent: function(component, state) {
        var newState = {};
        var layoutName = getName(this);

        if (!state[layoutName]) {
          newState[layoutName] = [ component ];
        } else {
          newState[layoutName] = update(state[layoutName], {
            $unshift: [ component ]
          });
        }

        return newState;
      },

      /**
       * @internal
       */
      removeComponent: function(component, state) {
        var newState = {};
        var layoutName = getName(this);

        newState[layoutName] = without(state[layoutName], component);

        return newState;
      }
    },

    getDefaultProps: function() {
      return {
      /** @internal */
        components: []
      };
    },

    getNextComponentType: function() {
      return this.props.components[0];
    },

    renderComponent: function(initialProps, dontTransferProps) {
      return render.apply(this, [
        this.getNextComponentType(),
        initialProps,
        dontTransferProps
      ]);
    }
  };
});
define('pixy/mixins/events',[ 'underscore' ], function(_) {
  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  var slice = Array.prototype.slice;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Pixy events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Pixy.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Pixy.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
        return this;
      }

      if (!this._events) {
        this._events = {};
      }

      if (!this._events[name]) {
        this._events[name] = [];
      }

      this._events[name].push({
        callback: callback,
        context: context,
        ctx: context || this
      });

      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  return Events;
});
define('pixy/mixins/logger',[ 'underscore' ], function(_) {
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
define('pixy/util',[], function() {
  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) {
        error(model, resp, options);
      }

      model.trigger('error', model, resp, options);
    };
  };

  return {
    urlError: urlError,
    wrapError: wrapError
  };
});
define('pixy/util/sync',[ 'underscore', '../util' ], function(_, Util) {
  var urlError = Util.urlError;
  var result = _.result;
  var extend = _.extend;
  var contains = _.contains;

  // Pixy.sync
  // -------------

  // Map from CRUD to HTTP for our default `Pixy.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  var PAYLOAD_METHODS = [ 'create', 'update', 'patch' ];

  // Override this function to change the manner in which Pixy persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Pixy.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  return function(method, model, options) {
    var params, xhr, attrs;
    var type = methodMap[method];

    // Default options, unless specified.
    options = options || {};

    // Default JSON-request options.
    params = { type: type, dataType: 'json' };

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (!options.data && model && (contains(PAYLOAD_METHODS, method))) {
      attrs = options.attrs || model.toJSON(options);
      model.normalize(attrs);
      params.contentType = 'application/json';
      params.data = JSON.stringify(attrs);
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET') {
      params.processData = false;
    }

    // Make the request, allowing the user to override any Ajax options.
    xhr = options.xhr = this.ajax(extend(params, options));

    model.trigger('request', model, xhr, options);

    return xhr;
  };
});
/* global exports: false */

define('pixy/namespace',[
  'jquery',
  'underscore',
  'rsvp',
  './mixins/events',
  './mixins/logger',
  './util/sync'
], function($, _, RSVP, Events, Logger, sync) {
  var extend = _.extend;

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Pixy` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousPixy = root.Pixy;

  // The top-level namespace. All public Pixy classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Pixy;
  if (typeof exports !== 'undefined') {
    Pixy = exports;
  } else {
    Pixy = root.Pixy = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Pixy.VERSION = '1.7.4';

  Pixy.sync = _.bind(sync, Pixy);
  Pixy.$ = $;

  // Allow the `Pixy` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  extend(Pixy, Events, Logger, {
    name: 'Pixy'
  });

  // Runs Pixy.js in *noConflict* mode, returning the `Pixy` variable
  // to its previous owner. Returns a reference to this Pixy object.
  Pixy.noConflict = function() {
    root.Pixy = previousPixy;
    return this;
  };

  // Set the default implementation of `Pixy.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Pixy.ajax = function() {
    return RSVP.Promise.cast(Pixy.$.ajax.apply(Pixy.$, arguments));
  };

  Pixy.warn = function() {
    if (window.hasOwnProperty('PIXY_TEST')) {
      return;
    }

    return console.warn.apply(console, arguments);
  };

  return Pixy;
});
define('pixy/util/extend',[ 'underscore' ], function(_) {
  var slice = [].slice;
  var has = _.has;

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  //
  // Rip off of Backbone.extend. Adds mixin support.
  var extend = function(/*[mixin1, ..., mixinN, ]*/) {
    var mixins, mixinInitializers, child;
    var parent = this;
    var protoProps;

    mixins = slice.call(arguments, 0);

    protoProps = _.last(mixins);

    if (_.has(protoProps, 'mixins')) {
      mixins = _.union(protoProps.mixins, mixins);
    }

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    // if (protoProps) _.extend(child.prototype, protoProps);

    // Support for mixing in any number of objects.
    //
    // Pick up any mixin initializers from the parent.
    mixinInitializers = _.clone(parent.prototype.__mixinInitializers__ || []);

    // if (mixinInitializers.length) {
    //   console.debug("Inherited", mixinInitializers.length, "mixins from parent:", parent.prototype);
    // }

    // Extract all initializers and set them in the child's _initializers
    _.each(mixins, function(mixin, i) {
      if (i+1 === mixins.length) {
        return;
      }

      var initializer = mixin.__initialize__;

      if (initializer) {
        mixinInitializers.push(initializer);
      } else {
        console.warn("looks like mixin has no initialize?", mixin)
      }
    });

    if (mixinInitializers.length) {
      child.prototype.__mixinInitializers__ = mixinInitializers;
    }

    mixins.unshift(child.prototype);
    _.extend.apply(_, mixins);

    return child;
  };

  extend.withoutMixins = function(protoProps) {
    var mixins, mixinInitializers, child;
    var parent = this;
    var protoProps;

    mixins = slice.call(arguments, 0);

    protoProps = _.last(mixins);

    if (_.has(protoProps, 'mixins')) {
      mixins = _.union(protoProps.mixins, mixins);
    }

    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    _.extend(child, parent);

    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    _.extend(child.prototype, protoProps);

    return child;
  }

  return extend;
});

define('pixy/object',[
  'underscore',
  './namespace',
  './util/extend',
  './mixins/events',
  './mixins/logger'
], function(_, Pixy, extend, Events, Logger) {
  

  var NOOP = function(){};
  var slice = [].slice;

  var initializeMixins = function() {
    _.each(this.__mixinInitializers__, function(initializer) {
      try {
        initializer.apply(this, []);
      } catch (e) {
        console.warn('Mixin failed to initialize:', e.stack);
      }
    }, this);

    delete this.__mixinInitializers__;
  };

  /**
   * @class Pixy.Object
   *
   * Creates a new object. This is not meant to be used directly, but instead
   * subclasses should implement their own constructor.
   *
   * See the implementation of resource like Collection or View for examples.
   *
   * @param {String} [type='object']
   *        Object class name.
   *
   * @param {Function} [ctor=null]
   *        If you're defining a new class, you can pass a function that will be
   *        executed after any mixins have been initialized but just before
   *        the user's #initialize() is called.
   *
   * @param {Mixed[]} [args=[]]
   *        Arguments to pass to Pixy.Object#initialize(), the user object
   *        initializer.
   */
  var PObject = function(type, ctor, attrs) {
    if (arguments.length <= 1) {
      attrs = slice.call(arguments);
      type = 'object';
      ctor = NOOP;
    }

    type = type || 'object';

    Pixy.trigger(type + ':creating', this);

    initializeMixins.call(this);

    if (_.isFunction(ctor)) {
      ctor.call(this);
    } else {
      console.warn('Pixy::Object: expected a constructor function, got:', typeof ctor, this);
    }

    this.initialize.apply(this, attrs);

    Pixy.trigger(type + ':created', this);

    return this;
  };

  _.extend(PObject.prototype, Events, Logger, {
    name: 'Object',

    initialize: function() {},
    toString: function() {
      return this.name || this.id;
    }
  });

  PObject.extend = extend;

  return PObject;
});

define('pixy/core/dispatcher',[ 'underscore', 'rsvp', '../object' ], function(_, RSVP, PObject) {
  var callbacks = [];
  var supportedActions = [];
  var extend = _.extend;
  var actionIndex = 0;
  var EXTRACTOR = /^([^:]+):(.*)$/;
  var handlers = {};

  /**
   * @class Pixy.Dispatcher
   * @extends Pixy.Object
   *
   * An implementation of the Flux action dispatcher. Responsible for dispatching
   * action payload to Data Stores.
   */
  var Dispatcher = PObject.extend({
    name: 'Dispatcher',

    dispatch: function(actionType, payload, options) {
      var service, action;
      var storeKey, actionId;
      var promise;
      // var fragments = (''+actionType).match(EXTRACTOR);
      var fragments = actionType.split(':');

      if (fragments.length === 2) {
        storeKey = fragments[0];
        actionId = fragments[1];
      }

      action = extend({}, options, {
        id: actionId,
        storeKey: storeKey,
        type: actionType,
        index: ++actionIndex,
        payload: payload
      });

      if (actionId) {
        if (supportedActions.indexOf(actionType) === -1) {
          console.assert(false, 'No action handler registered to:', actionType);
          promise = RSVP.reject('Unknown action');
        }
        else {
          console.debug('Dispatching targeted action "', actionId, '" with args:', action);
          promise = handlers[storeKey](action);
        }
      }
      else {
        console.debug('Dispatching generic action "', actionId, '" to all stores:', action);

        promise = callbacks.reduce(function(promises, callback) {
          return promises.concat(callback(action));
        }, []);
      }

      service = {
        promise: promise,
        index: action.index,
        // @deprecated
        actionIndex: action.index
      };

      return service;
    },

    register: function(callback) {
      callbacks.push(callback);
    },

    registerActionHandler: function(action, key) {
      supportedActions.push([ key , action ].join(':'));
    },

    registerHandler: function(key, handler) {
      handlers[key] = handler;
    }

      });

  return new Dispatcher();
});
define('pixy/mixins/react/actor_mixin',['require','../../core/dispatcher'],function(require) {
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

    componentWillReceiveProps: function(nextProps) {
      var storeError = nextProps.storeError;

      if (storeError && storeError.actionIndex === this.state.actionIndex) {
        this.setState({ storeError: storeError });
      }
    },

    componentDidUpdate: function() {
      if (this.state.storeError) {
        if (this.onStoreError) {
          this.onStoreError(this.state.storeError);
        }

        this.setState({ storeError: null });
      }
    },

    componentWillUnmount: function() {
      this.lastAction = undefined;
    },

    /**
     * @internal
     * @param  {RSVP.Promise} service
     */
    trackAction: function(service) {
      this.lastAction = service.promise;

      this.setState({
        actionIndex: service.index
      });
    },

    /**
     * Convenient method for consuming events.
     *
     * @param {Event} e
     *        Something that responds to #preventDefault().
     */
    consume: function(e) {
      if (e) {
        e.preventDefault();
      }
    },

    /**
     * Send an action via the Dispatcher, track the action promise, and any
     * error the handler raises.
     *
     * A reference to the action handler's promise will be kept in
     * `this.lastAction`. The index of the action is tracked in
     * this.state.actionIndex.
     *
     * If an error is raised, it will be accessible in `this.state.storeError`.
     *
     * @param {String} action (required)
     *        Unique action identifier. Must be scoped by the store key, e.g:
     *        "categories:save", or "users:changePassword".
     *
     * @param {Object} [params={}]
     *        Action payload.
     *
     * @param {Object} [options={}]
     * @param {Boolean} [options.track=true]
     *        Pass as false if you don't want the mixin to perform any tracking.
     *
     * @return {RSVP.Promise}
     *         The action promise which will fulfill if the action succeeds,
     *         or fail if the action doesn't. Failure will be presented by
     *         an error that adheres to the UIError interface.
     */
    sendAction: function(action, params, options) {
      var setState = this.setState.bind(this);
      var service = Dispatcher.dispatch(action, params, {
        source: 'VIEW_ACTION'
      });

      if (options && options.track === false) {
        return;
      }

      this.trackAction(service);

      service.promise.then(null, function(error) {
        setState({
          storeError: {
            actionIndex: service.index,
            error: error
          }
        });
      });

      return service.promise;
    }
  };

  return ActorMixin;
});
define('pixy/ext/react',['require','react','../mixins/react/layout_manager_mixin','../mixins/react/layout_mixin','../mixins/react/stacked_layout_mixin','../mixins/react/actor_mixin'],function(require) {
  var React = require('react');
  var LayoutManagerMixin = require('../mixins/react/layout_manager_mixin');
  var LayoutMixin = require('../mixins/react/layout_mixin');
  var StackedLayoutMixin = require('../mixins/react/stacked_layout_mixin');
  var ActorMixin = require('../mixins/react/actor_mixin');

  React.addons.LayoutManagerMixin = LayoutManagerMixin;
  React.addons.LayoutMixin = LayoutMixin;
  React.addons.StackedLayoutMixin = StackedLayoutMixin;
  React.addons.ActorMixin = ActorMixin;

  return React;
});
/*!
 * jQuery serializeObject
 * http://github.com/macek/jquery-serialize-object
 *
 * Copyright 2013 Paul Macek <paulmacek@gmail.com>
 * Released under the BSD license
 */
define('pixy/ext/jquery/form_serializer',[ 'jquery' ], function($) {
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
define('pixy/ext/jquery',[ 'jquery', './jquery/form_serializer' ], function($, serializeObject) {
  

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

  $.fn.serializeObject = serializeObject;

  return $;
});
define("route-recognizer", 
  ["exports"],
  function(__exports__) {
    
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];

    var escapeRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');

    function isArray(test) {
      return Object.prototype.toString.call(test) === "[object Array]";
    }

    // A Segment represents a segment in the original route description.
    // Each Segment type provides an `eachChar` and `regex` method.
    //
    // The `eachChar` method invokes the callback with one or more character
    // specifications. A character specification consumes one or more input
    // characters.
    //
    // The `regex` method returns a regex fragment for the segment. If the
    // segment is a dynamic of star segment, the regex fragment also includes
    // a capture.
    //
    // A character specification contains:
    //
    // * `validChars`: a String with a list of all valid characters, or
    // * `invalidChars`: a String with a list of all invalid characters
    // * `repeat`: true if the character specification can repeat

    function StaticSegment(string) { this.string = string; }
    StaticSegment.prototype = {
      eachChar: function(callback) {
        var string = this.string, ch;

        for (var i=0, l=string.length; i<l; i++) {
          ch = string.charAt(i);
          callback({ validChars: ch });
        }
      },

      regex: function() {
        return this.string.replace(escapeRegex, '\\$1');
      },

      generate: function() {
        return this.string;
      }
    };

    function DynamicSegment(name) { this.name = name; }
    DynamicSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "/", repeat: true });
      },

      regex: function() {
        return "([^/]+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function StarSegment(name) { this.name = name; }
    StarSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "", repeat: true });
      },

      regex: function() {
        return "(.+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function EpsilonSegment() {}
    EpsilonSegment.prototype = {
      eachChar: function() {},
      regex: function() { return ""; },
      generate: function() { return ""; }
    };

    function parse(route, names, types) {
      // normalize route as not starting with a "/". Recognition will
      // also normalize.
      if (route.charAt(0) === "/") { route = route.substr(1); }

      var segments = route.split("/"), results = [];

      for (var i=0, l=segments.length; i<l; i++) {
        var segment = segments[i], match;

        if (match = segment.match(/^:([^\/]+)$/)) {
          results.push(new DynamicSegment(match[1]));
          names.push(match[1]);
          types.dynamics++;
        } else if (match = segment.match(/^\*([^\/]+)$/)) {
          results.push(new StarSegment(match[1]));
          names.push(match[1]);
          types.stars++;
        } else if(segment === "") {
          results.push(new EpsilonSegment());
        } else {
          results.push(new StaticSegment(segment));
          types.statics++;
        }
      }

      return results;
    }

    // A State has a character specification and (`charSpec`) and a list of possible
    // subsequent states (`nextStates`).
    //
    // If a State is an accepting state, it will also have several additional
    // properties:
    //
    // * `regex`: A regular expression that is used to extract parameters from paths
    //   that reached this accepting state.
    // * `handlers`: Information on how to convert the list of captures into calls
    //   to registered handlers with the specified parameters
    // * `types`: How many static, dynamic or star segments in this route. Used to
    //   decide which route to use if multiple registered routes match a path.
    //
    // Currently, State is implemented naively by looping over `nextStates` and
    // comparing a character specification against a character. A more efficient
    // implementation would use a hash of keys pointing at one or more next states.

    function State(charSpec) {
      this.charSpec = charSpec;
      this.nextStates = [];
    }

    State.prototype = {
      get: function(charSpec) {
        var nextStates = this.nextStates;

        for (var i=0, l=nextStates.length; i<l; i++) {
          var child = nextStates[i];

          var isEqual = child.charSpec.validChars === charSpec.validChars;
          isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;

          if (isEqual) { return child; }
        }
      },

      put: function(charSpec) {
        var state;

        // If the character specification already exists in a child of the current
        // state, just return that state.
        if (state = this.get(charSpec)) { return state; }

        // Make a new state for the character spec
        state = new State(charSpec);

        // Insert the new state as a child of the current state
        this.nextStates.push(state);

        // If this character specification repeats, insert the new state as a child
        // of itself. Note that this will not trigger an infinite loop because each
        // transition during recognition consumes a character.
        if (charSpec.repeat) {
          state.nextStates.push(state);
        }

        // Return the new state
        return state;
      },

      // Find a list of child states matching the next character
      match: function(ch) {
        // DEBUG "Processing `" + ch + "`:"
        var nextStates = this.nextStates,
            child, charSpec, chars;

        // DEBUG "  " + debugState(this)
        var returned = [];

        for (var i=0, l=nextStates.length; i<l; i++) {
          child = nextStates[i];

          charSpec = child.charSpec;

          if (typeof (chars = charSpec.validChars) !== 'undefined') {
            if (chars.indexOf(ch) !== -1) { returned.push(child); }
          } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
            if (chars.indexOf(ch) === -1) { returned.push(child); }
          }
        }

        return returned;
      }

      /** IF DEBUG
      , debug: function() {
        var charSpec = this.charSpec,
            debug = "[",
            chars = charSpec.validChars || charSpec.invalidChars;

        if (charSpec.invalidChars) { debug += "^"; }
        debug += chars;
        debug += "]";

        if (charSpec.repeat) { debug += "+"; }

        return debug;
      }
      END IF **/
    };

    /** IF DEBUG
    function debug(log) {
      console.log(log);
    }

    function debugState(state) {
      return state.nextStates.map(function(n) {
        if (n.nextStates.length === 0) { return "( " + n.debug() + " [accepting] )"; }
        return "( " + n.debug() + " <then> " + n.nextStates.map(function(s) { return s.debug() }).join(" or ") + " )";
      }).join(", ")
    }
    END IF **/

    // This is a somewhat naive strategy, but should work in a lot of cases
    // A better strategy would properly resolve /posts/:id/new and /posts/edit/:id.
    //
    // This strategy generally prefers more static and less dynamic matching.
    // Specifically, it
    //
    //  * prefers fewer stars to more, then
    //  * prefers using stars for less of the match to more, then
    //  * prefers fewer dynamic segments to more, then
    //  * prefers more static segments to more
    function sortSolutions(states) {
      return states.sort(function(a, b) {
        if (a.types.stars !== b.types.stars) { return a.types.stars - b.types.stars; }

        if (a.types.stars) {
          if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }
          if (a.types.dynamics !== b.types.dynamics) { return b.types.dynamics - a.types.dynamics; }
        }

        if (a.types.dynamics !== b.types.dynamics) { return a.types.dynamics - b.types.dynamics; }
        if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }

        return 0;
      });
    }

    function recognizeChar(states, ch) {
      var nextStates = [];

      for (var i=0, l=states.length; i<l; i++) {
        var state = states[i];

        nextStates = nextStates.concat(state.match(ch));
      }

      return nextStates;
    }

    var oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };

    function RecognizeResults(queryParams) {
      this.queryParams = queryParams || {};
    }
    RecognizeResults.prototype = oCreate({
      splice: Array.prototype.splice,
      slice:  Array.prototype.slice,
      push:   Array.prototype.push,
      length: 0,
      queryParams: null
    });

    function findHandler(state, path, queryParams) {
      var handlers = state.handlers, regex = state.regex;
      var captures = path.match(regex), currentCapture = 1;
      var result = new RecognizeResults(queryParams);

      for (var i=0, l=handlers.length; i<l; i++) {
        var handler = handlers[i], names = handler.names, params = {};

        for (var j=0, m=names.length; j<m; j++) {
          params[names[j]] = captures[currentCapture++];
        }

        result.push({ handler: handler.handler, params: params, isDynamic: !!names.length });
      }

      return result;
    }

    function addSegment(currentState, segment) {
      segment.eachChar(function(ch) {
        var state;

        currentState = currentState.put(ch);
      });

      return currentState;
    }

    // The main interface

    var RouteRecognizer = function() {
      this.rootState = new State();
      this.names = {};
    };


    RouteRecognizer.prototype = {
      add: function(routes, options) {
        var currentState = this.rootState, regex = "^",
            types = { statics: 0, dynamics: 0, stars: 0 },
            handlers = [], allSegments = [], name;

        var isEmpty = true;

        for (var i=0, l=routes.length; i<l; i++) {
          var route = routes[i], names = [];

          var segments = parse(route.path, names, types);

          allSegments = allSegments.concat(segments);

          for (var j=0, m=segments.length; j<m; j++) {
            var segment = segments[j];

            if (segment instanceof EpsilonSegment) { continue; }

            isEmpty = false;

            // Add a "/" for the new segment
            currentState = currentState.put({ validChars: "/" });
            regex += "/";

            // Add a representation of the segment to the NFA and regex
            currentState = addSegment(currentState, segment);
            regex += segment.regex();
          }

          var handler = { handler: route.handler, names: names };
          handlers.push(handler);
        }

        if (isEmpty) {
          currentState = currentState.put({ validChars: "/" });
          regex += "/";
        }

        currentState.handlers = handlers;
        currentState.regex = new RegExp(regex + "$");
        currentState.types = types;

        if (name = options && options.as) {
          this.names[name] = {
            segments: allSegments,
            handlers: handlers
          };
        }
      },

      handlersFor: function(name) {
        var route = this.names[name], result = [];
        if (!route) { throw new Error("There is no route named " + name); }

        for (var i=0, l=route.handlers.length; i<l; i++) {
          result.push(route.handlers[i]);
        }

        return result;
      },

      hasRoute: function(name) {
        return !!this.names[name];
      },

      generate: function(name, params) {
        var route = this.names[name], output = "";
        if (!route) { throw new Error("There is no route named " + name); }

        var segments = route.segments;

        for (var i=0, l=segments.length; i<l; i++) {
          var segment = segments[i];

          if (segment instanceof EpsilonSegment) { continue; }

          output += "/";
          output += segment.generate(params);
        }

        if (output.charAt(0) !== '/') { output = '/' + output; }

        if (params && params.queryParams) {
          output += this.generateQueryString(params.queryParams, route.handlers);
        }

        return output;
      },

      generateQueryString: function(params, handlers) {
        var pairs = [];
        var keys = [];
        for(var key in params) {
          if (params.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        keys.sort();
        for (var i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          var value = params[key];
          if (value == null) {
            continue;
          }
          var pair = key;
          if (isArray(value)) {
            for (var j = 0, l = value.length; j < l; j++) {
              var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
              pairs.push(arrayPair);
            }
          } else {
            pair += "=" + encodeURIComponent(value);
            pairs.push(pair);
          }
        }

        if (pairs.length === 0) { return ''; }

        return "?" + pairs.join("&");
      },

      parseQueryString: function(queryString) {
        var pairs = queryString.split("&"), queryParams = {};
        for(var i=0; i < pairs.length; i++) {
          var pair      = pairs[i].split('='),
              key       = decodeURIComponent(pair[0]),
              keyLength = key.length,
              isArray = false,
              value;
          if (pair.length === 1) {
            value = 'true';
          } else {
            //Handle arrays
            if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
              isArray = true;
              key = key.slice(0, keyLength - 2);
              if(!queryParams[key]) {
                queryParams[key] = [];
              }
            }
            value = pair[1] ? decodeURIComponent(pair[1]) : '';
          }
          if (isArray) {
            queryParams[key].push(value);
          } else {
            queryParams[key] = decodeURIComponent(value);
          }
        }
        return queryParams;
      },

      recognize: function(path) {
        var states = [ this.rootState ],
            pathLen, i, l, queryStart, queryParams = {},
            isSlashDropped = false;

        path = decodeURI(path);

        queryStart = path.indexOf('?');
        if (queryStart !== -1) {
          var queryString = path.substr(queryStart + 1, path.length);
          path = path.substr(0, queryStart);
          queryParams = this.parseQueryString(queryString);
        }

        // DEBUG GROUP path

        if (path.charAt(0) !== "/") { path = "/" + path; }

        pathLen = path.length;
        if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
          path = path.substr(0, pathLen - 1);
          isSlashDropped = true;
        }

        for (i=0, l=path.length; i<l; i++) {
          states = recognizeChar(states, path.charAt(i));
          if (!states.length) { break; }
        }

        // END DEBUG GROUP

        var solutions = [];
        for (i=0, l=states.length; i<l; i++) {
          if (states[i].handlers) { solutions.push(states[i]); }
        }

        states = sortSolutions(solutions);

        var state = solutions[0];

        if (state && state.handlers) {
          // if a trailing slash was dropped and a star segment is the last segment
          // specified, put the trailing slash back
          if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
            path = path + "/";
          }
          return findHandler(state, path, queryParams);
        }
      }
    };

    __exports__["default"] = RouteRecognizer;

    function Target(path, matcher, delegate) {
      this.path = path;
      this.matcher = matcher;
      this.delegate = delegate;
    }

    Target.prototype = {
      to: function(target, callback) {
        var delegate = this.delegate;

        if (delegate && delegate.willAddRoute) {
          target = delegate.willAddRoute(this.matcher.target, target);
        }

        this.matcher.add(this.path, target);

        if (callback) {
          if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
          this.matcher.addChild(this.path, target, callback, this.delegate);
        }
        return this;
      }
    };

    function Matcher(target) {
      this.routes = {};
      this.children = {};
      this.target = target;
    }

    Matcher.prototype = {
      add: function(path, handler) {
        this.routes[path] = handler;
      },

      addChild: function(path, target, callback, delegate) {
        var matcher = new Matcher(target);
        this.children[path] = matcher;

        var match = generateMatch(path, matcher, delegate);

        if (delegate && delegate.contextEntered) {
          delegate.contextEntered(target, match);
        }

        callback(match);
      }
    };

    function generateMatch(startingPath, matcher, delegate) {
      return function(path, nestedCallback) {
        var fullPath = startingPath + path;

        if (nestedCallback) {
          nestedCallback(generateMatch(fullPath, matcher, delegate));
        } else {
          return new Target(startingPath + path, matcher, delegate);
        }
      };
    }

    function addRoute(routeArray, path, handler) {
      var len = 0;
      for (var i=0, l=routeArray.length; i<l; i++) {
        len += routeArray[i].path.length;
      }

      path = path.substr(len);
      var route = { path: path, handler: handler };
      routeArray.push(route);
    }

    function eachRoute(baseRoute, matcher, callback, binding) {
      var routes = matcher.routes;

      for (var path in routes) {
        if (routes.hasOwnProperty(path)) {
          var routeArray = baseRoute.slice();
          addRoute(routeArray, path, routes[path]);

          if (matcher.children[path]) {
            eachRoute(routeArray, matcher.children[path], callback, binding);
          } else {
            callback.call(binding, routeArray);
          }
        }
      }
    }

    RouteRecognizer.prototype.map = function(callback, addRouteCallback) {
      var matcher = new Matcher();

      callback(generateMatch("", matcher, this.delegate));

      eachRoute([], matcher, function(route) {
        if (addRouteCallback) { addRouteCallback(this, route); }
        else { this.add(route); }
      }, this);
    };
  });

define("router/handler-info",
  ["./utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    var bind = __dependency1__.bind;
    var merge = __dependency1__.merge;
    var serialize = __dependency1__.serialize;
    var promiseLabel = __dependency1__.promiseLabel;
    var applyHook = __dependency1__.applyHook;
    var Promise = __dependency2__["default"];

    function HandlerInfo(_props) {
      var props = _props || {};
      merge(this, props);
      this.initialize(props);
    }

    HandlerInfo.prototype = {
      name: null,
      handler: null,
      params: null,
      context: null,

      // Injected by the handler info factory.
      factory: null,

      initialize: function() {},

      log: function(payload, message) {
        if (payload.log) {
          payload.log(this.name + ': ' + message);
        }
      },

      promiseLabel: function(label) {
        return promiseLabel("'" + this.name + "' " + label);
      },

      getUnresolved: function() {
        return this;
      },

      serialize: function() {
        return this.params || {};
      },

      resolve: function(shouldContinue, payload) {
        var checkForAbort  = bind(this, this.checkForAbort,      shouldContinue),
            beforeModel    = bind(this, this.runBeforeModelHook, payload),
            model          = bind(this, this.getModel,           payload),
            afterModel     = bind(this, this.runAfterModelHook,  payload),
            becomeResolved = bind(this, this.becomeResolved,     payload);

        return Promise.resolve(undefined, this.promiseLabel("Start handler"))
               .then(checkForAbort, null, this.promiseLabel("Check for abort"))
               .then(beforeModel, null, this.promiseLabel("Before model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted during 'beforeModel' hook"))
               .then(model, null, this.promiseLabel("Model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted in 'model' hook"))
               .then(afterModel, null, this.promiseLabel("After model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted in 'afterModel' hook"))
               .then(becomeResolved, null, this.promiseLabel("Become resolved"));
      },

      runBeforeModelHook: function(payload) {
        if (payload.trigger) {
          payload.trigger(true, 'willResolveModel', payload, this.handler);
        }
        return this.runSharedModelHook(payload, 'beforeModel', []);
      },

      runAfterModelHook: function(payload, resolvedModel) {
        // Stash the resolved model on the payload.
        // This makes it possible for users to swap out
        // the resolved model in afterModel.
        var name = this.name;
        this.stashResolvedModel(payload, resolvedModel);

        return this.runSharedModelHook(payload, 'afterModel', [resolvedModel])
                   .then(function() {
                     // Ignore the fulfilled value returned from afterModel.
                     // Return the value stashed in resolvedModels, which
                     // might have been swapped out in afterModel.
                     return payload.resolvedModels[name];
                   }, null, this.promiseLabel("Ignore fulfillment value and return model value"));
      },

      runSharedModelHook: function(payload, hookName, args) {
        this.log(payload, "calling " + hookName + " hook");

        if (this.queryParams) {
          args.push(this.queryParams);
        }
        args.push(payload);

        var result = applyHook(this.handler, hookName, args);

        if (result && result.isTransition) {
          result = null;
        }

        return Promise.resolve(result, this.promiseLabel("Resolve value returned from one of the model hooks"));
      },

      // overridden by subclasses
      getModel: null,

      checkForAbort: function(shouldContinue, promiseValue) {
        return Promise.resolve(shouldContinue(), this.promiseLabel("Check for abort")).then(function() {
          // We don't care about shouldContinue's resolve value;
          // pass along the original value passed to this fn.
          return promiseValue;
        }, null, this.promiseLabel("Ignore fulfillment value and continue"));
      },

      stashResolvedModel: function(payload, resolvedModel) {
        payload.resolvedModels = payload.resolvedModels || {};
        payload.resolvedModels[this.name] = resolvedModel;
      },

      becomeResolved: function(payload, resolvedContext) {
        var params = this.serialize(resolvedContext);

        if (payload) {
          this.stashResolvedModel(payload, resolvedContext);
          payload.params = payload.params || {};
          payload.params[this.name] = params;
        }

        return this.factory('resolved', {
          context: resolvedContext,
          name: this.name,
          handler: this.handler,
          params: params
        });
      },

      shouldSupercede: function(other) {
        // Prefer this newer handlerInfo over `other` if:
        // 1) The other one doesn't exist
        // 2) The names don't match
        // 3) This handler has a context that doesn't match
        //    the other one (or the other one doesn't have one).
        // 4) This handler has parameters that don't match the other.
        if (!other) { return true; }

        var contextsMatch = (other.context === this.context);
        return other.name !== this.name ||
               (this.hasOwnProperty('context') && !contextsMatch) ||
               (this.hasOwnProperty('params') && !paramsMatch(this.params, other.params));
      }
    };

    function paramsMatch(a, b) {
      if ((!a) ^ (!b)) {
        // Only one is null.
        return false;
      }

      if (!a) {
        // Both must be null.
        return true;
      }

      // Note: this assumes that both params have the same
      // number of keys, but since we're comparing the
      // same handlers, they should.
      for (var k in a) {
        if (a.hasOwnProperty(k) && a[k] !== b[k]) {
          return false;
        }
      }
      return true;
    }

    __exports__["default"] = HandlerInfo;
  });
define("router/handler-info/factory",
  ["router/handler-info/resolved-handler-info","router/handler-info/unresolved-handler-info-by-object","router/handler-info/unresolved-handler-info-by-param","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var ResolvedHandlerInfo = __dependency1__["default"];
    var UnresolvedHandlerInfoByObject = __dependency2__["default"];
    var UnresolvedHandlerInfoByParam = __dependency3__["default"];

    handlerInfoFactory.klasses = {
      resolved: ResolvedHandlerInfo,
      param: UnresolvedHandlerInfoByParam,
      object: UnresolvedHandlerInfoByObject
    };

    function handlerInfoFactory(name, props) {
      var Ctor = handlerInfoFactory.klasses[name],
          handlerInfo = new Ctor(props || {});
      handlerInfo.factory = handlerInfoFactory;
      return handlerInfo;
    }

    __exports__["default"] = handlerInfoFactory;
  });
define("router/handler-info/resolved-handler-info",
  ["../handler-info","router/utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var HandlerInfo = __dependency1__["default"];
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;
    var Promise = __dependency3__["default"];

    var ResolvedHandlerInfo = subclass(HandlerInfo, {
      resolve: function(shouldContinue, payload) {
        // A ResolvedHandlerInfo just resolved with itself.
        if (payload && payload.resolvedModels) {
          payload.resolvedModels[this.name] = this.context;
        }
        return Promise.resolve(this, this.promiseLabel("Resolve"));
      },

      getUnresolved: function() {
        return this.factory('param', {
          name: this.name,
          handler: this.handler,
          params: this.params
        });
      },

      isResolved: true
    });

    __exports__["default"] = ResolvedHandlerInfo;
  });
define("router/handler-info/unresolved-handler-info-by-object",
  ["../handler-info","router/utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var HandlerInfo = __dependency1__["default"];
    var merge = __dependency2__.merge;
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;
    var isParam = __dependency2__.isParam;
    var Promise = __dependency3__["default"];

    var UnresolvedHandlerInfoByObject = subclass(HandlerInfo, {
      getModel: function(payload) {
        this.log(payload, this.name + ": resolving provided model");
        return Promise.resolve(this.context);
      },

      initialize: function(props) {
        this.names = props.names || [];
        this.context = props.context;
      },

      /**
        @private

        Serializes a handler using its custom `serialize` method or
        by a default that looks up the expected property name from
        the dynamic segment.

        @param {Object} model the model to be serialized for this handler
      */
      serialize: function(_model) {
        var model = _model || this.context,
            names = this.names,
            handler = this.handler;

        var object = {};
        if (isParam(model)) {
          object[names[0]] = model;
          return object;
        }

        // Use custom serialize if it exists.
        if (handler.serialize) {
          return handler.serialize(model, names);
        }

        if (names.length !== 1) { return; }

        var name = names[0];

        if (/_id$/.test(name)) {
          object[name] = model.id;
        } else {
          object[name] = model;
        }
        return object;
      }
    });

    __exports__["default"] = UnresolvedHandlerInfoByObject;
  });
define("router/handler-info/unresolved-handler-info-by-param",
  ["../handler-info","router/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    var HandlerInfo = __dependency1__["default"];
    var resolveHook = __dependency2__.resolveHook;
    var merge = __dependency2__.merge;
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;

    // Generated by URL transitions and non-dynamic route segments in named Transitions.
    var UnresolvedHandlerInfoByParam = subclass (HandlerInfo, {
      initialize: function(props) {
        this.params = props.params || {};
      },

      getModel: function(payload) {
        var fullParams = this.params;
        if (payload && payload.queryParams) {
          fullParams = {};
          merge(fullParams, this.params);
          fullParams.queryParams = payload.queryParams;
        }

        var handler = this.handler;
        var hookName = resolveHook(handler, 'deserialize') ||
                       resolveHook(handler, 'model');

        return this.runSharedModelHook(payload, hookName, [fullParams]);
      }
    });

    __exports__["default"] = UnresolvedHandlerInfoByParam;
  });
define("router/router",
  ["route-recognizer","rsvp/promise","./utils","./transition-state","./transition","./transition-intent/named-transition-intent","./transition-intent/url-transition-intent","./handler-info","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    
    var RouteRecognizer = __dependency1__["default"];
    var Promise = __dependency2__["default"];
    var trigger = __dependency3__.trigger;
    var log = __dependency3__.log;
    var slice = __dependency3__.slice;
    var forEach = __dependency3__.forEach;
    var merge = __dependency3__.merge;
    var serialize = __dependency3__.serialize;
    var extractQueryParams = __dependency3__.extractQueryParams;
    var getChangelist = __dependency3__.getChangelist;
    var promiseLabel = __dependency3__.promiseLabel;
    var callHook = __dependency3__.callHook;
    var TransitionState = __dependency4__["default"];
    var logAbort = __dependency5__.logAbort;
    var Transition = __dependency5__.Transition;
    var TransitionAborted = __dependency5__.TransitionAborted;
    var NamedTransitionIntent = __dependency6__["default"];
    var URLTransitionIntent = __dependency7__["default"];
    var ResolvedHandlerInfo = __dependency8__.ResolvedHandlerInfo;

    var pop = Array.prototype.pop;

    function Router() {
      this.recognizer = new RouteRecognizer();
      this.reset();
    }

    function getTransitionByIntent(intent, isIntermediate) {
      var wasTransitioning = !!this.activeTransition;
      var oldState = wasTransitioning ? this.activeTransition.state : this.state;
      var newTransition;

      var newState = intent.applyToState(oldState, this.recognizer, this.getHandler, isIntermediate);
      var queryParamChangelist = getChangelist(oldState.queryParams, newState.queryParams);

      if (handlerInfosEqual(newState.handlerInfos, oldState.handlerInfos)) {

        // This is a no-op transition. See if query params changed.
        if (queryParamChangelist) {
          newTransition = this.queryParamsTransition(queryParamChangelist, wasTransitioning, oldState, newState);
          if (newTransition) {
            return newTransition;
          }
        }

        // No-op. No need to create a new transition.
        return new Transition(this);
      }

      if (isIntermediate) {
        setupContexts(this, newState);
        return;
      }

      // Create a new transition to the destination route.
      newTransition = new Transition(this, intent, newState);

      // Abort and usurp any previously active transition.
      if (this.activeTransition) {
        this.activeTransition.abort();
      }
      this.activeTransition = newTransition;

      // Transition promises by default resolve with resolved state.
      // For our purposes, swap out the promise to resolve
      // after the transition has been finalized.
      newTransition.promise = newTransition.promise.then(function(result) {
        return finalizeTransition(newTransition, result.state);
      }, null, promiseLabel("Settle transition promise when transition is finalized"));

      if (!wasTransitioning) {
        notifyExistingHandlers(this, newState, newTransition);
      }

      fireQueryParamDidChange(this, newState, queryParamChangelist);

      return newTransition;
    }

    Router.prototype = {

      /**
        The main entry point into the router. The API is essentially
        the same as the `map` method in `route-recognizer`.

        This method extracts the String handler at the last `.to()`
        call and uses it as the name of the whole route.

        @param {Function} callback
      */
      map: function(callback) {
        this.recognizer.delegate = this.delegate;

        this.recognizer.map(callback, function(recognizer, routes) {
          for (var i = routes.length - 1, proceed = true; i >= 0 && proceed; --i) {
            var route = routes[i];
            recognizer.add(routes, { as: route.handler });
            proceed = route.path === '/' || route.path === '' || route.handler.slice(-6) === '.index';
          }
        });
      },

      hasRoute: function(route) {
        return this.recognizer.hasRoute(route);
      },

      queryParamsTransition: function(changelist, wasTransitioning, oldState, newState) {
        var router = this;

        fireQueryParamDidChange(this, newState, changelist);

        if (!wasTransitioning && this.activeTransition) {
          // One of the handlers in queryParamsDidChange
          // caused a transition. Just return that transition.
          return this.activeTransition;
        } else {
          // Running queryParamsDidChange didn't change anything.
          // Just update query params and be on our way.

          // We have to return a noop transition that will
          // perform a URL update at the end. This gives
          // the user the ability to set the url update
          // method (default is replaceState).
          var newTransition = new Transition(this);
          newTransition.queryParamsOnly = true;

          oldState.queryParams = finalizeQueryParamChange(this, newState.handlerInfos, newState.queryParams, newTransition);

          newTransition.promise = newTransition.promise.then(function(result) {
            updateURL(newTransition, oldState, true);
            if (router.didTransition) {
              router.didTransition(router.currentHandlerInfos);
            }
            return result;
          }, null, promiseLabel("Transition complete"));
          return newTransition;
        }
      },

      // NOTE: this doesn't really belong here, but here
      // it shall remain until our ES6 transpiler can
      // handle cyclical deps.
      transitionByIntent: function(intent, isIntermediate) {
        try {
          return getTransitionByIntent.apply(this, arguments);
        } catch(e) {
          return new Transition(this, intent, null, e);
        }
      },

      /**
        Clears the current and target route handlers and triggers exit
        on each of them starting at the leaf and traversing up through
        its ancestors.
      */
      reset: function() {
        if (this.state) {
          forEach(this.state.handlerInfos.slice().reverse(), function(handlerInfo) {
            var handler = handlerInfo.handler;
            callHook(handler, 'exit');
          });
        }

        this.state = new TransitionState();
        this.currentHandlerInfos = null;
      },

      activeTransition: null,

      /**
        var handler = handlerInfo.handler;
        The entry point for handling a change to the URL (usually
        via the back and forward button).

        Returns an Array of handlers and the parameters associated
        with those parameters.

        @param {String} url a URL to process

        @return {Array} an Array of `[handler, parameter]` tuples
      */
      handleURL: function(url) {
        // Perform a URL-based transition, but don't change
        // the URL afterward, since it already happened.
        var args = slice.call(arguments);
        if (url.charAt(0) !== '/') { args[0] = '/' + url; }

        return doTransition(this, args).method(null);
      },

      /**
        Hook point for updating the URL.

        @param {String} url a URL to update to
      */
      updateURL: function() {
        throw new Error("updateURL is not implemented");
      },

      /**
        Hook point for replacing the current URL, i.e. with replaceState

        By default this behaves the same as `updateURL`

        @param {String} url a URL to update to
      */
      replaceURL: function(url) {
        this.updateURL(url);
      },

      /**
        Transition into the specified named route.

        If necessary, trigger the exit callback on any handlers
        that are no longer represented by the target route.

        @param {String} name the name of the route
      */
      transitionTo: function(name) {
        return doTransition(this, arguments);
      },

      intermediateTransitionTo: function(name) {
        return doTransition(this, arguments, true);
      },

      refresh: function(pivotHandler) {
        var state = this.activeTransition ? this.activeTransition.state : this.state;
        var handlerInfos = state.handlerInfos;
        var params = {};
        for (var i = 0, len = handlerInfos.length; i < len; ++i) {
          var handlerInfo = handlerInfos[i];
          params[handlerInfo.name] = handlerInfo.params || {};
        }

        log(this, "Starting a refresh transition");
        var intent = new NamedTransitionIntent({
          name: handlerInfos[handlerInfos.length - 1].name,
          pivotHandler: pivotHandler || handlerInfos[0].handler,
          contexts: [], // TODO collect contexts...?
          queryParams: this._changedQueryParams || state.queryParams || {}
        });

        return this.transitionByIntent(intent, false);
      },

      /**
        Identical to `transitionTo` except that the current URL will be replaced
        if possible.

        This method is intended primarily for use with `replaceState`.

        @param {String} name the name of the route
      */
      replaceWith: function(name) {
        return doTransition(this, arguments).method('replace');
      },

      /**
        Take a named route and context objects and generate a
        URL.

        @param {String} name the name of the route to generate
          a URL for
        @param {...Object} objects a list of objects to serialize

        @return {String} a URL
      */
      generate: function(handlerName) {

        var partitionedArgs = extractQueryParams(slice.call(arguments, 1)),
          suppliedParams = partitionedArgs[0],
          queryParams = partitionedArgs[1];

        // Construct a TransitionIntent with the provided params
        // and apply it to the present state of the router.
        var intent = new NamedTransitionIntent({ name: handlerName, contexts: suppliedParams });
        var state = intent.applyToState(this.state, this.recognizer, this.getHandler);
        var params = {};

        for (var i = 0, len = state.handlerInfos.length; i < len; ++i) {
          var handlerInfo = state.handlerInfos[i];
          var handlerParams = handlerInfo.serialize();
          merge(params, handlerParams);
        }
        params.queryParams = queryParams;

        return this.recognizer.generate(handlerName, params);
      },

      applyIntent: function(handlerName, contexts) {
        var intent = new NamedTransitionIntent({
          name: handlerName,
          contexts: contexts
        });

        var state = this.activeTransition && this.activeTransition.state || this.state;
        return intent.applyToState(state, this.recognizer, this.getHandler);
      },

      isActiveIntent: function(handlerName, contexts, queryParams) {
        var targetHandlerInfos = this.state.handlerInfos,
            found = false, names, object, handlerInfo, handlerObj, i, len;

        if (!targetHandlerInfos.length) { return false; }

        var targetHandler = targetHandlerInfos[targetHandlerInfos.length - 1].name;
        var recogHandlers = this.recognizer.handlersFor(targetHandler);

        var index = 0;
        for (len = recogHandlers.length; index < len; ++index) {
          handlerInfo = targetHandlerInfos[index];
          if (handlerInfo.name === handlerName) { break; }
        }

        if (index === recogHandlers.length) {
          // The provided route name isn't even in the route hierarchy.
          return false;
        }

        var state = new TransitionState();
        state.handlerInfos = targetHandlerInfos.slice(0, index + 1);
        recogHandlers = recogHandlers.slice(0, index + 1);

        var intent = new NamedTransitionIntent({
          name: targetHandler,
          contexts: contexts
        });

        var newState = intent.applyToHandlers(state, recogHandlers, this.getHandler, targetHandler, true, true);

        var handlersEqual = handlerInfosEqual(newState.handlerInfos, state.handlerInfos);
        if (!queryParams || !handlersEqual) {
          return handlersEqual;
        }

        // Get a hash of QPs that will still be active on new route
        var activeQPsOnNewHandler = {};
        merge(activeQPsOnNewHandler, queryParams);

        var activeQueryParams  = this.state.queryParams;
        for (var key in activeQueryParams) {
          if (activeQueryParams.hasOwnProperty(key) &&
              activeQPsOnNewHandler.hasOwnProperty(key)) {
            activeQPsOnNewHandler[key] = activeQueryParams[key];
          }
        }

        return handlersEqual && !getChangelist(activeQPsOnNewHandler, queryParams);
      },

      isActive: function(handlerName) {
        var partitionedArgs = extractQueryParams(slice.call(arguments, 1));
        return this.isActiveIntent(handlerName, partitionedArgs[0], partitionedArgs[1]);
      },

      trigger: function(name) {
        var args = slice.call(arguments);
        trigger(this, this.currentHandlerInfos, false, args);
      },

      /**
        Hook point for logging transition status updates.

        @param {String} message The message to log.
      */
      log: null,

      _willChangeContextEvent: 'willChangeContext',
      _triggerWillChangeContext: function(handlerInfos, newTransition) {
        trigger(this, handlerInfos, true, [this._willChangeContextEvent, newTransition]);
      },

      _triggerWillLeave: function(handlerInfos, newTransition, leavingChecker) {
        trigger(this, handlerInfos, true, ['willLeave', newTransition, leavingChecker]);
      }
    };

    /**
      @private

      Fires queryParamsDidChange event
    */
    function fireQueryParamDidChange(router, newState, queryParamChangelist) {
      // If queryParams changed trigger event
      if (queryParamChangelist) {

        // This is a little hacky but we need some way of storing
        // changed query params given that no activeTransition
        // is guaranteed to have occurred.
        router._changedQueryParams = queryParamChangelist.all;
        trigger(router, newState.handlerInfos, true, ['queryParamsDidChange', queryParamChangelist.changed, queryParamChangelist.all, queryParamChangelist.removed]);
        router._changedQueryParams = null;
      }
    }

    /**
      @private

      Takes an Array of `HandlerInfo`s, figures out which ones are
      exiting, entering, or changing contexts, and calls the
      proper handler hooks.

      For example, consider the following tree of handlers. Each handler is
      followed by the URL segment it handles.

      ```
      |~index ("/")
      | |~posts ("/posts")
      | | |-showPost ("/:id")
      | | |-newPost ("/new")
      | | |-editPost ("/edit")
      | |~about ("/about/:id")
      ```

      Consider the following transitions:

      1. A URL transition to `/posts/1`.
         1. Triggers the `*model` callbacks on the
            `index`, `posts`, and `showPost` handlers
         2. Triggers the `enter` callback on the same
         3. Triggers the `setup` callback on the same
      2. A direct transition to `newPost`
         1. Triggers the `exit` callback on `showPost`
         2. Triggers the `enter` callback on `newPost`
         3. Triggers the `setup` callback on `newPost`
      3. A direct transition to `about` with a specified
         context object
         1. Triggers the `exit` callback on `newPost`
            and `posts`
         2. Triggers the `serialize` callback on `about`
         3. Triggers the `enter` callback on `about`
         4. Triggers the `setup` callback on `about`

      @param {Router} transition
      @param {TransitionState} newState
    */
    function setupContexts(router, newState, transition) {
      var partition = partitionHandlers(router.state, newState);

      forEach(partition.exited, function(handlerInfo) {
        var handler = handlerInfo.handler;
        delete handler.context;

        callHook(handler, 'reset', true, transition);
        callHook(handler, 'exit', transition);
      });

      var oldState = router.oldState = router.state;
      router.state = newState;
      var currentHandlerInfos = router.currentHandlerInfos = partition.unchanged.slice();

      try {
        forEach(partition.reset, function(handlerInfo) {
          var handler = handlerInfo.handler;
          callHook(handler, 'reset', false, transition);
        });

        forEach(partition.updatedContext, function(handlerInfo) {
          return handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, false, transition);
        });

        forEach(partition.entered, function(handlerInfo) {
          return handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, true, transition);
        });
      } catch(e) {
        router.state = oldState;
        router.currentHandlerInfos = oldState.handlerInfos;
        throw e;
      }

      router.state.queryParams = finalizeQueryParamChange(router, currentHandlerInfos, newState.queryParams, transition);
    }


    /**
      @private

      Helper method used by setupContexts. Handles errors or redirects
      that may happen in enter/setup.
    */
    function handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, enter, transition) {

      var handler = handlerInfo.handler,
          context = handlerInfo.context;

      if (enter) {
        callHook(handler, 'enter', transition);
      }
      if (transition && transition.isAborted) {
        throw new TransitionAborted();
      }

      handler.context = context;
      callHook(handler, 'contextDidChange');

      callHook(handler, 'setup', context, transition);
      if (transition && transition.isAborted) {
        throw new TransitionAborted();
      }

      currentHandlerInfos.push(handlerInfo);

      return true;
    }


    /**
      @private

      This function is called when transitioning from one URL to
      another to determine which handlers are no longer active,
      which handlers are newly active, and which handlers remain
      active but have their context changed.

      Take a list of old handlers and new handlers and partition
      them into four buckets:

      * unchanged: the handler was active in both the old and
        new URL, and its context remains the same
      * updated context: the handler was active in both the
        old and new URL, but its context changed. The handler's
        `setup` method, if any, will be called with the new
        context.
      * exited: the handler was active in the old URL, but is
        no longer active.
      * entered: the handler was not active in the old URL, but
        is now active.

      The PartitionedHandlers structure has four fields:

      * `updatedContext`: a list of `HandlerInfo` objects that
        represent handlers that remain active but have a changed
        context
      * `entered`: a list of `HandlerInfo` objects that represent
        handlers that are newly active
      * `exited`: a list of `HandlerInfo` objects that are no
        longer active.
      * `unchanged`: a list of `HanderInfo` objects that remain active.

      @param {Array[HandlerInfo]} oldHandlers a list of the handler
        information for the previous URL (or `[]` if this is the
        first handled transition)
      @param {Array[HandlerInfo]} newHandlers a list of the handler
        information for the new URL

      @return {Partition}
    */
    function partitionHandlers(oldState, newState) {
      var oldHandlers = oldState.handlerInfos;
      var newHandlers = newState.handlerInfos;

      var handlers = {
            updatedContext: [],
            exited: [],
            entered: [],
            unchanged: []
          };

      var handlerChanged, contextChanged = false, i, l;

      for (i=0, l=newHandlers.length; i<l; i++) {
        var oldHandler = oldHandlers[i], newHandler = newHandlers[i];

        if (!oldHandler || oldHandler.handler !== newHandler.handler) {
          handlerChanged = true;
        }

        if (handlerChanged) {
          handlers.entered.push(newHandler);
          if (oldHandler) { handlers.exited.unshift(oldHandler); }
        } else if (contextChanged || oldHandler.context !== newHandler.context) {
          contextChanged = true;
          handlers.updatedContext.push(newHandler);
        } else {
          handlers.unchanged.push(oldHandler);
        }
      }

      for (i=newHandlers.length, l=oldHandlers.length; i<l; i++) {
        handlers.exited.unshift(oldHandlers[i]);
      }

      handlers.reset = handlers.updatedContext.slice();
      handlers.reset.reverse();

      return handlers;
    }

    function updateURL(transition, state, inputUrl) {
      var urlMethod = transition.urlMethod;

      if (!urlMethod) {
        return;
      }

      var router = transition.router,
          handlerInfos = state.handlerInfos,
          handlerName = handlerInfos[handlerInfos.length - 1].name,
          params = {};

      for (var i = handlerInfos.length - 1; i >= 0; --i) {
        var handlerInfo = handlerInfos[i];
        merge(params, handlerInfo.params);
        if (handlerInfo.handler.inaccessibleByURL) {
          urlMethod = null;
        }
      }

      if (urlMethod) {
        params.queryParams = transition._visibleQueryParams || state.queryParams;
        var url = router.recognizer.generate(handlerName, params);

        if (urlMethod === 'replace') {
          router.replaceURL(url);
        } else {
          router.updateURL(url);
        }
      }
    }

    /**
      @private

      Updates the URL (if necessary) and calls `setupContexts`
      to update the router's array of `currentHandlerInfos`.
     */
    function finalizeTransition(transition, newState) {

      try {
        log(transition.router, transition.sequence, "Resolved all models on destination route; finalizing transition.");

        var router = transition.router,
            handlerInfos = newState.handlerInfos,
            seq = transition.sequence;

        // Run all the necessary enter/setup/exit hooks
        setupContexts(router, newState, transition);

        // Check if a redirect occurred in enter/setup
        if (transition.isAborted) {
          // TODO: cleaner way? distinguish b/w targetHandlerInfos?
          router.state.handlerInfos = router.currentHandlerInfos;
          return Promise.reject(logAbort(transition));
        }

        updateURL(transition, newState, transition.intent.url);

        transition.isActive = false;
        router.activeTransition = null;

        trigger(router, router.currentHandlerInfos, true, ['didTransition']);

        if (router.didTransition) {
          router.didTransition(router.currentHandlerInfos);
        }

        log(router, transition.sequence, "TRANSITION COMPLETE.");

        // Resolve with the final handler.
        return handlerInfos[handlerInfos.length - 1].handler;
      } catch(e) {
        if (!((e instanceof TransitionAborted))) {
          //var erroneousHandler = handlerInfos.pop();
          var infos = transition.state.handlerInfos;
          transition.trigger(true, 'error', e, transition, infos[infos.length-1].handler);
          transition.abort();
        }

        throw e;
      }
    }

    /**
      @private

      Begins and returns a Transition based on the provided
      arguments. Accepts arguments in the form of both URL
      transitions and named transitions.

      @param {Router} router
      @param {Array[Object]} args arguments passed to transitionTo,
        replaceWith, or handleURL
    */
    function doTransition(router, args, isIntermediate) {
      // Normalize blank transitions to root URL transitions.
      var name = args[0] || '/';

      var lastArg = args[args.length-1];
      var queryParams = {};
      if (lastArg && lastArg.hasOwnProperty('queryParams')) {
        queryParams = pop.call(args).queryParams;
      }

      var intent;
      if (args.length === 0) {

        log(router, "Updating query params");

        // A query param update is really just a transition
        // into the route you're already on.
        var handlerInfos = router.state.handlerInfos;
        intent = new NamedTransitionIntent({
          name: handlerInfos[handlerInfos.length - 1].name,
          contexts: [],
          queryParams: queryParams
        });

      } else if (name.charAt(0) === '/') {

        log(router, "Attempting URL transition to " + name);
        intent = new URLTransitionIntent({ url: name });

      } else {

        log(router, "Attempting transition to " + name);
        intent = new NamedTransitionIntent({
          name: args[0],
          contexts: slice.call(args, 1),
          queryParams: queryParams
        });
      }

      return router.transitionByIntent(intent, isIntermediate);
    }

    function handlerInfosEqual(handlerInfos, otherHandlerInfos) {
      if (handlerInfos.length !== otherHandlerInfos.length) {
        return false;
      }

      for (var i = 0, len = handlerInfos.length; i < len; ++i) {
        if (handlerInfos[i] !== otherHandlerInfos[i]) {
          return false;
        }
      }
      return true;
    }

    function finalizeQueryParamChange(router, resolvedHandlers, newQueryParams, transition) {
      // We fire a finalizeQueryParamChange event which
      // gives the new route hierarchy a chance to tell
      // us which query params it's consuming and what
      // their final values are. If a query param is
      // no longer consumed in the final route hierarchy,
      // its serialized segment will be removed
      // from the URL.

      for (var k in newQueryParams) {
        if (newQueryParams.hasOwnProperty(k) &&
            newQueryParams[k] === null) {
          delete newQueryParams[k];
        }
      }

      var finalQueryParamsArray = [];
      trigger(router, resolvedHandlers, true, ['finalizeQueryParamChange', newQueryParams, finalQueryParamsArray, transition]);

      if (transition) {
        transition._visibleQueryParams = {};
      }

      var finalQueryParams = {};
      for (var i = 0, len = finalQueryParamsArray.length; i < len; ++i) {
        var qp = finalQueryParamsArray[i];
        finalQueryParams[qp.key] = qp.value;
        if (transition && qp.visible !== false) {
          transition._visibleQueryParams[qp.key] = qp.value;
        }
      }
      return finalQueryParams;
    }

    function notifyExistingHandlers(router, newState, newTransition) {
      var oldHandlers = router.state.handlerInfos,
          changing = [],
          leavingIndex = null,
          leaving, leavingChecker, i, oldHandlerLen, oldHandler, newHandler;

      oldHandlerLen = oldHandlers.length;
      for (i = 0; i < oldHandlerLen; i++) {
        oldHandler = oldHandlers[i];
        newHandler = newState.handlerInfos[i];

        if (!newHandler || oldHandler.name !== newHandler.name) {
          leavingIndex = i;
          break;
        }

        if (!newHandler.isResolved) {
          changing.push(oldHandler);
        }
      }

      if (leavingIndex !== null) {
        leaving = oldHandlers.slice(leavingIndex, oldHandlerLen);
        leavingChecker = function(name) {
          for (var h = 0, len = leaving.length; h < len; h++) {
            if (leaving[h].name === name) {
              return true;
            }
          }
          return false;
        };

        router._triggerWillLeave(leaving, newTransition, leavingChecker);
      }

      if (changing.length > 0) {
        router._triggerWillChangeContext(changing, newTransition);
      }

      trigger(router, oldHandlers, true, ['willTransition', newTransition]);
    }

    __exports__["default"] = Router;
  });
define("router/transition-intent",
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    
    var merge = __dependency1__.merge;

    function TransitionIntent(props) {
      this.initialize(props);

      // TODO: wat
      this.data = this.data || {};
    }

    TransitionIntent.prototype = {
      initialize: null,
      applyToState: null
    };

    __exports__["default"] = TransitionIntent;
  });
define("router/transition-intent/named-transition-intent",
  ["../transition-intent","../transition-state","../handler-info/factory","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    
    var TransitionIntent = __dependency1__["default"];
    var TransitionState = __dependency2__["default"];
    var handlerInfoFactory = __dependency3__["default"];
    var isParam = __dependency4__.isParam;
    var extractQueryParams = __dependency4__.extractQueryParams;
    var merge = __dependency4__.merge;
    var subclass = __dependency4__.subclass;

    __exports__["default"] = subclass(TransitionIntent, {
      name: null,
      pivotHandler: null,
      contexts: null,
      queryParams: null,

      initialize: function(props) {
        this.name = props.name;
        this.pivotHandler = props.pivotHandler;
        this.contexts = props.contexts || [];
        this.queryParams = props.queryParams;
      },

      applyToState: function(oldState, recognizer, getHandler, isIntermediate) {

        var partitionedArgs     = extractQueryParams([this.name].concat(this.contexts)),
          pureArgs              = partitionedArgs[0],
          queryParams           = partitionedArgs[1],
          handlers              = recognizer.handlersFor(pureArgs[0]);

        var targetRouteName = handlers[handlers.length-1].handler;

        return this.applyToHandlers(oldState, handlers, getHandler, targetRouteName, isIntermediate);
      },

      applyToHandlers: function(oldState, handlers, getHandler, targetRouteName, isIntermediate, checkingIfActive) {

        var i, len;
        var newState = new TransitionState();
        var objects = this.contexts.slice(0);

        var invalidateIndex = handlers.length;

        // Pivot handlers are provided for refresh transitions
        if (this.pivotHandler) {
          for (i = 0, len = handlers.length; i < len; ++i) {
            if (getHandler(handlers[i].handler) === this.pivotHandler) {
              invalidateIndex = i;
              break;
            }
          }
        }

        var pivotHandlerFound = !this.pivotHandler;

        for (i = handlers.length - 1; i >= 0; --i) {
          var result = handlers[i];
          var name = result.handler;
          var handler = getHandler(name);

          var oldHandlerInfo = oldState.handlerInfos[i];
          var newHandlerInfo = null;

          if (result.names.length > 0) {
            if (i >= invalidateIndex) {
              newHandlerInfo = this.createParamHandlerInfo(name, handler, result.names, objects, oldHandlerInfo);
            } else {
              newHandlerInfo = this.getHandlerInfoForDynamicSegment(name, handler, result.names, objects, oldHandlerInfo, targetRouteName, i);
            }
          } else {
            // This route has no dynamic segment.
            // Therefore treat as a param-based handlerInfo
            // with empty params. This will cause the `model`
            // hook to be called with empty params, which is desirable.
            newHandlerInfo = this.createParamHandlerInfo(name, handler, result.names, objects, oldHandlerInfo);
          }

          if (checkingIfActive) {
            // If we're performing an isActive check, we want to
            // serialize URL params with the provided context, but
            // ignore mismatches between old and new context.
            newHandlerInfo = newHandlerInfo.becomeResolved(null, newHandlerInfo.context);
            var oldContext = oldHandlerInfo && oldHandlerInfo.context;
            if (result.names.length > 0 && newHandlerInfo.context === oldContext) {
              // If contexts match in isActive test, assume params also match.
              // This allows for flexibility in not requiring that every last
              // handler provide a `serialize` method
              newHandlerInfo.params = oldHandlerInfo && oldHandlerInfo.params;
            }
            newHandlerInfo.context = oldContext;
          }

          var handlerToUse = oldHandlerInfo;
          if (i >= invalidateIndex || newHandlerInfo.shouldSupercede(oldHandlerInfo)) {
            invalidateIndex = Math.min(i, invalidateIndex);
            handlerToUse = newHandlerInfo;
          }

          if (isIntermediate && !checkingIfActive) {
            handlerToUse = handlerToUse.becomeResolved(null, handlerToUse.context);
          }

          newState.handlerInfos.unshift(handlerToUse);
        }

        if (objects.length > 0) {
          throw new Error("More context objects were passed than there are dynamic segments for the route: " + targetRouteName);
        }

        if (!isIntermediate) {
          this.invalidateChildren(newState.handlerInfos, invalidateIndex);
        }

        merge(newState.queryParams, this.queryParams || {});

        return newState;
      },

      invalidateChildren: function(handlerInfos, invalidateIndex) {
        for (var i = invalidateIndex, l = handlerInfos.length; i < l; ++i) {
          var handlerInfo = handlerInfos[i];
          handlerInfos[i] = handlerInfos[i].getUnresolved();
        }
      },

      getHandlerInfoForDynamicSegment: function(name, handler, names, objects, oldHandlerInfo, targetRouteName, i) {

        var numNames = names.length;
        var objectToUse;
        if (objects.length > 0) {

          // Use the objects provided for this transition.
          objectToUse = objects[objects.length - 1];
          if (isParam(objectToUse)) {
            return this.createParamHandlerInfo(name, handler, names, objects, oldHandlerInfo);
          } else {
            objects.pop();
          }
        } else if (oldHandlerInfo && oldHandlerInfo.name === name) {
          // Reuse the matching oldHandlerInfo
          return oldHandlerInfo;
        } else {
          if (this.preTransitionState) {
            var preTransitionHandlerInfo = this.preTransitionState.handlerInfos[i];
            objectToUse = preTransitionHandlerInfo && preTransitionHandlerInfo.context;
          } else {
            // Ideally we should throw this error to provide maximal
            // information to the user that not enough context objects
            // were provided, but this proves too cumbersome in Ember
            // in cases where inner template helpers are evaluated
            // before parent helpers un-render, in which cases this
            // error somewhat prematurely fires.
            //throw new Error("Not enough context objects were provided to complete a transition to " + targetRouteName + ". Specifically, the " + name + " route needs an object that can be serialized into its dynamic URL segments [" + names.join(', ') + "]");
            return oldHandlerInfo;
          }
        }

        return handlerInfoFactory('object', {
          name: name,
          handler: handler,
          context: objectToUse,
          names: names
        });
      },

      createParamHandlerInfo: function(name, handler, names, objects, oldHandlerInfo) {
        var params = {};

        // Soak up all the provided string/numbers
        var numNames = names.length;
        while (numNames--) {

          // Only use old params if the names match with the new handler
          var oldParams = (oldHandlerInfo && name === oldHandlerInfo.name && oldHandlerInfo.params) || {};

          var peek = objects[objects.length - 1];
          var paramName = names[numNames];
          if (isParam(peek)) {
            params[paramName] = "" + objects.pop();
          } else {
            // If we're here, this means only some of the params
            // were string/number params, so try and use a param
            // value from a previous handler.
            if (oldParams.hasOwnProperty(paramName)) {
              params[paramName] = oldParams[paramName];
            } else {
              throw new Error("You didn't provide enough string/numeric parameters to satisfy all of the dynamic segments for route " + name);
            }
          }
        }

        return handlerInfoFactory('param', {
          name: name,
          handler: handler,
          params: params
        });
      }
    });
  });
define("router/transition-intent/url-transition-intent",
  ["../transition-intent","../transition-state","../handler-info/factory","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    
    var TransitionIntent = __dependency1__["default"];
    var TransitionState = __dependency2__["default"];
    var handlerInfoFactory = __dependency3__["default"];
    var oCreate = __dependency4__.oCreate;
    var merge = __dependency4__.merge;
    var subclass = __dependency4__.subclass;

    __exports__["default"] = subclass(TransitionIntent, {
      url: null,

      initialize: function(props) {
        this.url = props.url;
      },

      applyToState: function(oldState, recognizer, getHandler) {
        var newState = new TransitionState();

        var results = recognizer.recognize(this.url),
            queryParams = {},
            i, len;

        if (!results) {
          throw new UnrecognizedURLError(this.url);
        }

        var statesDiffer = false;

        for (i = 0, len = results.length; i < len; ++i) {
          var result = results[i];
          var name = result.handler;
          var handler = getHandler(name);

          if (handler.inaccessibleByURL) {
            throw new UnrecognizedURLError(this.url);
          }

          var newHandlerInfo = handlerInfoFactory('param', {
            name: name,
            handler: handler,
            params: result.params
          });

          var oldHandlerInfo = oldState.handlerInfos[i];
          if (statesDiffer || newHandlerInfo.shouldSupercede(oldHandlerInfo)) {
            statesDiffer = true;
            newState.handlerInfos[i] = newHandlerInfo;
          } else {
            newState.handlerInfos[i] = oldHandlerInfo;
          }
        }

        merge(newState.queryParams, results.queryParams);

        return newState;
      }
    });

    /**
      Promise reject reasons passed to promise rejection
      handlers for failed transitions.
     */
    function UnrecognizedURLError(message) {
      this.message = (message || "UnrecognizedURLError");
      this.name = "UnrecognizedURLError";
    }
  });
define("router/transition-state",
  ["./handler-info","./utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var ResolvedHandlerInfo = __dependency1__.ResolvedHandlerInfo;
    var forEach = __dependency2__.forEach;
    var promiseLabel = __dependency2__.promiseLabel;
    var callHook = __dependency2__.callHook;
    var Promise = __dependency3__["default"];

    function TransitionState(other) {
      this.handlerInfos = [];
      this.queryParams = {};
      this.params = {};
    }

    TransitionState.prototype = {
      handlerInfos: null,
      queryParams: null,
      params: null,

      promiseLabel: function(label) {
        var targetName = '';
        forEach(this.handlerInfos, function(handlerInfo) {
          if (targetName !== '') {
            targetName += '.';
          }
          targetName += handlerInfo.name;
        });
        return promiseLabel("'" + targetName + "': " + label);
      },

      resolve: function(shouldContinue, payload) {
        var self = this;
        // First, calculate params for this state. This is useful
        // information to provide to the various route hooks.
        var params = this.params;
        forEach(this.handlerInfos, function(handlerInfo) {
          params[handlerInfo.name] = handlerInfo.params || {};
        });

        payload = payload || {};
        payload.resolveIndex = 0;

        var currentState = this;
        var wasAborted = false;

        // The prelude RSVP.resolve() asyncs us into the promise land.
        return Promise.resolve(null, this.promiseLabel("Start transition"))
        .then(resolveOneHandlerInfo, null, this.promiseLabel('Resolve handler'))['catch'](handleError, this.promiseLabel('Handle error'));

        function innerShouldContinue() {
          return Promise.resolve(shouldContinue(), currentState.promiseLabel("Check if should continue"))['catch'](function(reason) {
            // We distinguish between errors that occurred
            // during resolution (e.g. beforeModel/model/afterModel),
            // and aborts due to a rejecting promise from shouldContinue().
            wasAborted = true;
            return Promise.reject(reason);
          }, currentState.promiseLabel("Handle abort"));
        }

        function handleError(error) {
          // This is the only possible
          // reject value of TransitionState#resolve
          var handlerInfos = currentState.handlerInfos;
          var errorHandlerIndex = payload.resolveIndex >= handlerInfos.length ?
                                  handlerInfos.length - 1 : payload.resolveIndex;
          return Promise.reject({
            error: error,
            handlerWithError: currentState.handlerInfos[errorHandlerIndex].handler,
            wasAborted: wasAborted,
            state: currentState
          });
        }

        function proceed(resolvedHandlerInfo) {
          var wasAlreadyResolved = currentState.handlerInfos[payload.resolveIndex].isResolved;

          // Swap the previously unresolved handlerInfo with
          // the resolved handlerInfo
          currentState.handlerInfos[payload.resolveIndex++] = resolvedHandlerInfo;

          if (!wasAlreadyResolved) {
            // Call the redirect hook. The reason we call it here
            // vs. afterModel is so that redirects into child
            // routes don't re-run the model hooks for this
            // already-resolved route.
            var handler = resolvedHandlerInfo.handler;
            callHook(handler, 'redirect', resolvedHandlerInfo.context, payload);
          }

          // Proceed after ensuring that the redirect hook
          // didn't abort this transition by transitioning elsewhere.
          return innerShouldContinue().then(resolveOneHandlerInfo, null, currentState.promiseLabel('Resolve handler'));
        }

        function resolveOneHandlerInfo() {
          if (payload.resolveIndex === currentState.handlerInfos.length) {
            // This is is the only possible
            // fulfill value of TransitionState#resolve
            return {
              error: null,
              state: currentState
            };
          }

          var handlerInfo = currentState.handlerInfos[payload.resolveIndex];

          return handlerInfo.resolve(innerShouldContinue, payload)
                            .then(proceed, null, currentState.promiseLabel('Proceed'));
        }
      }
    };

    __exports__["default"] = TransitionState;
  });
define("router/transition",
  ["rsvp/promise","./handler-info","./utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var Promise = __dependency1__["default"];
    var ResolvedHandlerInfo = __dependency2__.ResolvedHandlerInfo;
    var trigger = __dependency3__.trigger;
    var slice = __dependency3__.slice;
    var log = __dependency3__.log;
    var promiseLabel = __dependency3__.promiseLabel;

    /**
      @private

      A Transition is a thennable (a promise-like object) that represents
      an attempt to transition to another route. It can be aborted, either
      explicitly via `abort` or by attempting another transition while a
      previous one is still underway. An aborted transition can also
      be `retry()`d later.
     */
    function Transition(router, intent, state, error) {
      var transition = this;
      this.state = state || router.state;
      this.intent = intent;
      this.router = router;
      this.data = this.intent && this.intent.data || {};
      this.resolvedModels = {};
      this.queryParams = {};

      if (error) {
        this.promise = Promise.reject(error);
        return;
      }

      if (state) {
        this.params = state.params;
        this.queryParams = state.queryParams;
        this.handlerInfos = state.handlerInfos;

        var len = state.handlerInfos.length;
        if (len) {
          this.targetName = state.handlerInfos[len-1].name;
        }

        for (var i = 0; i < len; ++i) {
          var handlerInfo = state.handlerInfos[i];

          // TODO: this all seems hacky
          if (!handlerInfo.isResolved) { break; }
          this.pivotHandler = handlerInfo.handler;
        }

        this.sequence = Transition.currentSequence++;
        this.promise = state.resolve(checkForAbort, this)['catch'](function(result) {
          if (result.wasAborted || transition.isAborted) {
            return Promise.reject(logAbort(transition));
          } else {
            transition.trigger('error', result.error, transition, result.handlerWithError);
            transition.abort();
            return Promise.reject(result.error);
          }
        }, promiseLabel('Handle Abort'));
      } else {
        this.promise = Promise.resolve(this.state);
        this.params = {};
      }

      function checkForAbort() {
        if (transition.isAborted) {
          return Promise.reject(undefined, promiseLabel("Transition aborted - reject"));
        }
      }
    }

    Transition.currentSequence = 0;

    Transition.prototype = {
      targetName: null,
      urlMethod: 'update',
      intent: null,
      params: null,
      pivotHandler: null,
      resolveIndex: 0,
      handlerInfos: null,
      resolvedModels: null,
      isActive: true,
      state: null,
      queryParamsOnly: false,

      isTransition: true,

      isExiting: function(handler) {
        var handlerInfos = this.handlerInfos;
        for (var i = 0, len = handlerInfos.length; i < len; ++i) {
          var handlerInfo = handlerInfos[i];
          if (handlerInfo.name === handler || handlerInfo.handler === handler) {
            return false;
          }
        }
        return true;
      },

      /**
        @public

        The Transition's internal promise. Calling `.then` on this property
        is that same as calling `.then` on the Transition object itself, but
        this property is exposed for when you want to pass around a
        Transition's promise, but not the Transition object itself, since
        Transition object can be externally `abort`ed, while the promise
        cannot.
       */
      promise: null,

      /**
        @public

        Custom state can be stored on a Transition's `data` object.
        This can be useful for decorating a Transition within an earlier
        hook and shared with a later hook. Properties set on `data` will
        be copied to new transitions generated by calling `retry` on this
        transition.
       */
      data: null,

      /**
        @public

        A standard promise hook that resolves if the transition
        succeeds and rejects if it fails/redirects/aborts.

        Forwards to the internal `promise` property which you can
        use in situations where you want to pass around a thennable,
        but not the Transition itself.

        @param {Function} onFulfilled
        @param {Function} onRejected
        @param {String} label optional string for labeling the promise.
        Useful for tooling.
        @return {Promise}
       */
      then: function(onFulfilled, onRejected, label) {
        return this.promise.then(onFulfilled, onRejected, label);
      },

      /**
        @public

        Forwards to the internal `promise` property which you can
        use in situations where you want to pass around a thennable,
        but not the Transition itself.

        @method catch
        @param {Function} onRejection
        @param {String} label optional string for labeling the promise.
        Useful for tooling.
        @return {Promise}
       */
      "catch": function(onRejection, label) {
        return this.promise["catch"](onRejection, label);
      },

      /**
        @public

        Forwards to the internal `promise` property which you can
        use in situations where you want to pass around a thennable,
        but not the Transition itself.

        @method finally
        @param {Function} callback
        @param {String} label optional string for labeling the promise.
        Useful for tooling.
        @return {Promise}
       */
      "finally": function(callback, label) {
        return this.promise["finally"](callback, label);
      },

      /**
        @public

        Aborts the Transition. Note you can also implicitly abort a transition
        by initiating another transition while a previous one is underway.
       */
      abort: function() {
        if (this.isAborted) { return this; }
        log(this.router, this.sequence, this.targetName + ": transition was aborted");
        this.intent.preTransitionState = this.router.state;
        this.isAborted = true;
        this.isActive = false;
        this.router.activeTransition = null;
        return this;
      },

      /**
        @public

        Retries a previously-aborted transition (making sure to abort the
        transition if it's still active). Returns a new transition that
        represents the new attempt to transition.
       */
      retry: function() {
        // TODO: add tests for merged state retry()s
        this.abort();
        return this.router.transitionByIntent(this.intent, false);
      },

      /**
        @public

        Sets the URL-changing method to be employed at the end of a
        successful transition. By default, a new Transition will just
        use `updateURL`, but passing 'replace' to this method will
        cause the URL to update using 'replaceWith' instead. Omitting
        a parameter will disable the URL change, allowing for transitions
        that don't update the URL at completion (this is also used for
        handleURL, since the URL has already changed before the
        transition took place).

        @param {String} method the type of URL-changing method to use
          at the end of a transition. Accepted values are 'replace',
          falsy values, or any other non-falsy value (which is
          interpreted as an updateURL transition).

        @return {Transition} this transition
       */
      method: function(method) {
        this.urlMethod = method;
        return this;
      },

      /**
        @public

        Fires an event on the current list of resolved/resolving
        handlers within this transition. Useful for firing events
        on route hierarchies that haven't fully been entered yet.

        Note: This method is also aliased as `send`

        @param {Boolean} [ignoreFailure=false] a boolean specifying whether unhandled events throw an error
        @param {String} name the name of the event to fire
       */
      trigger: function (ignoreFailure) {
        var args = slice.call(arguments);
        if (typeof ignoreFailure === 'boolean') {
          args.shift();
        } else {
          // Throw errors on unhandled trigger events by default
          ignoreFailure = false;
        }
        trigger(this.router, this.state.handlerInfos.slice(0, this.resolveIndex + 1), ignoreFailure, args);
      },

      /**
        @public

        Transitions are aborted and their promises rejected
        when redirects occur; this method returns a promise
        that will follow any redirects that occur and fulfill
        with the value fulfilled by any redirecting transitions
        that occur.

        @return {Promise} a promise that fulfills with the same
          value that the final redirecting transition fulfills with
       */
      followRedirects: function() {
        var router = this.router;
        return this.promise['catch'](function(reason) {
          if (router.activeTransition) {
            return router.activeTransition.followRedirects();
          }
          return Promise.reject(reason);
        });
      },

      toString: function() {
        return "Transition (sequence " + this.sequence + ")";
      },

      /**
        @private
       */
      log: function(message) {
        log(this.router, this.sequence, message);
      }
    };

    // Alias 'trigger' as 'send'
    Transition.prototype.send = Transition.prototype.trigger;

    /**
      @private

      Logs and returns a TransitionAborted error.
     */
    function logAbort(transition) {
      log(transition.router, transition.sequence, "detected abort.");
      return new TransitionAborted();
    }

    function TransitionAborted(message) {
      this.message = (message || "TransitionAborted");
      this.name = "TransitionAborted";
    }

    __exports__.Transition = Transition;
    __exports__.logAbort = logAbort;
    __exports__.TransitionAborted = TransitionAborted;
  });
define("router/utils",
  ["exports"],
  function(__exports__) {
    
    var slice = Array.prototype.slice;

    var _isArray;
    if (!Array.isArray) {
      _isArray = function (x) {
        return Object.prototype.toString.call(x) === "[object Array]";
      };
    } else {
      _isArray = Array.isArray;
    }

    var isArray = _isArray;
    __exports__.isArray = isArray;
    function merge(hash, other) {
      for (var prop in other) {
        if (other.hasOwnProperty(prop)) { hash[prop] = other[prop]; }
      }
    }

    var oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };
    __exports__.oCreate = oCreate;
    /**
      @private

      Extracts query params from the end of an array
    **/
    function extractQueryParams(array) {
      var len = (array && array.length), head, queryParams;

      if(len && len > 0 && array[len - 1] && array[len - 1].hasOwnProperty('queryParams')) {
        queryParams = array[len - 1].queryParams;
        head = slice.call(array, 0, len - 1);
        return [head, queryParams];
      } else {
        return [array, null];
      }
    }

    __exports__.extractQueryParams = extractQueryParams;/**
      @private

      Coerces query param properties and array elements into strings.
    **/
    function coerceQueryParamsToString(queryParams) {
      for (var key in queryParams) {
        if (typeof queryParams[key] === 'number') {
          queryParams[key] = '' + queryParams[key];
        } else if (isArray(queryParams[key])) {
          for (var i = 0, l = queryParams[key].length; i < l; i++) {
            queryParams[key][i] = '' + queryParams[key][i];
          }
        }
      }
    }
    /**
      @private
     */
    function log(router, sequence, msg) {
      if (!router.log) { return; }

      if (arguments.length === 3) {
        router.log("Transition #" + sequence + ": " + msg);
      } else {
        msg = sequence;
        router.log(msg);
      }
    }

    __exports__.log = log;function bind(context, fn) {
      var boundArgs = arguments;
      return function(value) {
        var args = slice.call(boundArgs, 2);
        args.push(value);
        return fn.apply(context, args);
      };
    }

    __exports__.bind = bind;function isParam(object) {
      return (typeof object === "string" || object instanceof String || typeof object === "number" || object instanceof Number);
    }


    function forEach(array, callback) {
      for (var i=0, l=array.length; i<l && false !== callback(array[i]); i++) { }
    }

    __exports__.forEach = forEach;function trigger(router, handlerInfos, ignoreFailure, args) {
      if (router.triggerEvent) {
        router.triggerEvent(handlerInfos, ignoreFailure, args);
        return;
      }

      var name = args.shift();

      if (!handlerInfos) {
        if (ignoreFailure) { return; }
        throw new Error("Could not trigger event '" + name + "'. There are no active handlers");
      }

      var eventWasHandled = false;

      for (var i=handlerInfos.length-1; i>=0; i--) {
        var handlerInfo = handlerInfos[i],
            handler = handlerInfo.handler;

        if (handler.events && handler.events[name]) {
          if (handler.events[name].apply(handler, args) === true) {
            eventWasHandled = true;
          } else {
            return;
          }
        }
      }

      if (!eventWasHandled && !ignoreFailure) {
        throw new Error("Nothing handled the event '" + name + "'.");
      }
    }

    __exports__.trigger = trigger;function getChangelist(oldObject, newObject) {
      var key;
      var results = {
        all: {},
        changed: {},
        removed: {}
      };

      merge(results.all, newObject);

      var didChange = false;
      coerceQueryParamsToString(oldObject);
      coerceQueryParamsToString(newObject);

      // Calculate removals
      for (key in oldObject) {
        if (oldObject.hasOwnProperty(key)) {
          if (!newObject.hasOwnProperty(key)) {
            didChange = true;
            results.removed[key] = oldObject[key];
          }
        }
      }

      // Calculate changes
      for (key in newObject) {
        if (newObject.hasOwnProperty(key)) {
          if (isArray(oldObject[key]) && isArray(newObject[key])) {
            if (oldObject[key].length !== newObject[key].length) {
              results.changed[key] = newObject[key];
              didChange = true;
            } else {
              for (var i = 0, l = oldObject[key].length; i < l; i++) {
                if (oldObject[key][i] !== newObject[key][i]) {
                  results.changed[key] = newObject[key];
                  didChange = true;
                }
              }
            }
          }
          else {
            if (oldObject[key] !== newObject[key]) {
              results.changed[key] = newObject[key];
              didChange = true;
            }
          }
        }
      }

      return didChange && results;
    }

    __exports__.getChangelist = getChangelist;function promiseLabel(label) {
      return 'Router: ' + label;
    }

    __exports__.promiseLabel = promiseLabel;function subclass(parentConstructor, proto) {
      function C(props) {
        parentConstructor.call(this, props || {});
      }
      C.prototype = oCreate(parentConstructor.prototype);
      merge(C.prototype, proto);
      return C;
    }

    __exports__.subclass = subclass;function resolveHook(obj, hookName) {
      if (!obj) { return; }
      var underscored = "_" + hookName;
      return obj[underscored] && underscored ||
             obj[hookName] && hookName;
    }

    function callHook(obj, hookName) {
      var args = slice.call(arguments, 2);
      return applyHook(obj, hookName, args);
    }

    function applyHook(obj, _hookName, args) {
      var hookName = resolveHook(obj, _hookName);
      if (hookName) {
        return obj[hookName].apply(obj, args);
      }
    }

    __exports__.merge = merge;
    __exports__.slice = slice;
    __exports__.isParam = isParam;
    __exports__.coerceQueryParamsToString = coerceQueryParamsToString;
    __exports__.callHook = callHook;
    __exports__.resolveHook = resolveHook;
    __exports__.applyHook = applyHook;
  });
define("router",
  ["./router/router","exports"],
  function(__dependency1__, __exports__) {
    
    var Router = __dependency1__["default"];

    __exports__["default"] = Router;
  });
define('pixy/model',[
  'underscore',
  'rsvp',
  './namespace',
  './object',
  './util',
  'rsvp'
],
function(_, RSVP, Pixy, PObject, Util, RSVP) {
  var slice = [].slice;
  var extend = _.extend;
  var clone = _.clone;
  var pick = _.pick;
  var defaults = _.defaults;
  var result = _.result;
  var uniqueId = _.uniqueId;

  // Pixy.Model
  // --------------

  // A list of options to be attached directly to the model, if provided.
  var modelOptions = ['url', 'urlRoot', 'collection', 'cache'];

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Pixy **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Attach all inheritable methods to the Model prototype.
  var Model = PObject.extend({
    name: 'Model',

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Create a new model with the specified attributes. A client id (`cid`)
    // is automatically generated and assigned for you.
    constructor: function(attrs, options) {
      attrs = attrs || {};

      if (!options) {
        options = {};
      }

      this.cid = uniqueId( this.cidPrefix || 'c');
      this.attributes = {};

      extend(this, pick(options, modelOptions));

      attrs = this.parse(attrs, options) || {};
      attrs = this._assignDefaults(attrs);

      PObject.call(this, 'model', function() {

        this.set(attrs, options);
        this.changed = {};

        this.on('sync', this._setServerAttributes, this);
        this._setServerAttributes();
      }, arguments);
    },

    _assignDefaults: function(attrs) {
      return defaults({}, attrs, result(this, 'defaults'));
    },

    _setServerAttributes: function() {
      this.serverAttrs = clone(this.attributes);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    toString: function() {
      return [ this.name, this.id || this.cid ].join('#');
    },

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return clone(this.attributes);
    },

    toProps: function() {
      var attrs = this.toJSON();
      attrs.is_new = this.isNew();
      return Object.keys(attrs).reduce(function(props, key) {
        props[key.camelize(true)] = attrs[key];
        return props;
      }, {});
    },

    // Proxy `Pixy.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Pixy.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      this.normalize(attrs);

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // A chance to coerce or transform any data prior to it being set on the model.
    normalize: function(attrs) {},

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? clone(options) : {};

      var model = this;
      var success = options.success;
      options.success = function(resp) {
        var attrs = model.parse(resp, options);

        if (!model.set(attrs, options)) {
          return false;
        }

        if (success) {
          success(model, resp, options);
        }

        if (!options.silent) {
          model.trigger('sync', model, resp, options);
        }
      };

      Util.wrapError(this, options);
      return this.sync('read', this, options);
    },

    save: function(key, value, options) {
      var that    = this;
      var service = RSVP.defer();

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key === null || _.isObject(key)) {
        options = value;
      }

      options = options || {};
      options.parse = true;

      RSVP.Promise.cast(this.__save.apply(this, arguments)).then(function(data) {
        if (!data) {
          Pixy.warn('Model save failed; local validation failure:', that.validationError);

          return service.reject(that.validationError);
        }

        return service.resolve(that);
      }, function parseAndReportAPIFailure(xhrError) {
        var apiError;

        if (xhrError.responseJSON) {
          apiError = xhrError.responseJSON;
        }
        else if (xhrError.responseText) {
          apiError = JSON.parse(xhrError.responseText || '{}') || {};
        }
        // TODO: extract this, make it configurable
        else if ('field_errors' in xhrError) {
          apiError = xhrError;
        }
        else {
          setTimeout(function() {
            console.error('Unexpected API error:', xhrError);
          }, 1);
        }

        Pixy.warn('Model save failed; XHR failure:', apiError, xhrError);

        that.trigger('invalid', that, apiError, extend({}, options, {
          validationError: apiError
        }));

        return service.reject(apiError);
      });

      return service.promise;
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    __save: function(key, val, options) {
      var model       = this,
          attributes  = this.attributes,
          wasNew      = this.isNew(),
          success,
          attrs,
          method,
          xhr;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) {
        if (options.error) {
          options.error(this, options);
        }

        return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = extend({}, attributes, attrs);
      }
      else if (attrs && this.isNew()) {
        this.attributes = extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;

      success = options.success;

      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = extend(attrs || {}, serverAttrs);

        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {

          if (options.error) {
            options.error(model, options);
          }

          return false;
        }

        if (success) success(model, resp, options);

        model.trigger('sync', model, resp, options);
        model.trigger((wasNew ? 'create' : 'update'), model, resp, options);
      };

      Util.wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');

      if (method === 'patch') {
        options.attrs = attrs;
      }

      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) {
        this.attributes = attributes;
      }

      return xhr;
    },

    /**
     * Restore the model to its last-known state.
     *
     * For newly-created models, this will reset the model and re-prop it with
     * the defaults. For persistent ones, this will restore the model to look
     * the way it did when it was fetched from the server.
     *
     * @param  {Boolean} local
     *         Pass to true to use the cached version of the server
     *         representation, otherwise this will perform a new #fetch().
     *
     * @return {RSVP.Promise}
     */
    restore: function(local) {
      var rc;

      if (this.isNew()) {
        this.clear({ silent: true });
        rc = this.set(this._assignDefaults());
      } else {
        rc = local ? this.set(this.serverAttrs) : this.fetch();
      }

      return RSVP.Promise.cast(rc);
    },

    destroy: function() {
      var service = RSVP.defer();
      var that = this;

      RSVP.Promise.cast(this.__destroy.apply(this, arguments)).then(function(resp) {
        that._events.sync = null;
        that.stopListening();

        service.resolve(resp);

        return resp;
      }, function(err) {
        service.reject(err);
        return err;
      });

      return service.promise;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    __destroy: function(options) {
      var success;

      if (!options) {
        options = {};
      }

      success = options.success;

      options.success = function(resp) {
        this.trigger('destroy', this, this.collection, options);

        if (success) {
          success(this, resp, options);
        }
      }.bind(this);

      if (this.isNew()) {
        options.success({});
        return RSVP.resolve();
      }

      Util.wrapError(this, options);

      return this.sync('delete', this, options);
    },

    // Default URL for the model's representation on the server -- if you're
    // using Pixy's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var suffix;
      var base = result(this, 'urlRoot') ||
        result(this.collection, 'url') ||
        Util.urlError();

      if (this.isNew()) {
        return base;
      }

      suffix = base.charAt(base.length - 1) === '/' ? '' : '/';

      return base + (suffix) + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, extend(options || {}, {validationError: error}));
      return false;
    }
  });

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  return Model;
});
/**
 *
 * Backbone.DeepModel v0.10.4
 *
 * Copyright (c) 2013 Charles Davison, Pow Media Ltd
 * Modified by Ahmad Amireh <ahmad@amireh.net> 2014
 *
 * https://github.com/powmedia/backbone-deep-model
 * Licensed under the MIT License
 */

define('pixy/deep_model',[ 'underscore', './model' ], function(_, Model) {
  /**
   * Takes a nested object and returns a shallow object keyed with the path names
   * e.g. { "level1.level2": "value" }
   *
   * @param  {Object}      Nested object e.g. { level1: { level2: 'value' } }
   * @return {Object}      Shallow object with path names e.g. { 'level1.level2': 'value' }
   */
  function objToPaths(obj) {
      var ret = {},
          separator = DeepModel.keyPathSeparator;

      for (var key in obj) {
          var val = obj[key];

          if (val && val.constructor === Object && !_.isEmpty(val)) {
              //Recursion for embedded objects
              var obj2 = objToPaths(val);

              for (var key2 in obj2) {
                  var val2 = obj2[key2];

                  ret[key + separator + key2] = val2;
              }
          } else {
              ret[key] = val;
          }
      }

      return ret;
  }

  /**
   * @param {Object}  Object to fetch attribute from
   * @param {String}  Object path e.g. 'user.name'
   * @return {Mixed}
   */
  function getNested(obj, path, return_exists) {
      var separator = DeepModel.keyPathSeparator;

      var fields = path.split(separator);
      var result = obj;
      return_exists || (return_exists === false);
      for (var i = 0, n = fields.length; i < n; i++) {
          if (return_exists && !_.has(result, fields[i])) {
              return false;
          }
          result = result[fields[i]];

          if (result == null && i < n - 1) {
              result = {};
          }

          if (typeof result === 'undefined') {
              if (return_exists)
              {
                  return true;
              }
              return result;
          }
      }
      if (return_exists)
      {
          return true;
      }
      return result;
  }

  /**
   * @param {Object} obj                Object to fetch attribute from
   * @param {String} path               Object path e.g. 'user.name'
   * @param {Object} [options]          Options
   * @param {Boolean} [options.unset]   Whether to delete the value
   * @param {Mixed}                     Value to set
   */
  function setNested(obj, path, val, options) {
      options = options || {};

      var separator = DeepModel.keyPathSeparator;

      var fields = path.split(separator);
      var result = obj;
      for (var i = 0, n = fields.length; i < n && result !== undefined ; i++) {
          var field = fields[i];

          //If the last in the path, set the value
          if (i === n - 1) {
              options.unset ? delete result[field] : result[field] = val;
          } else {
              //Create the child object if it doesn't exist, or isn't an object
              if (typeof result[field] === 'undefined' || ! _.isObject(result[field])) {
                  result[field] = {};
              }

              //Move onto the next part of the path
              result = result[field];
          }
      }
  }

  function deleteNested(obj, path) {
    setNested(obj, path, null, { unset: true });
  }

  var DeepModel = Model.extend({
    _assignDefaults: function(attrs) {
      return attrs = _.merge({}, _.result(this, 'defaults'), attrs);
    },

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.cloneDeep(this.attributes);
    },

    // Override get
    // Supports nested attributes via the syntax 'obj.attr' e.g. 'author.user.name'
    get: function(attr) {
      return getNested(this.attributes, attr);
    },

    // Override set
    // Supports nested attributes via the syntax 'obj.attr' e.g. 'author.user.name'
    set: function(key, val, options) {
        var attr, attrs, unset, changes, silent, changing, prev, current;
        if (key == null) return this;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (typeof key === 'object') {
          attrs = key;
          options = val || {};
        } else {
          (attrs = {})[key] = val;
        }

        options || (options = {});

        // Run validation.
        if (!this._validate(attrs, options)) return false;

        // Extract attributes and options.
        unset           = options.unset;
        silent          = options.silent;
        changes         = [];
        changing        = this._changing;
        this._changing  = true;

        if (!changing) {
          this._previousAttributes = _.cloneDeep(this.attributes); //<custom>: Replaced _.clone with _.cloneDeep
          this.changed = {};
        }
        current = this.attributes, prev = this._previousAttributes;

        // Check for changes of `id`.
        if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

        //<custom code>
        attrs = objToPaths(attrs);
        //</custom code>

        // For each `set` attribute, update or delete the current value.
        for (attr in attrs) {
          val = attrs[attr];

          //<custom code>: Using getNested, setNested and deleteNested
          if (!_.isEqual(getNested(current, attr), val)) changes.push(attr);
          if (!_.isEqual(getNested(prev, attr), val)) {
            setNested(this.changed, attr, val);
          } else {
            deleteNested(this.changed, attr);
          }
          unset ? deleteNested(current, attr) : setNested(current, attr, val);
          //</custom code>
        }

        // Trigger all relevant attribute changes.
        if (!silent) {
          if (changes.length) this._pending = true;

          //<custom code>
          var separator = DeepModel.keyPathSeparator;

          for (var i = 0, l = changes.length; i < l; i++) {
            var key = changes[i];

            this.trigger('change:' + key, this, getNested(current, key), options);

            var fields = key.split(separator);

            //Trigger change events for parent keys with wildcard (*) notation
            for(var n = fields.length - 1; n > 0; n--) {
              var parentKey = _.first(fields, n).join(separator),
                  wildcardKey = parentKey + separator + '*';

              this.trigger('change:' + wildcardKey, this, getNested(current, parentKey), options);
            }
            //</custom code>
          }
        }

        if (changing) return this;
        if (!silent) {
          while (this._pending) {
            this._pending = false;
            this.trigger('change', this, options);
          }
        }
        this._pending = false;
        this._changing = false;
        return this;
    },

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
    clear: function(options) {
      var attrs = {};
      var shallowAttributes = objToPaths(this.attributes);
      for (var key in shallowAttributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return getNested(this.changed, attr) !== undefined;
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      //<custom code>: objToPaths
      if (!diff) return this.hasChanged() ? objToPaths(this.changed) : false;
      //</custom code>

      var old = this._changing ? this._previousAttributes : this.attributes;

      //<custom code>
      diff = objToPaths(diff);
      old = objToPaths(old);
      //</custom code>

      var val, changed = false;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;

      //<custom code>
      return getNested(this._previousAttributes, attr);
      //</custom code>
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      //<custom code>
      return _.cloneDeep(this._previousAttributes);
      //</custom code>
    }
  });

  //Config; override in your app to customise
  DeepModel.keyPathSeparator = '.';

  //Exports
  // Pixy.DeepModel = DeepModel;

  return DeepModel;
});

define('pixy/util/wrap',[], function() {
  

  var sink = function() {};

  /**
   * Wrap a method with another that receives the wrapped method as its first
   * argument, as well as the original arguments the wrapped method would have
   * received.
   *
   * The wrapper does not need to test if the wrapped method exist (in case of
   * user-provided callbacks) because a "sink" method will be provided as
   * default.
   *
   * @param  {Function} method
   *         Method to wrap.
   * @param  {Function} callback
   *         Your wrapper.
   * @param  {[type]}   thisArg
   *         Context to execute the wrapper in.
   * @return {Function}
   *         The wrapper wrapper method.
   */
  return function(method, callback, thisArg) {
    method = method || sink;

    return function() {
      var params = Array.prototype.slice.call(arguments, 0);
      params.unshift(method);
      return callback.apply(thisArg, params);
    }
  };
});
define('pixy/collection',[
  'underscore',
  './namespace',
  './object',
  './model',
  './util',
  './util/wrap'
], function(_, Pixy, PObject, Model, Util, wrap) {
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  /**
   * @class Collection
   *
   * Rip of Backbone.Collection with support for Link-based pagination fetching
   * and caching.
   */

  // Default options for `Collection#set`.
  var defaults = {
    set: { add: true, remove: true, merge: true },
    add: { add: true, merge: false, remove: false, sort: true }
  };

  var setOptions = defaults.set;
  var addOptions = defaults.add;

  var ctorOptions = [ 'url', 'model', 'cache', 'comparator' ];

  // Define the Collection's inheritable methods.
  var Collection = PObject.extend({
    name: 'Collection',
    meta: {},

    // Create a new **Collection**, perhaps to contain a specific type of `model`.
    // If a `comparator` is specified, the Collection will maintain
    // its models in sort order, as they're added and removed.
    constructor: function(models, options) {
      options || (options = {});

      ctorOptions.forEach(function(option) {
        if (options.hasOwnProperty(option)) {
          this[option] = options[option];
        }
      }.bind(this));

      PObject.call(this, 'collection', function() {
        this._reset();

        if (models) {
          this.reset(models, _.extend({ silent: true, parse: true }));
        }
      }, arguments);
    },

    // The default model for a collection is just a **Pixy.Model**.
    // This should be overridden in most cases.
    model: Model,

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    toProps: function() {
      return this.invoke('toProps');
    },

    // Proxy `Pixy.sync` by default.
    sync: function() {
      return Pixy.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.defaults(options || {}, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults(options || {}, setOptions);
      if (options.parse) models = this.parse(models, options);
      if (!_.isArray(models)) models = models ? [models] : [];
      var i, l, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(models[i], options))) continue;

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.remove) modelMap[existing.cid] = true;
          if (options.merge) {
            existing.set(model.attributes, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }

        // This is a new model, push it to the `toAdd` list.
        } else if (options.add) {
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
      }

      // Remove nonexistent models if appropriate.
      if (options.remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          push.apply(this.models, toAdd);
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = toAdd.length; i < l; i++) {
        (model = toAdd[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (sort) this.trigger('sort', this, options);

      this.broadcastSync();

      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});

      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }

      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({ silent: true }, options));

      if (!options.silent) {
        this.trigger('reset', this, options);
        this.broadcastSync();
      }

      return this;
    },

    resetMeta: function() {
      this.meta = {};
    },

    broadcastSync: function() {
      this.forEach(function(model) {
        model.trigger('sync', model);
      });
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    /**
     * Returns the first model that is not persistent.
     */
    findNew: function() {
      return this.find(function(model) {
        return model.isNew();
      });
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Figure out the smallest index at which a model should be inserted so as
    // to maintain order.
    sortedIndex: function(model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};

      if (options.parse === void 0) {
        options.parse = true;
      }

      options.xhrSuccess = _.bind(this.parseLinkPagination, this);

      options.success = wrap(options.success, function(success, resp) {
        var method = options.reset ? 'reset' : 'set';
        this[method](resp, options);

        success(this, resp, options);

        this.trigger('fetch', this, resp, options);
      }, this);

      Util.wrapError(this, options);

      return this.sync('read', this, options);
    },

    fetchNext: function(options) {
      var that = this;

      options = options || {};
      this.meta.currentPage = options.page || this.meta.nextPage;

      options = _.extend({}, options, {
        xhrSuccess: _.bind(this.parseLinkPagination, this)
      });

      return this.sync('read', this, options).then(function(models) {
        that.add(models, { parse: true });
        if (that.meta.hasMore) {
          that.meta.remainder = that.meta.totalCount - that.length;
        } else {
          that.meta.remainder = 0;
          that.meta.totalCount = that.length;
        }
      });
    },

    fetchAll: function(options) {
      options = options || {};

      if ('page' in options) {
        delete options.page;
      }

      this.meta.nextPage = 1;

      return (function fetch(collection) {
        return collection.fetchNext(options).then(function() {
          if (collection.meta.hasMore) {
            return fetch(collection);
          } else {
            return collection;
          }
        })
      })(this);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp/*, options*/) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
      this.resetMeta();
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    },

    toString: function() {
      return [ this.name, this.id || this.cid ].join('#');
    },

    parseLinkPagination: function(resp, status, jqXHR) {
      var nextLink, lastLink;
      var linkHeader = jqXHR.getResponseHeader('Link');
      var totalCountHeader = jqXHR.getResponseHeader('X-Total-Count');
      var meta = {
        totalCount: undefined,
        remainder: undefined
      };

      var extractLinks = function(link) {
        function getMatches(string, regex) {
          var matches = [];
          var match;

          while (match = regex.exec(string)) {
            matches.push({
              rel: match[2],
              href: match[1],
              page: parseInt(/page=(\d+)/.exec(match[1])[1], 10)
            });
          }

          return matches;
        }

        var links = getMatches(link, RegExp('<([^>]+)>; rel="([^"]+)",?\s*', 'g'));
        return links;
      };

      meta.link = extractLinks(linkHeader);

      nextLink = _.find(meta.link, { rel: 'next' });
      lastLink = _.find(meta.link, { rel: 'last' });

      meta.perPage = parseInt((/per_page=(\d+)/.exec(linkHeader) || [])[1] || 0, 10);
      meta.hasMore = !!nextLink;

      if (totalCountHeader) {
        meta.totalCount = parseInt(totalCountHeader, 10)
      }
      else if (lastLink) {
        meta.totalCount = meta.perPage * lastLink.page;
      }

      if (meta.totalCount !== undefined) {
        meta.remainder = meta.totalCount - this.models.length;
      }

      if (nextLink) {
        meta.nextPage = nextLink.page;
      }

      this.meta = meta;

      return meta;
    }
  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Pixy Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  Collection.setDefaultOptions = function(op, options) {
    _.extend(defaults[op], options);
  };

  return Collection;
});
define('pixy/core/history',[
  'underscore',
  '../namespace',
  '../util/extend',
  '../mixins/events'
], function(_, Pixy, extend, Events) {
  var $ = Pixy.$;

  // Pixy.History
  // ----------------

  var normalize = function(fragment) {
    if (!fragment) {
      fragment = '';
    }

    if (fragment[0] === '/') {
      fragment = fragment.slice(1);
    }

    return fragment;
  };

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  var _updateHash = function(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  };

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Pixy.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    /**
     * @cfg {Number} [trackerLimit=50]
     *
     * The maximum number of routes to keep track of.
     */
    trackerLimit: 50,

    /**
     * @property {String[]} routeHistory
     *
     * A history of the visited URIs during this Backbone session..
     */
    routeHistory: [],

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      // return normalize(fragment.replace(routeStripper, ''));
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Pixy.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        $(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        $(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }
    },

    // Disable Pixy.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      $(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    // route: function(route, callback) {
    //   this.handlers.unshift({route: route, callback: callback});
    // },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();

      console.debug('Hash/URL changed:', current)

      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }

      if (current === this.fragment) {
        return false;
      }

      if (this.onHashChange) {
        this.onHashChange(current);
      }

      if (this.iframe) {
        this.navigate(current);
      }
    },

    /**
     * Make history fire a 'navigate' event everytime it navigates and
     * track all the navigated routes.
     */
    navigate: function(fragment, options) {
      var hasChanged, rc;

      // fragment = normalize(fragment);
      // fragment = normalize(this.getFragment(fragment));
      fragment = this.getFragment(fragment);

      hasChanged = this.fragment !== fragment;

      if (!hasChanged) {
        return true;
      }

      rc = this.__navigate(fragment, options);

      if (_.last(this.routeHistory) !== fragment) {
        this.routeHistory.push(fragment);
      }

      if (this.routeHistory.length > this.trackerLimit) {
        this.routeHistory.splice(0,1);
      }

      /**
       * @event navigate
       *
       * Marks that the history object has just successfully navigated
       * to a new route.
       *
       * **This event is triggered on `Backbone`.**
       *
       * @param {String} fragment
       * The URI of the new route.
       */
      this.trigger('navigate', fragment);

      return rc;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    __navigate: function(fragment, options) {
      var url;

      if (!History.started) return false;

      if (!options) {
        options = {};
      }

      this.fragment = fragment;
      url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        _updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          _updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
    },

  });

  return new History();
});
/**
 * @class lodash
 *
 * Pibi.js lodash extensions.
 */
define('pixy/ext/underscore',[ 'underscore' ], function() {
  var defer = _.defer;

  /**
   * @method  defer
   *
   * Defers executing the `func` function until the current call stack has cleared.
   * Additional arguments will be passed to `func` when it is invoked.
   *
   * @param  {Function} func
   * The function to be deferred.
   *
   * @param  {Object} [thisArg=null]
   * The `this` context to apply the function as.
   *
   * @return {Number}
   * The timer id as returned by `setTimeout`.
   */
  _.defer = function(func, thisArg) {
    if (!thisArg) {
      return defer(func);
    }

    return defer(_.bind.apply(null, arguments));
  };

  return _;
});
define('pixy/config',[ './ext/underscore', './namespace', 'rsvp' ], function(_, Pixy, RSVP) {
  

  var extend = _.extend;

  /**
   * @class Config
   *
   * Configuration parameters that are required, or utilized, by different Pixy
   * modules to function correctly.
   *
   * Refer to each parameter for more info.
   */
  var Config = {};

  /**
   * @param {Boolean} [isAuthenticated=false]
   *
   * Required by Mixins.Routes.AccessPolicy
   *
   * @return {Boolean}
   *         Whether the current user is logged in (using an authentic session.)
   */
  Config.isAuthenticated = function() {
    return false;
  };

  /**
   * In case a route defines a view specification and not does specify a layout,
   * this method gives you a chance to provide a default layout name.
   *
   * Since this is a function, you get to provide different layouts based on
   * application state, like authentication.
   *
   * @see Mixins.Routes.Renderer
   *
   * @return {String}
   *         Name of the "default" layout the RendererMixin should render into
   *         if none was specified.
   */
  Config.getCurrentLayoutName = function() {
  };

  /**
   * @cfg {String} [defaultAccessPolicy]
   *
   * An access policy to assume for all routes that do not explicitly define
   * one. Used by Mixins.Routes.AccessPolicy.
   */
  Config.defaultAccessPolicy = undefined;

  /**
   * @cfg {String} [defaultWindowTitle]
   *
   * A string to use as a default window title for all routes that mix-in
   * Mixins.Routes.WindowTitle and do not specify a title.
   */
  Config.getDefaultWindowTitle = function() {
    return 'Pixy';
  };

  Config.getRootRoute = function() {
    return Pixy.routeMap.root;
  };

  Config.loadRoute = function(url, done) {
    return done();
  };

  Pixy.configure = function(config) {
    extend(Config, config);
  };

  return Config;
});
define('pixy/core/router',['require','router','../ext/jquery','rsvp','./history','../config'],function(require) {
  var RouterJS = require('router');
  var $ = require('../ext/jquery');
  var RSVP = require('rsvp');
  var locationBar = require('./history');
  var config = require('../config');

  var replaceState;
  var history = window.history;

  /**
   * @class Pixy.ApplicationRouter
   * @singleton
   *
   * A router.js singleton that manages routing throughout a Pixy app.
   */
  var router;

  /**
   * @internal
   * Normalize a route by adding a leading slash if necessary.
   */
  function normalize(url) {
    url = String(url || '');

    if (url[0] !== '/') {
      url = '/' + url;
    }

    return url;
  }

  /**
   * @internal
   */
  function transitionTo(rawUrl) {
    return router.loadAndTransitionTo(rawUrl);
  }

  /**
   * @internal
   */
  function interceptLink(e) {
    var consumed = $.consume(e);

    transitionTo($(e.currentTarget).attr('href'));

    return consumed;
  }

  router = new RouterJS['default']();

  router.loadAndTransitionTo = function(rawUrl, followRedirects) {
    var svc = RSVP.defer();
    var url = normalize(rawUrl);

    config.loadRoute(url, function onLoad() {
      var transition = router.transitionTo(url);

      console.log('Route bundle for', rawUrl, 'has been loaded. Transitioning...');

      if (followRedirects) {
        svc.resolve(transition.followRedirects());
      }
      else {
        svc.resolve(transition);
      }

      console.debug('\t', transition);
    });

    return svc.promise;
  };

  router.updateURL = function(url) {
    console.info('History URL has changed to:', url);

    this.navigate(url, {
      silent: true,
      trigger: false,
      replace: replaceState
    });

    replaceState = false;
  }.bind(locationBar);

  /**
   * Start the routing engine.
   *
   * @param {Object} options
   *
   * @param {String} [options.root="/"]
   *        Root URL to route from.
   *
   * @param {Boolean} [options.pushState=false]
   *        Whether to use pushState or hash-based routing.
   *
   * @param {Boolean} [options.preload=false]
   *        When true, the router will automatically fire the current route
   *        once the engine has been started.
   *
   * @param {String} [options.locale=null]
   *        If present, the URL root will be prefixed by the locale you specify.
   *        For example, pass in "en" to make the root at "/en/".
   *
   * @return {RSVP.Promise}
   */
  router.start = function(options) {
    var root;
    var initialRoute, search;

    if (!this.getHandler) {
      throw "#getHandler() must be defined before starting the router!";
    }

    options = options || {};

    root = options.root || '/';

    if (options.locale) {
      root += options.locale;
    }

    // Location changes via the back/forward browser buttons
    locationBar.onHashChange = function(url) {
      console.debug('Hash/URL changed:', normalize(url));
      replaceState = true;
      transitionTo(url);
    };

    // Start the history tracker
    locationBar.start({
      pushState: options.pushState,
      root: root,
      silent: true
    });

    // Route all non-external links
    $(document).on('click.appRouter', 'a[href^="/"][target!=_blank]', interceptLink);

    if (!options.preload) {
      return RSVP.resolve();
    }

    initialRoute = normalize(locationBar.fragment);
    search = locationBar.location.search;

    replaceState = true;

    return this.loadAndTransitionTo(initialRoute, true).then(function() {
      // Restore the search query parameters, if there were any:
      if (options.pushState && history.pushState) {
        history.replaceState({}, document.title,
          root + normalize(locationBar.fragment) + search);
      }
    });
  };

  /**
   * Stop the routing engine. Visiting local links will no longer do anything.
   */
  router.stop = function() {
    $(document).off('click.appRouter');
    locationBar.onHashChange = null;
    locationBar.stop();
  };

  return router;
});
define('pixy/util/get',[], function() {
  var get = function(attr, callback) {
    var _attr = this[attr];

    // promise property
    if (_attr && _attr.promise) {
      console.assert(callback && callback.call,
        "You must provide a callback to yield with a promise attribute: " + attr);

      return _attr.promise.then(callback.bind(this));
    }
    // function property
    else if (_attr && this[attr].call) {
      return this[attr].call(this);
    }
    else {
      return _attr;
    }
  };

  return get;
});
define('pixy/core/registry',[ 'underscore', '../object' ], function(_, PObject) {
  var defineProperty = Object.defineProperty;

  /**
   * @class Pixy.Registry
   * @extends Pixy.Object
   *
   * A centralized repository for managing Pixy entities arbitrarily
   * and setting up explicit relationships between them.
   *
   * Entities (like Models, Collections, and Views) are added to the repository
   * as soon as they are created, and from then on, external code can hook into
   * the repository to manage them.
   *
   * Glossary:
   *
   *   - Entity: an object that will be used as either a module or a dependant
   *   of a module. Entities can be anything really, not tied to Pixy
   *   entities, however, Module entities must define a listener interface.
   *   - Module: a *singleton* entity that can emit events, and has other
   *   entities that depend on it
   */
  var Registry = PObject.extend({
    name: 'Registry',
    dependencies: [],

    targets: [ 'model', 'collection', 'view', 'router', 'object' ],

    options: {
      mute: true
    },

    constructor: function() {
      this.reset();
    },

    destroy: function() {
      this.reset();
    },

    /**
     * Register a given (singleton) entity as a Module that tracks dependencies.
     *
     *     Declaration format:
     *     {
     *       "module": "uniqueModuleName"
     *     }
     *
     * @param  {String} moduleId
     *         The module's id.
     *
     * @param  {Mixed} entity
     *         The entity to be registered as a module.
     */
    registerModule: function(moduleId, module) {
      var entry;

      entry = this.moduleEntry(moduleId);
      entry.module = module;

      this.debug('Module defined:', entry.id);

      this.resolve(entry);
    },

    /**
     * Specify a dependency between two modules. The dependant will be assigned
     * with a reference to the requested module once that module has been
     * registered.
     *
     * Dependencies are defined in a special `requires` key.
     *
     *     @example
     *
     *     var User = Pixy.Model.extend({
     *       module: 'user'
     *     });
     *
     *     var Creature = Pixy.Model.extend({
     *       requires: [ 'user', 'controller' ],
     *
     *       initialize: function() {
     *         this.user; // => User
     *         this.controller; // => Controller
     *       }
     *     });
     *
     * In the example above, Creature objects will be defined as dependants on
     * the user and controller singleton modules.
     *
     * @param {String} moduleId A unique module id.
     * @param {Object} entity The dependant object.
     *
     * @throws {Error}
     *         If the dependant has a defined attribute named as the
     *         moduleId but doesn't resolve to the module entity.
     */
    addDependency: function(moduleId, dependant) {
      var entry;
      var module;

      entry = this.moduleEntry(moduleId);

      // Track the dependant
      entry.dependants.push(dependant);

      this.debug('dependency:', '[' + dependant + '] => [' + entry.id + ']');

      if (dependant.toString() === 'Router') {
        this.debug(dependant);
      }
      else if (dependant.toString().match(/object/)) {
        this.debug(dependant);
      }

      // Expose the module to the dependant:
      //
      // The dependant can now do things like:
      //
      //     this.user.doThings()
      //
      module = entry.module;

      if (module) {
        this.resolve(entry);
      }
    },

    get: function(moduleId) {
      if (!this.modules[moduleId]) {
        return undefined;
      }

      return this.modules[moduleId].module;
    },

    /**
     * Resolve the dependencies in a given module entry by assigning a reference
     * to the module in each dependant.
     *
     * The module will be notified of each dependant in #onDependency if it
     * implements the method.
     *
     * Finally, the resolved dependency will be un-tracked to free references so
     * the GC can clean up properly.
     *
     * @private
     */
    resolve: function(entry) {
      var moduleId = entry.id;
      var module = entry.module;
      var wantsCallback;
      var resolved = [];
      var registrationCallback = this.mkModuleId('init with ' + moduleId);
      var that = this;

      if (_.isEmpty(entry.dependants)) {
        return [];
      }

      wantsCallback = _.isFunction(module.onDependency);

      _.each(entry.dependants, function(dependant) {
        if (dependant[moduleId] && dependant[moduleId] != module) {
          throw moduleId + ' is already assigned in ' + dependant;
        }

        defineProperty(dependant, moduleId, {
          get: function() {
            return that.modules[moduleId].module;
          }
        });

        if (dependant[registrationCallback]) {
          dependant[registrationCallback](module);
        }

        if (wantsCallback) {
          module.onDependency(dependant);
        }

        resolved.push(dependant.toString());
      });

      this.debug(module + ' =>', resolved.length, 'dependencies have been resolved (',
        resolved.join(', '), ')');

      // Untrack them
      entry.dependants = [];

      return resolved;
    },

    /**
     * Parse module or dependencies declarations in a given resource.
     *
     * If the object contains a `module` key, then it will be registered as a
     * module.
     *
     * If the object contains a `dependencies` array, then each module in that
     * array will be tracking this resource as a dependant.
     *
     * @private
     *
     * @param  {Object} resource The object to test.
     */
    checkObject: function(resource) {
      if (resource.module) {
        this.registerModule(resource.module, resource);
      }

      if (_.isArray(resource.requires)) {
        _.each(resource.requires, function(moduleId) {
          this.addDependency(moduleId, resource);
        }, this);
      }
    },

    /**
     * Create (or retrieve) a entry entry for a given module. These entries
     * keep track of the module object, its id, status, dependencies,
     * and callbacks.
     *
     * @private
     *
     * @param  {String} id
     *         A unique module id.
     * @param  {Object} module
     *         The module object.
     *
     * @return {Object} The module entry.
     */
    moduleEntry: function(moduleId) {
      var entry;

      moduleId = this.mkModuleId(moduleId);
      entry = this.modules[moduleId];

      if (!entry) {
        entry = this.modules[moduleId] = {
          id: moduleId,
          module: null,
          dependants: []
        };
      }

      return entry;
    },

    mkModuleId: function(id) {
      if (!_.isString(id)) {
        throw "Bad module declaration '" + JSON.stringify(id) + "' (expected a String)";
      }

      return (id || '').
        replace(/\s/g, '_').
        replace(/_+/g, '_').
        underscore().
        camelize(true);
    },

    reset: function() {
      this.modules = {};
    },

    unregister: function(moduleId) {
      delete this.modules[this.mkModuleId(moduleId)];
    }
  });

  return new Registry();
});
define('pixy/route',[
  'underscore',
  './util/extend',
  './util/get',
  './namespace',
  './core/registry',
  './core/router',
  './mixins/events'
], function(_, extendPrototype, get, Pixy, Registry, Router, Events) {
  var extend = _.extend;
  var omit = _.omit;
  var pick = _.pick;
  var pluck = _.pluck;
  var compact = _.compact;
  var keys = _.keys;

  /**
   * @property {Object} routeMap
   * @private
   *
   * A map of the registered route handlers.
   */
  var routeMap = {};
  var lifeCycleHooks = [ 'beforeModel', 'model', 'afterModel', 'enter', 'exit' ];
  var eventHooks = [ 'willTransition', 'didTransition' ];
  var allHooks = lifeCycleHooks.concat(eventHooks);

  var registerRoute = function(name, route) {
    routeMap[name] = route;
  };

  var EventedMixin = {
    exit: function() {
      this.stopListening();
    }
  };

  /**
   * @class Pixy.Route
   *
   * A router.js target handler.
   *
   * @param {String} name (required)
   *        A unique name for the route that will be defined in the routeMap.
   *
   * @param {Object} proto
   *        Your route definition.
   *
   * @param {Boolean} [dontRegister=false]
   *        Pass false if you don't want the route to be automatically
   *        registered in the app route map.
   *
   * Refer to the router.js documentation for handler definitions:
   *
   *     https://github.com/tildeio/router.js
   *
   * ### Mixins
   *
   * Route objects support mixins on the life-cycle hook level. Any mixins that
   * you include in a route will have their life-cycle hooks run _before_ the
   * one that your route implementation defines, giving them the chance to
   * completely bypass your implementation.
   *
   * This is particularly useful for having an authentication mixin.
   *
   * A mixin's life-cycle hook will abort execution of others only if it returns
   * anything other than undefined. You can make use of router.js's propagation
   * of errors by returning a rejected RSVP.Promise, or by throwing an Error,
   * which will be triggered as an event up the chain of routes.
   *
   * Example:
   *
   *     var ProtectedRouteMixin = {
   *       beforeModel: function(transition) {
   *         if (!this.authenticated) {
   *           transition.abort();
   *           this.transitionTo('/login');
   *           return false;
   *         }
   *       }
   *     };
   *
   *     var MyRoute = new Pixy.Route('privateRoute', {
   *       mixins: [ ProtectedRouteMixin ],
   *
   *       beforeModel: function() {
   *         // this will only be called if the mixin's beforeModel doesn't
   *         // reject
   *       },
   *
   *       setup: function() {
   *         // now we're sure we're authenticated
   *       }
   *     })
   *
   * ### Registry
   *
   * Routes are automatically checked-in with the Pixy.Registry and support
   * the "requires" attribute to specify dependencies.
   *
   * Example
   *
   *     var BudgetShowRoute = new Pixy.Route('budgetShow', {
   *       requires: [ 'user' ],
   *
   *       model: function(id) {
   *         // you can use the resolved user dependency now:
   *         return this.user.budgets.get(id);
   *       }
   *     });
   */
  function Route(name, proto, dontRegister) {
    var inheritedProps = extend(this, proto);
    var ownPropKeys = keys(inheritedProps);
    var hooks = pick(inheritedProps, lifeCycleHooks);
    var mixins = inheritedProps.mixins || [];
    var mixinProps, mixinMethods;

    // Don't mix this in if it had already been mixed-in to a parent route.
    if (mixins.indexOf(EventedMixin) === -1) {
      mixins.push(EventedMixin);
    }

    mixinProps = mixins.reduce(function(methods, mixin) {
      var mixinProps = mixin.mixinProps;

      
      extend(methods, mixinProps);
      return methods;
    }, {});

    extend(this, omit(mixinProps, ownPropKeys), {
      name: name
    });

    lifeCycleHooks.forEach(function(hookName) {
      var hook = hooks[hookName];
      var mixinHooks = compact(pluck(mixins, hookName));
      var mixinHooksSz = mixinHooks.length;

      this[hookName] = function() {
        var rc, i;

        // Call all mixin hooks, if any explicitly returns false, abort.
        for (i = 0; i < mixinHooksSz; ++i) {
          rc = mixinHooks[i].apply(this, arguments);

          if (rc !== undefined) {
            return rc;
          }
        }

        // Call our own hook, if defined.
        if (hook) {
          return hook.apply(this, arguments);
        }
      };

      this['__' + hookName] = hook;
    }.bind(this));

    mixins.filter(function(mixin) {
      return !!mixin.initialize;
    }).forEach(function(mixin) {
      mixin.initialize.call(this);
    }.bind(this));

    if (!dontRegister) {
      registerRoute(name, this);
    }

    Registry.checkObject(this);

    return this;
  }

  extend(Route.prototype, Events, {
    get: get,

    transitionTo: Router.transitionTo.bind(Router),
    replaceWith: Router.replaceWith.bind(Router),
    trigger: Router.trigger.bind(Router),

    toString: function() {
      return this.name;
    },

    modelFor: function(routeName) {
      console.assert(routeMap[routeName], 'No route by name of "' + routeName + '"');
      return routeMap[routeName].context;
    },

    /**
     * Reload the model you resolved earlier in #model().
     *
     * @return {RSVP.Promise|Any}
     *         Whatever your #model() returned.
     */
    reload: function() {
      return this.__model();
    },

    injectStoreError: function(action, actionIndex, storeError) {
      if (arguments.length === 2) {
        storeError = actionIndex;
        actionIndex = action;
      }

      this.trigger('storeError', {
        actionIndex: actionIndex,
        error: storeError
      });
    },
  });

  Route.extend = extendPrototype.withoutMixins;

  Pixy.routeMap = routeMap;
  Pixy.registerRoute = registerRoute;

  return Route;
});
define('pixy/util/wrap_array',[],function() {
  return function wrapArray(array) {
    return Array.isArray(array) ? array : [ array ];
  }
});
define('pixy/store',['require','underscore','./mixins/logger','./mixins/events','./core/dispatcher','./core/registry','./util/extend','./util/wrap_array','rsvp','inflection'],function(require) {
  var _ = require('underscore');
  var Logger = require('./mixins/logger');
  var Events = require('./mixins/events');
  var Dispatcher = require('./core/dispatcher');
  var Registry = require('./core/registry');
  var extendPrototype = require('./util/extend');
  var wrapArray = require('./util/wrap_array');
  var RSVP = require('rsvp');
  var InflectionJS = require('inflection');

  var extend = _.extend;
  var keys = _.keys;
  var CHANGE_EVENT = 'change';
  var ACTION_SUCCESS_EVENT = 'actionSuccess';
  var ACTION_ERROR_EVENT = 'actionError';
  var RESPONSE_JSON = 'responseJSON';

  function actionSuccessEventName(action) {
    if (!action) {
      return undefined;
    }

    return [ ACTION_SUCCESS_EVENT, action ].join(':');
  }

  function actionErrorEventName(action) {
    if (!action) {
      return undefined;
    }

    return [ ACTION_ERROR_EVENT, action ].join(':');
  }

  function onPayload(action) {
    var handler;

    if (action.storeKey === this._key) {
      handler = this.actions[action.id];
    }

    return new RSVP.Promise(function(resolve, reject) {
      var onChange = this._actionEmitter(action, resolve);
      var onError = this._errorPropagator(action, reject);

      if (handler) {
        try {
          handler.call(this, action.payload, onChange, onError);
        } catch(error) {
          onError(error);
        }
      }
      else {
        this.onAction(action.type, action.payload, onChange, onError);
        resolve();
      }

    }.bind(this));
  }

  function bind(store, event, callback, context) {
    if (context && context.listenTo) {
      context.listenTo(store, event, callback);
    } else {
      store.on(event, callback, context);
    }
  }

  function unbind(store, event, callback, context) {
    if (context && context.listenTo) {
      context.stopListening(store, event, callback);
    } else {
      store.off(event, callback, context);
    }
  }

  /**
   * @class Pixy.Store
   *
   * An implementation of the Flux Data Store objects.
   */
  var Store = function(name, schema) {
    var key;
    var onAction = onPayload.bind(this);

    extend(this, schema, {
      name: name
    });

    if (!this._key) {
      key = this._key = name.underscore().replace(/_store$/, '').pluralize().camelize(true);
    }
    else {
      key = this._key;
    }

    Dispatcher.register(onAction);
    Dispatcher.registerHandler(key, onAction);

    keys(this.actions).forEach(function(actionId) {
      Dispatcher.registerActionHandler(actionId, key);
    });

    Registry.checkObject(this);

    if (this.initialize) {
      this.initialize();
    }
  };


  extend(Store.prototype, Logger, Events, {
    name: 'GenericStore',
    actions: {},

    /**
     * Notify all subscribed listeners that the store's data has been updated.
     */
    emitChange: function(attr, value) {
      this.debug('Broadcasting change.');

      if (attr) {
        this.trigger('change:' + attr, value);
      }

      this.trigger(CHANGE_EVENT);
    },

    emitActionSuccess: function(action, actionIndex) {
      this.debug('Broadcasting action success:', action);
      this.trigger(actionSuccessEventName(action), actionIndex, action);
      this.trigger(ACTION_SUCCESS_EVENT, action, actionIndex);
    },

    /**
     * Notify subscribers that an error was raised performing a specific store
     * action.
     *
     * @param  {String} action
     *         Name of the action in which the error was raisde.
     *
     * @param  {Integer} actionIndex
     *         The action index generated by the dispatcher.
     *
     * @param  {Object} error
     *         The error.
     */
    emitActionError: function(action, actionIndex, error) {
      this.warn('Broadcasting action error:', action, '#', actionIndex);
      this.warn(error, (error && error.stack ? error.stack : undefined));

      this.trigger(actionErrorEventName(action), actionIndex, error);
      this.trigger(ACTION_ERROR_EVENT, action, actionIndex, error);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback, thisArg) {
      bind(this, CHANGE_EVENT, callback, thisArg);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback, thisArg) {
      unbind(this, CHANGE_EVENT, callback, thisArg);
    },

    /**
     * Register an action success handler for a specific store action.
     *
     * @param {String}   action
     * @param {Function} callback
     */
    addActionSuccessListener: function(actions, callback, thisArg) {
      var that = this;
      wrapArray(actions).forEach(function(action) {
        bind(that, actionSuccessEventName(action), callback, thisArg);
      });
    },

    removeActionSuccessListener: function(action, callback, thisArg) {
      unbind(this, actionSuccessEventName(action), callback, thisArg);
    },

    /**
     * Register an error handler for a specific store action.
     *
     * @param {String}   action
     *        A specific action to listen to for errors. Errors caused in other
     *        actions will not be dispatched to your callback.
     *
     * @param {Function} callback
     */
    addActionErrorListener: function(action, callback, thisArg) {
      bind(this, actionErrorEventName(action), callback, thisArg);
    },

    removeActionErrorListener: function(action, callback, thisArg) {
      unbind(this, actionErrorEventName(action), callback, thisArg);
    },

    /**
     * Register an error handler to be called on any store action error.
     *
     * @param {Function} callback
     */
    addErrorListener: function(callback, thisArg) {
      bind(this, ACTION_ERROR_EVENT, callback, thisArg);
    },

    removeErrorListener: function(callback, thisArg) {
      unbind(this, ACTION_ERROR_EVENT, callback, thisArg);
    },

    /**
     * @protected
     *
     * Dispatcher callback for this store. This is where you receive the payload
     * from the dispatcher and get a chance to handle the action if you know how
     * to.
     *
     * @param  {String} action
     *         Unique action id. Usually identified by a constant.
     *
     * @param  {Object} payload
     *         Action-specific parameters.
     *
     * @param {Function} onError
     *        Call this if your handler was unable to process the action.
     *        See #_errorPropagator for more information.
     */
    onAction: function(/*action, payload, onError*/) {
    },

    /**
     * @private
     *
     * @note This is automatically generated for you and passed as an argument
     *       to #onAction.
     *
     * @param {Object} action
     *        The action specification.
     *
     * @param {String} action.type (required)
     *        Unique name of the action.
     *
     * @param {Integer} action.index (required)
     *        Action instance identifier as generated by the dispatcher.
     *
     * @return {Function}
     *         An "onError" function to pass to your action handler so that it
     *         calls it if it couldn't process the action.
     *
     *         The callback receives a single argument which should be an object
     *         describing your error.
     *
     *         The callback will emit the appropate action error.
     */
    _errorPropagator: function(action, reject) {
      return function(error) {
        if (error && _.isObject(error) && RESPONSE_JSON in error) {
          error = error.responseJSON;
        }

        this.emitActionError(action.type, action.index, error);
        reject(error);
      }.bind(this);
    },

    _actionEmitter: function(action, resolve) {
      return function(attr, value) {
        this.emitActionSuccess(action.type, action.index);
        this.emitChange(attr, value);
        resolve(arguments.length === 2 ? value : attr);
      }.bind(this);
    },

    toString: function() {
      return this.name;
    }
  });

  Store.extend = extendPrototype;

  return Store;
});
define('pixy/logging_context',[ 'underscore', './mixins/logger' ], function(_, Logger) {
  

  /**
   * @class Pixy.LoggingContext
   *
   * A free-form logger object. You can instantiate a logging context with
   * a certain name, and utilize the Pixy.Logger facilities on it.
   *
   * @example
   *
   *     var boot;
   *     boot = new Pixy.LoggingContext('Boot');
   *     boot.debug('loading data'); // => console.debug('Boot: loading data')
   */
  var LoggingContext = function(name) {
    this.toString = function() { return name; }
  };

  _.extend(LoggingContext.prototype, Logger);

  return LoggingContext;
});
define('pixy/core/cache',[
  'underscore',
  '../namespace',
  '../object',
  '../model',
  '../deep_model',
  '../collection',
], function(_, Pixy, PObject, Model, DeepModel, Collection) {
  

  var useCache = false;
  var hasCache = false;
  var adapter;
  var result = function(object, prop, thisArg) {
    if (typeof object[prop] === 'function') {
      return object[prop].call(thisArg || this);
    } else {
      return object[prop];
    }
  };

  var CacheEvents = {
    Model: {
      updateOn: 'sync',
      purgeOn:  'clear destroy'
    },

    Collection: {
      updateOn: 'add sync remove',
      purgeOn:  'reset'
    }
  };

  /**
   * @ignore
   */
  var shouldUseCache = function(options) {
    options = options || {};

    if (options.noCache) {
      return false;
    }

    return options.useCache === void 0 ?
      hasCache && useCache :
      hasCache && options.useCache;
  };

  /**
   * @ignore
   */
  var parseEvents = function(that) {
    var
    defaultEvents = _.clone(that._cacheEvents),
    updateOn      = that.cache.updateOn || that.cache.events,
    purgeOn       = that.cache.purgeOn;

    if (that.cache.updateOn === void 0) {
      updateOn = defaultEvents.updateOn;
    }

    if (that.cache.purgeOn === void 0) {
      purgeOn = defaultEvents.purgeOn;
    }

    return { updateOn: updateOn, purgeOn: purgeOn };
  };

  /**
   * @class Pixy.Cacheable
   *
   * Modules that can be transparently persisted into a storage layer.
   *
   * **This interface should not be used directly, use Pixy.CachePlugin instead.**
   */
  var Cacheable = {
    addCacheListeners: function() {
      if (!this.cache.manual) {
        // var events = parseEvents(this);
        var events = this._cacheEvents;

        if (events.updateOn) {
          this.on(events.updateOn, this.updateCacheEntry, this);
        }

        if (events.purgeOn) {
          this.on(events.purgeOn, this.purgeCacheEntry, this);
        }

        return true;
      }
    },

    removeCacheListeners: function() {
      if (!this.cache.manual) {
        // var events = parseEvents(this);
        var events = this._cacheEvents;

        if (events.updateOn) {
          this.off(events.updateOn, this.updateCacheEntry, this);
        }

        if (events.purgeOn) {
          this.off(events.purgeOn, this.purgeCacheEntry, this);
        }

        return true;
      }
    },

    /**
     * A cache-enabled drop-in for Pixy#fetch.
     *
     * Looks up the cache for an entry for this resource and calls back
     * the appropriate handlers detailed below.
     *
     * **This is not an async OP.**
     *
     * > You can reference `options.cached` in your handlers to tell whether
     * > the response was pulled out of the cache or from the remote endpoint.
     *
     * @param {Object} [options={}]
     * Regulard Pixy request options construct, with special callbacks.
     *
     * @param {Function} [options.success]
     * A function to be called when a cached version was found.
     * @param {Object} options.success.data
     * The cached response.
     * @param {Object} options.success.options
     * The request options.
     *
     * @param {Function} [options.error]
     * A function to be called when no cached version is available.
     * @param {Mixed} options.error.resource
     * The resource being cached.
     * @param {Object} options.error.options
     * The request options.
     *
     * @param {Function} [options.complete]
     * A function to be called when fetch completes, with either status.
     * @param {Mixed} options.complete.resource
     * The resource being cached.
     * @param {Object} options.complete.options
     * The request options.
     */
    fetchCached: function(options) {
      options = options || {};
      options.cached = true;
      options.transport = 'localStorage';
      options.data = this.getCacheEntry();

      return Pixy.sync.call(this, 'read', this, options);
    },

    /**
     * Retrieve the cached version (if any) of this resource.
     *
     * @return {Object/null}
     * The cached JSON entry for this resource, or `null` when the adapter isn't
     * available.
     */
    getCacheEntry: function() {
      var key;

      if (!hasCache) {
        return null;
      }

      key = result(this.cache, 'key', this);

      return adapter.get(key);
    },

    /**
     * Create or update the cache entry.
     *
     * The entry can be 'namespaced' based on the cache.usePrefix variable.
     * If set to `true`, the `cache.key` will be used as a namespace, and if
     * set to a String or a Function, the value will be used as a namespace.
     *
     * @note
     * This is a no-op if caching for this resource has been disabled,
     * the adapter isn't available, or the resource cache key does not evaluate
     * to true.
     */
    updateCacheEntry: function(resource, response, options) {
      var prefix;
      var data = {};
      var key = result(this.cache, 'key', this);

      if (this.cacheDisabled || !hasCache || !key) {
        return this;
      }
      else if (options && options.cached) {
        return this;
      }

      // Resolve the entry prefix
      if (this.cache.usePrefix) {
        if (_.isBoolean(this.cache.usePrefix)) {
          prefix = result(this.cache, 'key', this);
        }
        else {
          prefix = result(this.cache, 'usePrefix', this);
        }

        data[prefix] = this.toJSON();
      }
      else {
        data = this.toJSON();
      }

      
      adapter.set(key, data);

      return this;
    },

    /**
     * Remove the cache entry (if any).
     *
     * @note
     * This is a no-op if caching for this resource has been disabled,
     * the adapter isn't available, or the resource cache key does not evaluate
     * to true.
     */
    purgeCacheEntry: function() {
      var key = result(this.cache, 'key', this);

      if (this.cacheDisabled || !shouldUseCache({}) || !key) {
        return this;
      }

      adapter.remove(key);

      return this;
    },

    /**
     * Freezes the cache entry. Updates and purges will no longer go through.
     *
     * This is particularly helpful for collections when you know you'll be
     * modifying the resource heavily while resetting or fetching, so you can
     * choose to disable caching prior to fetching, and re-enable it once all
     * the models have been added.
     *
     * This is a no-op if caching was already disabled for this resource.
     *
     * See #enableCaching
     */
    disableCaching: function() {
      if (!this.cacheDisabled) {
        this.cacheDisabled = true;
        console.warn(this.toString() + ': caching disabled.');
      }

      return this;
    },

    /**
     * Updates and purges of the cache entry will once again be processed.
     *
     * This is a no-op if caching was not disabled for this resource.
     *
     * See #disableCaching
     */
    enableCaching: function() {
      if (this.cacheDisabled) {
        delete this.cacheDisabled;
      }

      return this;
    }
  };

  /**
   * @class Pixy.CacheableModel
   * @extends Pixy.Model
   * @mixins Pixy.Cacheable
   */
  var CacheableModel = {
    /**
     * Sync the model with the server version, and update the cache entry
     * unless #manual or options.cached are enabled.
     */
    sync: function(op, resource, options) {
      options = options || {};

      if (op === 'read') {
        var success = options.success;
        var useCache = shouldUseCache(options);
        var that = this;

        options.success = function(data, options) {
          var out = success && success(data, options);

          if (!options.cached && !that.cache.manual) {
            that.updateCacheEntry();
          }

          return out;
        };

        if ( useCache ) {
          return this.fetchCached(options);
        }
      }

      return this._noCache.sync.apply(this, arguments);
    },

    /**
     * Update the model's cache entry unless options.silent is on, or
     * this.cache.manual is on.
     *
     * Delegates to Pixy.Model#set.
     */
    set: function(key, value, options) {
      var out = this._noCache.set.apply(this, arguments);

      if (!key) {
        return out;
      }

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (_.isObject(key)) {
        options = value;
      }

      options = options || {};

      if (!this._changing && !options.silent && !this.cache.manual) {
        this.updateCacheEntry();
      }

      return out;
    },

    clear: function() {
      if (!this.cache.manual) {
        this.purgeCacheEntry();
      }

      return this._noCache.clear.apply(this, arguments);
    }
  };

  /**
   * @class Pixy.CacheableCollection
   * @extends Pixy.Model
   * @mixins Pixy.Cacheable
   */
  var CacheableCollection = {
    /**
     * Updates the cache entry on successful non-cache requests.
     *
     * On 'use cache' requests, this method intercepts #fetch and returns a cached
     * version, otherwise the original #fetch is delegated.
     *
     * Caching is disabled during the fetch operation.
     *
     * See Cacheable#shouldUseCache
     */
    sync: function(op, resource, options) {
      options = options || {};

      if (op == 'read') {
        var that = this;
        var success = options.success;
        var complete = options.complete;
        var useCache = shouldUseCache(options);
        var oldXhrSuccess = options.xhrSuccess;

        // update the pagination meta if we're using the cached version
        options.xhrSuccess = function() {
          oldXhrSuccess.apply(this, arguments);

          if (!options.cached) {
            that.meta.cached = false;
          } else {
            that.meta.totalCount = that.length;
            that.meta.remainder = 0;
            that.meta.cached = true;
          }
        };

        options.success = function() {
          var out;

          if (success) {
            out = success.apply(success, arguments);
          }

          // Cache the response if the collection supports caching and the response
          // wasn't pulled from the cache.
          if (!options.cached) {
            that.updateCacheEntry();
          }

          return out;
        };

        options.complete = function() {
          that.addCacheListeners();

          if (complete) {
            return complete.apply(complete, arguments);
          }
        };

        this.removeCacheListeners();

        // Should we get a cached version?
        if ( useCache ) {
          return this.fetchCached(options);
        }
      }

      return this._noCache.sync.apply(this, arguments);
    }
  };

  var Cacheables = {
    Model: CacheableModel,
    Collection: CacheableCollection
  };

  /**
   * @class Pixy.Plugin.Cache
   * @extends Pixy.Plugin
   *
   * A caching layer for Pixy models and collections.
   */
  var Cache = PObject.extend({
    name: 'Cache',

    options: {
      preloadingEnabled: true,
      events: {}
    },

    constructor: function(options) {
      options = options || {};

      var ensureKlassName = function(klass, klassName) {
        if (!klass.prototype.klass) {
          klass.prototype.klass = klassName;
        }
      };

      var trackOverriddenMethods = function(klass, cacheableName) {
        var methodId;
        var proto = klass.prototype;
        var cacheable = Cacheables[cacheableName];

        proto._noCache = {};

        for (methodId in cacheable) {
          proto._noCache[methodId] = proto[methodId];
        }
      };

      _.merge(CacheEvents, this.options.events, options.events);

      ensureKlassName(Model, 'Model');
      ensureKlassName(Collection, 'Collection');

      trackOverriddenMethods(Model, 'Model');
      trackOverriddenMethods(Collection, 'Collection');
    },

    destroy: function() {
      _.each([ Model, Collection ], function(klass) {
        delete klass.prototype._noCache;
        delete klass.prototype.klass;
      });
    },

    makeCacheable: function(entity) {
      // Cache-enabled objects must have a 'cache' object defined.
      if (!entity.cache || !_.isObject(entity.cache)) {
        return;
      }

      var klass = entity.klass;
      var klassEvents = CacheEvents[klass];
      var klassCacheableInterface = Cacheables[klass];

      // The next part deals with resolving conflicts between method overrides:
      //
      // If the entity has defined any of the methods we'll be overriding,
      // we must track the instance methods instead of the prototype ones
      // in the _noCache key, otherwise the instance methods will never be
      // called.
      //
      // It's good to keep in mind that there may be 3 versions of each method:
      //
      // - the prototype base version
      // - the instance override/implementation version
      // - the Cacheable version
      //
      // Chain goes like Cacheable -> Instance -> Prototype
      var instanceMethods = [];
      for (var cacheableMethod in klassCacheableInterface) {
        if (entity[cacheableMethod]) {
          instanceMethods.push( cacheableMethod );
        }
      }

      if (instanceMethods.length) {
        // Start with the prototype methods, and override as needed
        //
        // Important: must use _.clone, otherwise we'll be overriding the methods
        // for _all_ instances of this class
        entity._noCache = _.clone(Pixy[klass].prototype._noCache);

        _.each(instanceMethods, function(idMethod) {
          // Use instance version
          entity._noCache[idMethod] = entity[idMethod];
        });
      }

      // Mixin the Cacheable interface(s)
      _.extend(entity, Cacheable, klassCacheableInterface, {
        _cacheEvents: _.clone(klassEvents)
      });

      entity._cacheEvents = parseEvents(entity);
      entity.addCacheListeners();

      // Preload cached data, if requested.
      if (entity.cache.preload && this.options.preloadingEnabled) {
        var preload = function() {
          if (!hasCache) {
            console.error('can not preload', entity.id, 'as cache is not available.');
            return;
          }

          entity.set(entity.getCacheEntry());
        };

        hasCache ? preload() : _.defer(preload) /* try later */;
      }

      // console.log('added cache listeners:', entity._cacheEvents);
      // this.log('entity#', entity.id || entity.name, 'is now cacheable.');
    },

    /**
     * Install a storage adapter to use as a caching persistence layer.
     *
     * The adapter must provide an implementation of the methods outlined below:
     *
     * **Note**:
     *
     * I don't think it's possible to test whether the adapter actually
     * conforms to the argument types without an external tool, so my best bet
     * is to say that the behaviour is undefined if the adapter *does* implement
     * the methods but does not accept the expected arguments.
     *
     * @param {Object} in_adapter
     *
     * A storage adapter which must provide an implementation of the methods
     * outlined below.
     *
     * @param {Function} in_adapter.set       A method for storing records.
     * @param {String} in_adapter.set.key     The key to use for storing the record.
     * @param {Mixed} in_adapter.set.value    The value to store.
     *
     * @param {Function} in_adapter.get       A method for retrieving records.
     * @param {String} in_adapter.get.key     The record key.
     *
     * @param {Function} in_adapter.remove    A method for removing records.
     * @param {String} in_adapter.remove.key  Key of the record to remove.
     *
     * @param {Function} in_adapter.clear     Clear all stored records.
     *
     * @fires adapter_installed
     */
    setAdapter: function(in_adapter) {
      // Make sure the adapter adopts an interface we can use.
      _.each([ 'set', 'get', 'remove', 'clear' ], function(required_method) {
        var method = in_adapter[required_method];

        if (!_.isFunction(method)) {
          throw new TypeError([
            this.name, 'bad adapter: missing method implemention #',
            required_method
          ].join(' '));
        }
      });

      adapter = in_adapter;

      /**
       * @event adapter_installed
       *
       * A caching adapter has been installed for use to cache Pixy entities.
       *
       * **This event is triggered on Pixy.Cache.**
       *
       * @param {Pixy.Cache} Cache
       * Pixy.Cache plugin instance (`this`).
       *
       * @param {Object} adapter
       * The cache adapter that has been installed.
       */
      return this.trigger('adapter_installed', this, adapter);
    },

    getAdapter: function() {
      return adapter;
    },

    /**
     * Tell the plug-in whether the cache adapter is available for use.
     *
     * IE, localStorage might not be supported on the current browser, in which
     * case you should pass false and caching will be transparently disabled.
     *
     * @fires available
     */
    setAvailable: function(flag) {
      this.__ensureAdapterSet();

      hasCache = flag;

      /**
       * @event available
       *
       * A storage adapter has been installed and Pixy.Cache is ready to
       * be used.
       *
       * @param {Pixy.Cache} Cache
       * The (`this`) Pixy.Cache plugin instance.
       */
      return this.trigger('available', this);
    },

    /**
     * Whether an adapter is installed and is available for use.
     *
     * @note
     * An adapter being available does not necessarily mean that caching will
     * be enabled. The adapter must be both available and the plugin enabled
     * for caching to be enabled.
     *
     * See #isEnabled
     */
    isAvailable: function() {
      this.__ensureAdapterSet();

      return hasCache;
    },

    /**
     * If available,
     *
     * @note An adapter must be set first using #setAdapter.
     *
     * @fires enabled
     */
    enable: function() {
      if (!this.isEnabled() && (useCache = this.isAvailable())) {

        /**
         * @event enabled
         *
         * A storage adapter is available and the plugin was disabled, and has
         * just been enabled.
         *
         * @param {Pixy.Cache} Cache
         * The (`this`) Pixy.Cache plugin instance.
         */
        this.trigger('enabled', this);
      }

      return this;
    },

    /**
     * Turn off caching for all modules.
     *
     * @fires disabled
     */
    disable: function() {
      useCache = false;

      /**
       * @event disabled
       *
       * Pixy entities will no longer be cached.
       *
       * @param {Pixy.Cache} Cache
       * The (`this`) Pixy.Cache plugin instance.
       */
      return this.trigger('disabled', this);
    },

    /**
     * Whether an adapter is set, is available, and the plugin (and caching) enabled.
     */
    isEnabled: function() {
      return this.isAvailable() && useCache;
    },

    /** @private */
    __ensureAdapterSet: function() {
      if (!adapter) {
        throw this.name + ': you must set an adapter first! use #setAdapter';
      }
    }
  });

  return new Cache();
});
define('pixy/core/mutator',[ 'underscore', '../object', '../namespace' ], function(_, PObject, Pixy) {
  /**
   * @class Pixy.Mutator
   * @extends Pixy.Object
   *
   * A repository of object mutations that can be applied to specific types of
   * objects, such as making them cacheable, or inheriting parent attributes.
   */
  var Mutator = PObject.extend({
    name: 'Mutator',

    targets: [ 'model', 'collection', 'view', 'router', 'object' ],

    constructor: function() {
      this.reset();
      _.forEach(this.targets, this.__sniff, this);
    },

    add: function(options) {
      options = _.extend({}, {
        priority: 100,
        stage: 'after'
      }, options);

      if (!_.isFunction(options.mutation)) {
        console.error('Missing required mutation function. Options passed:', options);
        throw 'Missing required "mutation" function';
      }

      if (!_.contains([ 'before', 'after' ], options.stage)) {
        throw 'Invalid mutation stage "' + options.stage + '", can either be ' +
          ' "before" or "after"';
      }

      _.each(options.targets, function(target) {
        var set = this.mutations[options.stage][target];

        if (!set) {
          throw 'Unknown mutation target "' + target + '"';
        }

        set.push({
          name: options.name,
          mutation: options.mutation,
          stage: options.stage,
          priority: options.priority
        });
      }, this);
    },

    destroy: function() {
      this.stopListening(Pixy);
      this.reset();
    },

    reset: function() {
      this.mutations = _.reduce(this.targets, function(mutations, target) {
        mutations.before[target] = [];
        mutations.after[target] = [];
        return mutations;
      }, { before: {}, after: {} }) || {};
    },

    __sniff: function(target) {
      var before = this.mutations.before;
      var after = this.mutations.after;

      this.listenTo(Pixy, target + ':creating', function(object) {
        this.__run(object, before[target], target);
      });

      this.listenTo(Pixy, target + ':created', function(object) {
        this.__run(object, after[target], target);
      });
    },

    __run: function(object, mutations, objectType) {
      var that = this;

      // console.info("Applying", mutations.length, "mutations on", object);
      _.chain(mutations).sortBy('priority').each(function(entry) {
        try {
          entry.mutation(object, objectType);
        } catch(e) {
          that.warn('Exception caught in mutation "' + entry.name + '":');
          console.error(e.stack || e.message);
        }
      });
    }
  });

  return new Mutator();
});
define('pixy/util/inherit',[ 'underscore' ], function(_) {
  var inheritArrayAttribute = function(object, key, value) {
    var parent = Object.getPrototypeOf(object);
    var objectValue;

    value = value || [];

    if (parent) {
      value = inheritArrayAttribute(parent, key, value);
    }

    // Avoid null/undefined values
    objectValue = _.result(object, key);

    if (objectValue) {
      value = _.union(value, objectValue);
    }

    return value;
  };

  var inheritAttribute = function(object, key, value) {
    var parent = Object.getPrototypeOf(object);

    value = value || {};

    if (parent) {
      inheritAttribute(parent, key, value);
    }

    _.merge(value, _.result(object, key));

    return value;
  };

  return function(object, key, dontOverride, isArray) {
    var options;
    var inherited;

    if (_.isObject(dontOverride)) {
      options = dontOverride;
    }
    else {
      // legacy compat.
      options = {
        dontOverride: dontOverride,
        isArray: isArray
      };
    }

    inherited = options.isArray ?
      inheritArrayAttribute(object, key, []) :
      inheritAttribute(object, key, {});

    if (!options.dontOverride) {
      object[key] = inherited;
    }

    return inherited;
  };
});
define('pixy/mutations/attribute_inheritance',[ 'underscore', '../util/inherit' ], function(_, Inherit) {
  

  /**
   * @class Backbone.Plugin.Inherits
   * @extends Backbone.Plugin
   *
   * Enables inheritance of attributes for any Backbone resource.
   */
  return {
    stage: 'before',
    targets: [ 'model', 'view', 'collection', 'router' ],
    priority: 1,
    mutation: function(resource) {
      var chain = Inherit(resource, 'inherits', true, true);

      if (chain && chain.length) {
        _.each(chain, function(attr) {
          var isArray = attr[0] == '@';

          if (isArray) {
            attr = attr.substr(1);
          }

          Inherit(resource, attr, false, isArray);
        });
      }
    }
  };
});
define('pixy/mutations/caching',[ 'underscore', '../core/cache' ], function(_, Cache) {
  

  /**
   * @class Backbone.Plugin.Inherits
   * @extends Backbone.Plugin
   *
   * Enables inheritance of attributes for any Backbone resource.
   */
  return {
    stage: 'before',
    targets: [ 'model', 'collection' ],
    priority: 100,
    mutation: function(resource) {
      // Cache-enabled objects must have a 'cache' object defined.
      if (!_.isObject(resource.cache)) {
        return;
      }

      Cache.makeCacheable(resource);
    }
  };
});
define('pixy/mutations/registration',[ '../core/registry' ], function(Registry) {
  

  /**
   * @class Backbone.Plugin.Inherits
   * @extends Backbone.Plugin
   *
   * Enables inheritance of attributes for any Backbone resource.
   */
  return {
    stage: 'after',
    priority: 100,
    targets: [ 'model', 'collection', 'view', 'router', 'object' ],
    mutation: function(resource) {
      Registry.checkObject(resource);
    }
  };
});
define('pixy/mixins/filterable_collection',[
  'underscore',
  '../collection',
  '../model'
], function(_, Collection, Model) {
  

  function extractByValue(attr, value) {
    return attr !== value;
  }

  var Filter = Model.extend({
    idAttribute: 'name',

    defaults: {
      attr: '',
      value: null
    },

    fn: function() {},

    toString: function() {
      return [ this.get('attr'), this.get('value') ].join(' -> ');
    }
  });

  var initialize = function() {
    _.extend(this, {
      _filters: new Collection({ model: Filter }),
      _fmodels: []
    });

    this.filterOptions = this.filterOptions || {};

    _.defaults(this.filterOptions, {
      resetOn: 'fetch reset'
    });

    this.on(this.filterOptions.resetOn, this.resetFilters, this);
    this.resetFilters();
  };

  /**
   * @class Backbone.Filterable
   * @alternateClassName Filterable
   *
   * Backbone.Collection add-on that enables soft-filtering of a collection's models.
   */
  var Filterable = {

    /**
     * Define a new attribute filter.
     *
     * @param {String} attr
     *   The model attribute the filter will be tested on.
     *
     * @param {Mixed} value
     *   The attribute value the filter will apply on. If you provide your own
     *   condition callback, this value will be passed to the callback along
     *   with the model to do your own testing.
     *
     * @param {Object} options
     *   Filtering options, see details.
     *
     * @param {Function} [options.condition]
     *   A custom filter function, the default condition is a basic value
     *   equality (operator==) test.
     */
    addFilter: function(attr, value, options) {
      var condition;
      var filter;

      options = options || {};
      condition = options.condition || extractByValue;

      filter = this._filters.add({
        name: options.name || attr,
        attr: attr,
        value: value
      }).last();

      filter.fn = condition;

      return this;
    },

    removeFilter: function(name) {
      var filter = this._filters.get(name);

      this.log('Filter removed:', filter);
      this._filters.remove(filter);

      return this;
    },

    /**
     * Filter out all models based on the active added filters.
     *
     * The filtered models will be hidden from all collection operations until
     * the filters are manually reset.
     *
     * See #addFilter for adding filters.
     */
    applyFilters: function() {
      if (!this._filters.length) {
        if (this._fmodels.length) {
          return this.resetFilters();
        }

        return this;
      }

      /**
       * @event filtering
       *
       * Triggered when the collection is about to apply its filters.
       *
       * @param {Filterable} this
       *        The filterable collection.
       */
      this.trigger('filtering', this);

      this._filters.each(function(filter) {
        var filtered = [];
        var invert = this._filtersInverted;

        this.each(function(model) {
          var isFiltered = filter.fn(
            model.get(filter.get('attr')),
            filter.get('value'),
            model);

          if (invert) {
            isFiltered = !isFiltered;
          }

          if (isFiltered) {
            filtered.push(model);
          }
        });

        _.each(filtered, function(model) {
          /**
           * @event filter_applied
           *
           * Triggered on each model of the collection that has been filtered.
           *
           * @param {Backbone.Model} model
           *   The model in this collection that was filtered.
           */
          model.trigger('filter:applied', model);
          this.remove(model);
          this._fmodels.push(model);
        }, this);
      }, this);

      /**
       * @event filtered
       *
       * Triggered when the collection has applied all active filters.
       *
       * @param {Filterable} this
       *   The collection that has been filtered.
       */
      this.trigger('filtered', this);
      // this.debug('Filtered.');

      return this;
    },

    /**
     * Cancel the filtering effect by restoring the collection to its earlier
     * state.
     *
     * @emit unfiltering
     */
    resetFilters: function(options) {
      options = options || {};

      /**
       * @event unfiltering
       *
       * Triggered when the collection is about to cancel its filters.
       *
       * @param {Filterable} this
       *        The filterable collection.
       */
      if (!options.silent) {
        this.trigger('unfiltering', this);
      }

      if (this._fmodels.length) {
        _.each(this._fmodels, function(model) {
          this.add(model);

          /**
           * @event filter_reset
           *
           * Triggered on each model of the collection that was previously
           * filtered, and now is restored.
           *
           * @param {Backbone.Model} model
           *   The model in this collection that was restored.
           */
          model.trigger('filter:reset', model);
        }, this);

      }

      this._fmodels = [];
      this._filters.reset();

      /**
       * @event unfiltered
       *
       * Triggered when the collection has cancelled all active filters.
       *
       * @param {Filterable} this
       *   The collection that has been unfiltered.
       */
      if (!options.silent) {
        this.trigger('unfiltered', this);
        // this.debug('Unfiltered.');
      }

      return this;
    },

    /**
     * @return {Boolean}
     *         Whether any filters are defined.
     */
    hasFilters: function() {
      return !!this._filters.length;
    },

    /**
     * Invert filters so their outcome gets negated.
     *
     * @param {Boolean} flag
     *        True to invert, false to cancel the inversion.
     */
    invertFilters: function(flag) {
      this._filtersInverted = flag;
    }
  };

  return function(collection) {
    _.extend(collection, Filterable);
    initialize.apply(collection, []);
  };
});
define('pixy/mixins/routes/access_policy',[ '../../config', 'rsvp' ], function(Config, RSVP) {
  var RC_PASS = void 0;

  var logTransition = function(transition) {
    return [ transition.intent.url, transition.targetName ].join(' => ');
  };

  /**
   * @class Mixins.Routes.AccessPolicy
   *
   * @requires Config
   */
  return {
    mixinProps: {
      /**
       * @cfg {"public"|"private"} accessPolicy
       *
       * Set to "public" if you don't want this route to be visited by a user
       * that is logged-in.
       *
       * Set to "private" to restrict access to the route to logged-in users.
       *
       * Unset to skip the access policy checks, then routes can be visited
       * at any time.
       *
       * @see Config.defaultAccessPolicy
       */
      accessPolicy: Config.defaultAccessPolicy,

      isAccessible: function() {
        var isAuthenticated = Config.isAuthenticated();

        if (this.accessPolicy === 'public' && isAuthenticated) {
          return false;
        }
        else if (this.accessPolicy === 'private' && !isAuthenticated) {
          return false;
        }
        else {
          return true;
        }
      }
    },

    beforeModel: function(transition) {
      if (this.isAccessible()) {
        return RC_PASS;
      }
      else if (this.accessPolicy === 'public' ) {
        console.warn('Over-privileged access to:', logTransition(transition));
        return RSVP.reject('Overauthorized');
      }
      else {
        console.warn('Unprivileged access to:', logTransition(transition));
        return RSVP.reject('Unauthorized');
      }
    }
  };
});
define('pixy/mixins/routes/loading',[], function() {
  var canTrigger = function(transition) {
    return !!transition.router.currentHandlerInfos;
  };

  /**
   * @class Mixins.Routes.Loading
   *
   * Trigger a "loading" event as soon as the route starts resolving its model,
   * and another once it's been resolved.
   *
   * You must define a "loading" event handler to make use of this. For example,
   * to show a progress indicator.
   */
  return {
    model: function(params, transition) {
      if (!canTrigger(transition) || !this.__model) {
        return;
      }

      this.trigger('loading', true);
      this._loading = true;
      console.info(this.name, 'Loading');
    },

    afterModel: function(/*model, transition*/) {
      if (!this._loading) {
        return;
      }

      console.info(this.name, 'Hiding loading status.');
      this._loading = false;
      this.trigger('loading', false);
    }
  };
});
define('pixy/mixins/routes/props',[ 'underscore', '../../config' ], function(_, Config) {
  var uniq = _.uniq;
  var keys = _.keys;
  var rootRoute;

  /** @internal */
  var extractKeys = function(oldKeys, newProps) {
    return uniq(keys(newProps).concat(oldKeys || []));
  };

  var setProps = function(props, route, callback) {
    if (!rootRoute) {
      rootRoute = Config.getRootRoute();
    }

    console.assert(rootRoute, 'You must assign a root route that responds to' +
    ' #update and #ready() to use the PropsMixin.');

    // We need to be sure that the layout has been mounted before we attempt
    // to update the props.
    //
    // This is really smelly but it's necessary.
    rootRoute.ready(function() {
      route.trigger('update', props);

      if (callback) {
        callback.call(route);
      }
    });
  };

  /**
   * @class Mixins.Routes.Props
   *
   * Utility for injecting props into the master layout.
   *
   * The mixin automatically takes care of cleaning up any props you inject
   * after the route exits.
   */
  return {
    mixinProps: {
      /** @internal  */
      _propKeys: [],

      update: function(props) {
        setProps(props, this, function() {
          // Track the injected props so we can clean them up on exit.
          this._propKeys = extractKeys(this._propKeys, props);
        });
      },
    },

    afterModel: function(model) {
      this.context = this.context || model;
    },

    exit: function() {
      var props = this._propKeys.reduce(function(props, key) {
        props[key] = undefined;
        return props;
      }, {});

      setProps(props, this);
      this.context = undefined;
    }
  };
});
define('pixy/mixins/routes/renderer',[ '../../config' ], function(Config) {
  /**
   * @class Mixins.Routes.Renderer
   *
   * Convenience mixin for mounting and unmounting components into layouts and
   * outlets automatically when a route is entered and exitted.
   *
   * ### Usage example
   *
   * Here's an example of an Index page that utilizes three outlets: content,
   * the toolbar, and the sidebar.
   *
   *     new Pixy.Route('transactionIndex', {
   *       views: [
   *         { component: Listing },
   *         { component: Sidebar, outlet: 'sidebar' },
   *         { component: Toolbar, outlet: 'toolbar' }
   *       ]
   *     })
   *
   * Here's another example of rendering into a different layout, say "dialogs":
   *
   *     new Pixy.Route('login', {
   *       views: [{ component: Dialog, into: 'dialogs' }]
   *     })
   */
  var RendererMixin = {
    mixinProps: {
      /**
       * @property {Object[]} views
       *           Your view listing.
       *
       * @property {React.Class} views.component (required)
       *           A renderable React component.
       *
       * @property {String} [views.into]
       *           Layout to mount the component in. If unspecified, the proper
       *           layout based on the authentication status will be used (guest
       *           or member).
       *
       * @property {String} [views.outlet="content"]
       *           Sugar for defining the "outlet" option for OutletLayouts.
       *
       * @property {Object} [views.options={}]
       *           Any custom options to pass to the layout.
       */
      views: [],

      /**
       * Manually mount a component.
       *
       * See Pixy.Mixins.LayoutManagerMixin#add for the parameters.
       */
      mount: function(component, layoutName, options) {
        this.trigger('render', component, layoutName, options);
      },

      /**
       * Unmount a previously-mounted component.
       *
       * See Pixy.Mixins.LayoutManagerMixin#remove for the parameters.
       */
      unmount: function(component, layoutName, options) {
        this.trigger('remove', component, layoutName, options);
      },

      shouldUnmount: function() {
        return true;
      }
    },

    /**
     * @internal Mount defined components.
     */
    enter: function() {
      var mount = this.mount.bind(this);
      var specs = this.views.reduce(function(specs, spec) {
        var layoutName = spec.into;
        var layoutOptions = spec.options || {};

        if (!spec.into) {
          // store the current layout name in the spec so we can properly
          // unmount from the same layout on #exit()
          layoutName = spec.into = Config.getCurrentLayoutName();

          console.assert(layoutName,
            "RendererMixin: you must specify a layout name using 'into' or" +
            " define Pixy.Config#getCurrentLayoutName().");
        }

        if (spec.outlet) {
          layoutOptions.outlet = spec.outlet;
          // again, store it for the same reason as above
          spec.options = layoutOptions;
        }

        return specs.concat({
          component: spec.component,
          layoutName: layoutName,
          options: layoutOptions
        });
      }, []);

      this.trigger('renderMany', specs);
    },

    /**
     * @internal Unmount components mounted in #enter().
     */
    exit: function() {
      var unmount;

      if (this.shouldUnmount()) {
        unmount = this.unmount.bind(this);

        this.views.forEach(function(spec) {
          unmount(spec.component, spec.into, spec.options);
        });
      }
    }
  };

  return RendererMixin;
});
define('pixy/mixins/routes/secondary_transitions',[ 'underscore' ], function(_) {
  

  var pluck = _.pluck;
  var slice = Array.prototype.slice;

  /**
   * @internal Returning undefined will not interrupt execution of route/mixins.
   */
  var RC_PASS;

  /**
   * @internal Returning true will.
   */
  var RC_INTERRUPT = true;

  /**
   * @internal Set of routes that have been guarded.
   *
   * Need to keep track of these so we can release at the right time, see notes
   * on #willTransition.
   */
  var guarded;

  /** @internal */
  function log(router) {
      }

  /** @internal */
  function isSecondary(route) {
    return route.isSecondary;
  }

  /** @internal */
  function isPrimary(route) {
    return !isSecondary(route);
  }

  /** @internal */
  function guard(route) {
    log(route, "transitioning to a secondary route, I won't re-load on next enter.");

    route._contextResolved = true;
    route._previousContext = route._context;
  }

  /** @internal */
  function isGuarded(route) {
    return route._contextResolved === true;
  }

  /**
   * @internal This method is re-entrant.
   */
  function release(route) {
    log(route, "releasing guards");

    route._contextResolved = route._context = route._previousContext = null;
  }

  /**
   * @class Mixins.Routes.SecondaryTransitions
   *
   * This mixin allows routes to be aware of "secondary" ones that should not
   * interrupt the life-cycle of the current, primary one.
   *
   * A route is considered secondary if it defines a "secondary" property
   * with a truthy value.
   *
   * The use case for this mixin is with dialog routes interrupting the
   * execution of the current base route. The expected behavior is that entering
   * a dialog route should not cause the base one to #exit(), and when the
   * dialog route exits, the base one should not need to restart its life-cycle
   * and re-resolve its models, etc.
   *
   * ### Gotchas
   *
   * The mixin has a few assumptions about your route that you should probably
   * be aware of (and adhere to:)
   *
   *  - your model resolution happens in #model()
   *  - your setup and teardown routines happen in #enter() and #exit()
   *    respectively
   *
   * ### Internals
   *
   * The mixin listens to the "willTransition" event, and checks the destination
   * route of the transition. If that's a secondary one, it will guard the
   * life-cycle hooks of the current route and all its parent up to the pivot
   * handler until the route is re-entered.
   *
   * Once re-entered, the mixin will release its guards and restore the route
   * to its normal behavior.
   *
   * The guards are released in the following situations:
   *
   *   - the route has transitioned to a secondary route, then was re-entered
   *   - the route has transitioned to a secondary route, which has transitioned
   *     to a different primary route
   *   - the route has transitioned to another primary route
   */
  return {

    /**
     * @private
     *
     * @return {Any} What-ever was returned in the last call to #model().
     */
    model: function() {
      if (isGuarded(this)) {
        log(this, "I'm considering myself already loaded.");
        return this._previousContext;
      }
    },

    /**
     * @private
     *
     * Cache the model resolved in #model(), because router.js discards the
     * context once the route is exited.
     */
    afterModel: function(model/*, transition*/) {
      if (isPrimary(this)) {
        this._context = model;
      }
    },

    /**
     * @private If guarded, interrupt this one call and then release the guards.
     */
    enter: function() {
      if (isGuarded(this)) {
        log(this, '\tblocking #enter');
        release(this);
        return RC_INTERRUPT;
      }
    },

    /**
     * @private
     */
    exit: function() {
      if (isGuarded(this)) {
        log(this, '\tblocking #exit');
        return RC_INTERRUPT;
      }
    },

    willTransition: function(transition) {
      var router = transition.router;
      var targetHandler = router.getHandler(transition.targetName);
      var pivotHandler = transition.pivotHandler;

      // we're transitioning to a secondary route (case #1) so install the
      // guard and keep a reference to the guarded routes so we can handle
      // case #2
      if (isSecondary(targetHandler) && isPrimary(this)) {
        guarded = pluck(router.currentHandlerInfos, 'handler');
        guarded.forEach(guard);

        return RC_PASS;
      }

      // reset if we're transitioning to a primary route other than the one
      // we had guarded
      if (guarded && isPrimary(targetHandler) && !isGuarded(targetHandler)) {
        guarded.forEach(release);
        guarded.forEach(function(route) {
          // Don't call exit() on the pivot handler, it should never be exited
          // unless the router switches off.
          if (route !== pivotHandler) {
            route.exit();
          }
        });
        guarded = undefined;
      }
    }
  };
});
define('pixy/mixins/routes/window_title',[ '../../config' ], function(Config) {
  var previousTitle;

  /**
   * @class Mixins.Routes.WindowTitle
   *
   * Set a custom document title while a route is active.
   *
   * @see Config.defaultWindowTitle
   *
   * ### Example usage
   *
   *     define('i18n!transactions/index', function(t) {
   *       new Pixy.Route('transactionsIndex', function() {
   *         windowTitle: function() {
   *           return t('windowTitle', 'Transactions - Pibi');
   *         }
   *       });
   *     });
   */
  return {
    mixinProps: {
      /**
       * @property {String|#call} [windowTitle]
       *
       * A string, or a function that returns a string to use as the document
       * title.
       *
       * You should probably i18nize the title in a function.
       *
       * @see Config.defaultWindowTitle
       */
      windowTitle: function() {
        return Config.getDefaultWindowTitle();
      }
    },

    enter: function() {
      var title = this.get('windowTitle');

      if (title) {
        previousTitle = document.title;
        document.title = title;
      }
    },

    exit: function() {
      if (previousTitle) {
        document.title = previousTitle;
        previousTitle = null;
      }
    }
  };
});
define('pixy/mixins/routes',[
  './routes/access_policy',
  './routes/loading',
  './routes/props',
  './routes/renderer',
  './routes/secondary_transitions',
  './routes/window_title',
], function(
  AccessPolicy,
  Loading,
  Props,
  Renderer,
  SecondaryTransitions,
  WindowTitle) {
  var exports = {};

  exports.AccessPolicy = AccessPolicy;
  exports.Loading = Loading;
  exports.Props = Props;
  exports.Renderer = Renderer;
  exports.SecondaryTransitions = SecondaryTransitions;
  exports.WindowTitle = WindowTitle;

  return exports;
});
define('pixy/mixins/react',['require','./react/layout_manager_mixin','./react/layout_mixin','./react/stacked_layout_mixin','./react/actor_mixin'],function(require) {
  var exports = {};

  exports.LayoutManagerMixin = require('./react/layout_manager_mixin');
  exports.LayoutMixin = require('./react/layout_mixin');
  exports.StackedLayoutMixin = require('./react/stacked_layout_mixin');
  exports.ActorMixin = require('./react/actor_mixin');

  return exports;
});
define('pixy/mixins',['require','./mixins/routes','./mixins/react'],function(require) {
  var exports = {};

  exports.Routes = require('./mixins/routes');
  exports.React = require('./mixins/react');

  return exports;
});
define('pixy/main',['require','underscore','inflection','rsvp','./ext/react','./ext/jquery','router','./namespace','./object','./model','./deep_model','./collection','./core/router','./route','./store','./logging_context','./core/registry','./core/cache','./core/dispatcher','./core/mutator','./mutations/attribute_inheritance','./mutations/caching','./mutations/registration','./mixins/filterable_collection','./mixins/logger','./mixins'],function(require) {
  var _ = require('underscore');
  var InflectionJS = require('inflection');
  var RSVP = require('rsvp');
  var React = require('./ext/react');
  var $ = require('./ext/jquery');
  var RouterJS = require('router');
  var Pixy = require('./namespace');
  var PixyObject = require('./object');
  var PixyModel = require('./model');
  var PixyDeepModel = require('./deep_model');
  var PixyCollection = require('./collection');
  var PixyRouter = require('./core/router');
  var PixyRoute = require('./route');
  var PixyStore = require('./store');
  var PixyLoggingContext = require('./logging_context');
  var PixyRegistry = require('./core/registry');
  var PixyCache = require('./core/cache');
  var PixyDispatcher = require('./core/dispatcher');
  var PixyMutator = require('./core/mutator');
  var AttributeInheritanceMutation = require('./mutations/attribute_inheritance');
  var CachingMutation = require('./mutations/caching');
  var RegistrationMutation = require('./mutations/registration');
  var FilterableCollection = require('./mixins/filterable_collection');
  var PixyLogger = require('./mixins/logger');
  var Mixins = require('./mixins');

  Pixy.Object = PixyObject;
  Pixy.Model = PixyModel;
  Pixy.DeepModel = PixyDeepModel;
  Pixy.Collection = PixyCollection;
  Pixy.Route = PixyRoute;
  Pixy.Store = PixyStore;
  Pixy.Logger = PixyLogger;
  Pixy.LoggingContext = PixyLoggingContext;

  // Singletons
  Pixy.Mutator = PixyMutator;
  Pixy.Registry = PixyRegistry;
  Pixy.Cache = PixyCache;
  Pixy.Dispatcher = PixyDispatcher;
  Pixy.ApplicationRouter = PixyRouter;

  Pixy.Mutator.add(AttributeInheritanceMutation);
  Pixy.Mutator.add(CachingMutation);
  Pixy.Mutator.add(RegistrationMutation);

  Pixy.Mixins = Mixins;

  console.info("Pixy", Pixy.VERSION, "initialized.");

  Pixy.start = function() {
    return PixyRouter.start()
  };

  return Pixy;
});
define('pixy',["pixy/main"], function (Pixy) { return Pixy; });
