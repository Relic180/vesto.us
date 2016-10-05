import template from './templates/select.dot';
import './styles/select';

const defaults = {

};

export default class Select extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.type = 'select';
        this.template = template;
    }
}
