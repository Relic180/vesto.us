import template from '../templates/page_login.dot';
import '../styles/page_login.scss';

const defaults = {
    pageName: 'login'
};

export default class Login extends Class.View.Page.Base {
    constructor(options = {}) {
        options = _.defaults(options, defaults);
        super(options);

        this.ui = {
            'hero': '[data-js~=hero]',
            'email': '[data-js~=email]',
            'password': '[data-js~=password]',
            'google': '[data-js~=google]',
            'facebook': '[data-js~=facebook]',
            'login': '[data-js~=login]',
            'forgotPassword': '[data-js~=forgot]',
            'showPassword': '[data-js~=show-password]'
        };
        this.events = {
            'click @login': 'onClickLogin',
            'click @google': 'onClickLoginWithGoogle',
            'click @facebook': 'onClickLoginWithFacebook',
            'click @forgotPassword': 'onClickForgotPassword',
            'click @showPassword': 'onClickShowPassword'
        };
        this.template = template;
        this.bindUI();
    }

    onClickLogin() {
        // TODO: use authUser.login()
    }

    onClickLoginWithGoogle() {

    }

    onClickLoginWithFacebook() {

    }

    onClickForgotPassword() {

    }

    onClickShowPassword(ev) {
        ev.preventDefault();
        let newType = this.ui.$password.attr('type') === 'password' ? 'text' : 'password';
        this.ui.$password.attr('type', newType);
    }
}
