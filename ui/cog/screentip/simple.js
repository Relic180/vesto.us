import Base from './base'; // Special case since user model is defined very early during application initialization

import template from './templates/simple';
import './styles/simple';

const defaults = {
    persistOnMouseOut: false
};

export default class Simple extends Base {
    constructor(options = {}) {
        if (!options.str && !options.msg && !options.richText) {
            throw new Error('Required option missing: str OR richText');
        }

        super(_.defaults(options, defaults));

        this.type = 'simple';
        this.template = template;
        this.class = 'screentip-simple';

        if (this.options.light) {
            this.$el.addClass('screentip-light');
        }
    }
}
