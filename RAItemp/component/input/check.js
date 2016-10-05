import template from './templates/check.dot';
import './styles/check';

const defaults = {

};

export default class Check extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.type = 'check';
        this.template = template;
    }
}
