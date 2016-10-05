import template from './templates/radio.dot';
import './styles/radio';

const defaults = {

};

export default class Radio extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.type = 'radio';
        this.template = template;
    }
}
