import template from './templates/custom';
import './styles/custom';

const defaults = {
    transparentBack: false
};

export default class Custom extends Class.View.Screentip.Base {
    constructor(options = {}) {
        util.testForMissingOptions(['view'], options);

        super(_.defaults(options, defaults));

        this.type = 'custom';
        this.template = template;
        this.class = `screentip-custom${this.options.transparentBack ? ' is-transparent' : ''}`;

        this.ui = {
            'content': '[data-js~=content]'
        };
        this.events = {

        };
    }

    onRenderComplete() {
        this.view = new this.options.view();
        this.childViews.push(this.view);
        this.view.render().$el.appendTo(this.ui.$content);
    }
}
