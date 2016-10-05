import template from './templates/simple.dot';
import './styles/simple';

const defaults = {
    mode: 'status', // Can also be "warning" or "error"
    icon: null,
};

export default class Simple extends Class.View.Messenger.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.type = 'simple';
        this.template = template;
    }
}
