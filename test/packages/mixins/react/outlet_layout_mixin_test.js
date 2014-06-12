define([ 'pixy/ext/react' ], function(React) {
  describe('React.addons.LayoutManagerMixin', function() {
    var container;

    beforeEach(function() {
      container = document.createElement('div');
    });

    afterEach(function() {
      React.unmountComponentAtNode(container);

      if (container.remove) {
        container.remove();
      }
    });

    describe('React.addons.OutletLayoutMixin', function() {
      var Component = React.createClass({
        displayName: 'Component',
        componentDidMount: function() {},
        componentWillUnmount: function() {},
        render: function() {
          return React.DOM.div({ id: 'banana' });
        }
      });

      var MasterLayout = React.createClass({
        displayName: 'MasterLayout',
        mixins: [ React.addons.LayoutManagerMixin ],

        statics: {
          getLayout: function() {
            return Layout;
          }
        },

        render: function() {
          return React.DOM.div({}, [
            this.renderLayout(Layout, { ref: 'childLayout' }, true)
          ]);
        }
      });

      var Layout = React.createClass({
        displayName: 'Layout',
        mixins: [ React.addons.LayoutMixin ],
        statics: {
          availableOutlets: function() {
            return [ 'content', 'toolbar' ];
          }
        },

        getDefaultProps: function() {
          return {
          };
        },

        render: function() {
          return React.DOM.div({}, [
            React.DOM.aside({ id: 'toolbar' }, this.renderOutlet('toolbar')),
            React.DOM.main({ id: 'content' }, this.renderOutlet('content'))
          ]);
        }
      });

      it('should add a view to a layout outlet', function() {
        var renderSpy = spyOn(Component.type.prototype, 'render').and.callThrough();
        var mountSpy = spyOn(Component.type.prototype, 'componentDidMount').and.callThrough();
        var unmountSpy = spyOn(Component.type.prototype, 'componentWillUnmount').and.callThrough();
        var masterLayout = React.renderComponent(MasterLayout(), container);

        expect(renderSpy).not.toHaveBeenCalled();

        masterLayout.add(Component, 'main', {
          outlet: 'content'
        });

        expect(renderSpy).toHaveBeenCalled();
        expect(mountSpy).toHaveBeenCalled();
        expect(unmountSpy).not.toHaveBeenCalled();
      });

      it('should mount multiple views in different outlets', function() {
        var renderSpy = spyOn(Component.type.prototype, 'render').and.callThrough();
        var mountSpy = spyOn(Component.type.prototype, 'componentDidMount').and.callThrough();
        var unmountSpy = spyOn(Component.type.prototype, 'componentWillUnmount').and.callThrough();
        var masterLayout = React.renderComponent(MasterLayout(), container);

        expect(renderSpy).not.toHaveBeenCalled();

        masterLayout.add(Component, 'main', { outlet: 'content' });
        masterLayout.add(Component, 'main', { outlet: 'toolbar' });

        expect(Object.keys(masterLayout.refs.childLayout.props.components)).
          toEqual([ 'content', 'toolbar' ]);

        // Content outlet gets rendered twice, mounted once
        expect(renderSpy.calls.count()).toEqual(3);

        // Both get mounted once
        expect(mountSpy.calls.count()).toEqual(2);
      });

      it('should remove a view from a layout outlet', function() {
        var renderSpy = spyOn(Component.type.prototype, 'render').and.callThrough();
        var mountSpy = spyOn(Component.type.prototype, 'componentDidMount').and.callThrough();
        var unmountSpy = spyOn(Component.type.prototype, 'componentWillUnmount').and.callThrough();
        var masterLayout = React.renderComponent(MasterLayout(), container);

        masterLayout.add(Component, 'main', {
          outlet: 'content'
        });

        expect(renderSpy).toHaveBeenCalled();
        expect(mountSpy).toHaveBeenCalled();
        expect(unmountSpy).not.toHaveBeenCalled();

        masterLayout.remove(Component, 'main');

        expect(unmountSpy).toHaveBeenCalled();
      });
    });
  });
});