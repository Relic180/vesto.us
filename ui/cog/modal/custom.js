const defaults = {
    type: 'custom'
};

export default class Custom extends Class.View.Modal.Base {
    constructor(options = {}) {
        util.testForMissingOptions(['view'], options);

        super(_.defaults(options, defaults));
    }

    onRender() {
        this.$el.css('visibility', 'hidden');

        this.view = new this.options.view();
        this.childViews.push(this.view);
        this.view.render().$el.appendTo(this.ui.$content);

        if (!$('body').is('[data-appsize=mobile]') && !$('body').is('[data-appsize=tablet]')) {
            this.$el.css('transform', 'translateX(-50%) translateY(-50%)');
        }

        setTimeout(this.open.bind(this), 0); // Required to recenter modals that change demensions after appending to dom
    }
}
