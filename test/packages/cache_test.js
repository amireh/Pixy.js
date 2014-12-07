define([ 'store' ], function(store) {
  describe('Pixy.Cache', function() {
    this.serverSuite = true;

    Pixy.Cache.setAdapter(store);
    Pixy.Cache.setAvailable(true);

    var CacheableModel = Pixy.Model.extend(Pixy.Mixins.Cacheable, {
      cache: {
        key: 'spec_model',
      },

      url: '/spec_models'
    });

    var CacheableCollection = Pixy.Collection.extend(Pixy.Mixins.Cacheable, {
      model: CacheableModel,
      cache: {
        key: 'spec_models'
      },

      url: '/spec_models'
    });

    beforeEach(function() {
      Pixy.Cache.enable();
      Pixy.Cache.getAdapter().clear();
    });

    afterEach(function() {
      Pixy.Cache.getAdapter().clear();
      Pixy.Cache.disable();
    });

    describe('Configuration', function() {
      it('should #parseEvents', function() {
        o = new Pixy.Model();

        o.cache = {
          key: 'spec_model',
          updateOn: 'foo',
          purgeOn:  'bar zee'
        };

        Pixy.Cache.makeCacheable(o);

        expect(o.cache.manual).toBeFalsy();
        expect(o._cacheEvents).toEqual({
          updateOn: 'foo',
          purgeOn: 'bar zee'
        });

        o.removeCacheListeners();
        spyOn(o, 'updateCacheEntry');
        spyOn(o, 'purgeCacheEntry');
        o.addCacheListeners();

        o.trigger('foo', o);
        expect(o.updateCacheEntry).toHaveBeenCalled();

        o.trigger('zee');
        expect(o.purgeCacheEntry).toHaveBeenCalled();
      });
    });

    describe('Caching a Model', function() {
      var o;

      beforeEach(function() {
        o = new CacheableModel();
      });

      afterEach(function() {
        o = null;
      });

      it('should store and pull a cached version', function() {
        expect( o.getCacheEntry() ).toEqual({});

        spyOn(o, 'updateCacheEntry').and.callThrough();

        o.save({
          fruit: 'apple'
        });

        expect( o.updateCacheEntry ).toHaveBeenCalled();
        expect( o.getCacheEntry() ).toEqual({
          fruit: 'apple'
        });
      });

      it('should update cached version on #save', function() {
        spyOn(o, 'updateCacheEntry');

        o.save({
          fruit: 'apple'
        });

        expect( o.updateCacheEntry ).toHaveBeenCalled();
      });

      it('should pull the cached version on #fetch', function() {
        spyOn(o, 'fetchCached');

        o.fetch({
          useCache: true
        });

        expect( o.fetchCached ).toHaveBeenCalled();
      });

      it('should pull remotely if no cached version is available', function() {
        this.respondWith('GET', '/spec_models', Fixtures.XHR(200, {
          name: 'bonkers'
        }));

        spyOn(o, 'getCacheEntry').and.returnValue(null);
        spyOn(o, 'fetchCached').and.callThrough();

        o.fetch({
          useCache: true
        }).catch(function() {
          console.debug('woops, ')
          return o.fetch({ useCache: false });
        });

        this.respond();

        expect(o.getCacheEntry).toHaveBeenCalled();
        expect(o.fetchCached).toHaveBeenCalled();
        expect(o.get('name')).toEqual('bonkers');
      });


      it('should clear its cache entry', function() {
        expect( Pixy.Cache.getAdapter().get(o.cache.key) ).toEqual({});

        o.save({
          fruit: 'apple'
        });
        expect( Pixy.Cache.getAdapter().get(o.cache.key) ).toEqual({
          fruit: 'apple'
        });

        o.purgeCacheEntry();
        expect( Pixy.Cache.getAdapter().get(o.cache.key) ).toBeFalsy();
      });

      describe('Controlling caching', function() {
        it('should not update its cache entry when disabled', function() {
          var original = o.getCacheEntry();

          o.disableCaching();
          o.save({
            fruit: 'apple'
          });

          expect( o.getCacheEntry() ).toEqual(original);

          o.enableCaching();
          o.save({
            fruit: 'apple'
          });

          expect( o.getCacheEntry() ).not.toEqual(original);
        });

        it('should not update its cache entry when unavailable', function() {
          Pixy.Cache.setAvailable(false);

          var original = o.getCacheEntry();

          o.save({
            fruit: 'apple'
          });

          expect( o.getCacheEntry() ).toEqual(original);

          Pixy.Cache.setAvailable(true);

          o.save({
            fruit: 'apple'
          });

          expect( o.getCacheEntry() ).not.toEqual(original);
        });
      });
    });

    describe('Caching a Collection', function() {
      var collection;

      beforeEach(function() {
        collection = new CacheableCollection();
      });

      afterEach(function() {
        collection = null;
      });

      it('should start clean', function() {
        expect( collection.getCacheEntry() ).toBeFalsy();
      });

      it('should update its entry on @add', function() {
        collection.removeCacheListeners();
        spyOn(collection, 'updateCacheEntry').and.callThrough();
        collection.addCacheListeners();

        collection.add([{
          fruit: 'apple'
        }]);

        expect(collection.updateCacheEntry).toHaveBeenCalled();
        expect(collection.getCacheEntry()).toEqual([{
          fruit: 'apple'
        }]);
      });

      it('should update its entry on @fetch', function() {
        this.server.respondWith('GET', '/spec_models', Factories.XHR(200, [
          { fruit: 'apple' }
        ]));

        collection.removeCacheListeners();
        spyOn(collection, 'updateCacheEntry').and.callThrough();
        collection.addCacheListeners();

        collection.fetch({ useCache: false });

        this.respond();

        expect(collection.updateCacheEntry).toHaveBeenCalled();
        expect(collection.getCacheEntry()).toEqual([{
          fruit: 'apple'
        }]);
      });
    });

    describe('Hooks', function() {
      var o;
      this.promiseSuite = true;

      beforeEach(function() {
        o = new CacheableModel();
      });

      afterEach(function() {
        o = null;
      });

      it('should update on Model#sync', function() {
        o.removeCacheListeners();
        spyOn(o, 'updateCacheEntry');
        o.addCacheListeners();

        o.fetch({
          noCache: true,
          // it will error out, there's no /spec_models API endpoint
          // so we'll run the success handler manually
          error: function(model, response, options) {
            options.success(response, options);
            called = true;
          }
        });

        this.respond();

        expect( o.updateCacheEntry ).toHaveBeenCalled();
      });

      it('should update on Model#set', function() {
        o.removeCacheListeners();
        spyOn(o, 'updateCacheEntry');
        o.addCacheListeners();

        o.set({
          fruit: 'apple'
        });

        expect( o.updateCacheEntry ).toHaveBeenCalled();
      });

      it('should not update on Model#set when @silent is on', function() {
        o.removeCacheListeners();
        spyOn(o, 'updateCacheEntry');
        o.addCacheListeners();

        o.set({
          fruit: 'apple'
        }, { silent: true });

        expect( o.updateCacheEntry ).not.toHaveBeenCalled();
      });

      it('should update on Model#clear', function() {
        o.removeCacheListeners();
        spyOn(o, 'purgeCacheEntry');
        o.addCacheListeners();

        o.clear();

        expect( o.purgeCacheEntry ).toHaveBeenCalled();
      });

      it('should update on Model#destroy', function() {
        o.removeCacheListeners();
        spyOn(o, 'purgeCacheEntry');
        o.addCacheListeners();

        o.destroy();

        expect( o.purgeCacheEntry ).toHaveBeenCalled();
      });

    })
  });
})
