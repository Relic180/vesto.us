import template from './templates/toggle';
import './styles/toggle';

const settings = {
    className: 'extended-el-toggle'
},
defaults = {
    tall: false,
    wide: false,
    initialValue: false
};

export default class Toggle extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults({}, settings, options, defaults));

        this.type = 'toggle';
        this.template = template;

        this.ui = {
            'toggle': '[data-js=toggle]'
        };
        this.events = {
            'click @toggle': 'onClickToggle'
        };
        this.bindUI();

        atlas.newClass('Model.Base', {
            value: this.options.initialValue,
        }, this)
            .done((newModel) => {
                this.model = newModel;
                this.listenTo(this.model, 'change', (model) => {
                    this.trigger('change', model);
                });
            });

        this.$el
            .toggleClass('is-wide', this.options.wide)
            .toggleClass('is-tall', this.options.tall);
    }

    render() {
        super.render();
        this.$el.appendTo(this.options.$append);
        this.ui.$toggle.toggleClass('is-toggled', this.options.initialValue);

        return this;
    }

    onClickToggle(ev) {
        ev.preventDefault();
        let val = this.model.get('value');
        this.ui.$toggle.toggleClass('is-toggled', !val);
        this.model.set('value', !val);
        if (this.options.onChange) {
            this.options.onChange(val);
        }
    }
}
