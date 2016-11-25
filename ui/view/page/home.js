import template from './templates/home';
import './styles/home';

const defaults = {
    className: 'home'
};

Class.View.Page.Home = class Home extends Class.View.Page.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.pageName = 'Home';
        this.template = template;

        this.ui = {

        };
        this.events = {

        };
    }
}
