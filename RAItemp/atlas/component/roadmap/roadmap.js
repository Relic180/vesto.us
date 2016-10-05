import template from './templates/roadmap.dot';
import './styles/roadmap.scss';

const defaults = {
    actionClass: 'btn-approve',
    actionDisabled: false, // Action button initially disabled (until user input)
    actionLabel: 'Next',
    colorScheme: 'roadmap-light'
};

export default class Roadmap extends Class.View.Base {
    constructor(options = {}) {
        options = _.defaults(options, defaults);
        super(options);

        this.template = template;
        this.ui = {
            'action': '[data-js~=action]'
        };
        this.events = {
            'click @action': 'onClickAction'
        };

        this.bindUI();
    }

    onClickAction(ev) {
        ev.preventDefault();
        if (this.options.actionCallback) {
            this.options.actionCallback();
        }
    }
}
