import template from './templates/simple.dot';
import './styles/simple.scss';

const defaults = {
    persistOnMouseOut: false
};

export default class Simple extends Class.View.Screentip.Base {
    constructor(options = {}) {
        if (!options.str && !options.msg && !options.richText) {
            throw new Error('Required option missing: str OR richText');
        }

        super(_.defaults(options, defaults));

        this.type = 'simple';
        this.template = template;
        this.class = 'screentip-simple';

        if (options.light) {
            this.$el.addClass('screentip-light');
        }
    }
}
