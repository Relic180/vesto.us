import BaseRow from './base';

import template from './templates/user';
import './styles/user';

const defaults = {
    className: 'list-row-user'
};

export default class UserRow extends BaseRow {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.template = template;
    }

    static rowHeight() {
        return 51;
    }
}
