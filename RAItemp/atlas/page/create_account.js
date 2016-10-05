import template from '../templates/page_create_account.dot';
import '../styles/page_create_account.scss';

const defaults = {
    pageName: 'create-account'
};

export default class CreateAccount extends Class.View.Page.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.ui = {
            'emailInput': '[data-js~=email]',
            'passwordInput': '[data-js~=password]',
            'google': '[data-js~=google]',
            'facebook': '[data-js~=facebook]',
            'create': '[data-js~=create]'
        };
        this.events = {
            'click @create': 'onClickCreate',
            'click @google': 'onClickSignupWithGoogle',
            'click @facebook': 'onClickSignupWithFacebook'
        };
        this.template = template;
        this.bindUI();
    }

    onRender() {
        let inputs = [
            {key: 'emailInput', type: 'text', placeholder: 'Email address'},
            {key: 'passwordInput', type: 'password', placeholder: 'Create password'}];
        _.each(inputs, (input) => {
            this.extendInput(input);
        });
    }

    extendInput(input = {}) {
        atlas.newClass('View.Input.Text', {
            $append: this.ui[`$${input.key}`],
            placeholder: input.placeholder,
            type: input.type
        })
            .done((extendedInput) => {
                this[input.key] = extendedInput.render();
            });
    }

    onClickCreate(ev) {
        let email = this.emailInput.model.get('input'),
            password = this.passwordInput.model.get('input');
        if (!email || !password) return;
        atlas.authUser.set({email, password});
        atlas.authUser.save()
            .done((id) => {
                atlas.navigate(`dashboard/candidate/${id}`);
            });
    }

    onClickSignupWithGoogle() {
        atlas.navigate('oauth/google');
    }

    onClickSignupWithFacebook() {
        atlas.navigate('oauth/facebook');
    }
}
