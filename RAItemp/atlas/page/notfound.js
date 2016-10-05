import template from '../templates/page_notfound.dot';
import '../styles/page_notfound.scss';

const defaults = {
    pageName: 'notFound'
};

export default class NotFound extends Class.View.Page.Base {
    constructor(options = {}) {
        options = _.defaults(options, defaults);
        super(options);

        this.ui = {

        };
        this.events = {

        };
        this.template = template;
        this.bindUI();
    }
}
