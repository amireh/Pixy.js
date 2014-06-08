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

    describe('React.addons.StackedLayoutMixin', function() {
      var Layout;
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
            this.renderLayout(Layout, { ref: 'childLayout' })
          ]);
        }
      });

      Layout = React.createClass({
        mixins: [ React.addons.StackedLayoutMixin ],
        displayName: 'Layout',

        render: function() {
          return React.DOM.div({}, this.renderComponent());
        }
      });

      var Component = React.createClass({
        displayName: 'Component',
        getDefaultProps: function() {
          return {

          };
        },
        componentDidMount: function() {},
        componentWillUnmount: function() {},
        render: function() {
          return React.DOM.div({ id: 'banana' });
        }
      });

      it('should add a view to the layout', function() {
        var renderSpy = spyOn(Component.type.prototype, 'render').andCallThrough();
        var mountSpy = spyOn(Component.type.prototype, 'componentDidMount').andCallThrough();
        var unmountSpy = spyOn(Component.type.prototype, 'componentWillUnmount').andCallThrough();
        var masterLayout = React.renderComponent(MasterLayout(), container);

        masterLayout.add(Component, 'main');

        expect(renderSpy).toHaveBeenCalled();
        expect(mountSpy).toHaveBeenCalled();
        expect(unmountSpy).not.toHaveBeenCalled();
      });

      // it('should remove a view from a layout outlet', function() {
      //   var renderSpy = spyOn(Component.type.prototype, 'render').andCallThrough();
      //   var mountSpy = spyOn(Component.type.prototype, 'componentDidMount').andCallThrough();
      //   var unmountSpy = spyOn(Component.type.prototype, 'componentWillUnmount').andCallThrough();
      //   var masterLayout = React.renderComponent(MasterLayout(), container);

      //   masterLayout.add(Component, 'main', {
      //     outlet: 'content'
      //   });

      //   expect(renderSpy).toHaveBeenCalled();
      //   expect(mountSpy).toHaveBeenCalled();
      //   expect(unmountSpy).not.toHaveBeenCalled();

      //   masterLayout.remove(Component, 'main');

      //   expect(unmountSpy).toHaveBeenCalled();
      // });
    });
  });
});