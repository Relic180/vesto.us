import template from './templates/form_flag.dot';
import './styles/form_flag.scss';

const defaults = {
    posPad: 0,
    persistOnScroll: true,
    persistOnClick: true
};

export default class FormFlag extends Class.View.Screentip.Base {
    constructor(options = {}) {
        let missingOptions = util.testForMissingOptions(['str'], options);
        if (missingOptions) throw new Error(missingOptions);

        options = _.defaults(options, defaults);
        super(options);

        this.type = 'formFlag';
        this.template = template;
        this.class = 'screentip-formflag';
    }

    open() {
        let str = this.options.str,
            $attached = this.options.$attached,
            $errorEl = this.options.$errorEl || $attached,
            $listenEl = this.options.$listenEl || $attached;

        $errorEl.addClass('error');
        $listenEl.one('input paste change', _.bind(function(ev) {
            if (ev.type === 'change' && $listenEl.parent('.extended-input').length > 0) return; // Do not listen for change events if this is an extended input

            $errorEl.removeClass('error');
            this.close();
        }, this));

        super.open();
    }
}
