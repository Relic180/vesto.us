import Base from './base'; // Special case since user model is defined very early during application initialization

import template from './templates/simple';
import './styles/simple';

const defaults = {
    mode: 'status', // Can also be "success" or "error"
    icon: null,
    title: '',
    msg: ''
};

export default class Simple extends Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.type = 'simple';
        this.template = template;
    }
}
