import template from './templates/contact.dot';
import './styles/contact.scss';
//import ExtendedElement from '../../components/extended_element/extended_element.js';

export default class Contact extends Class.View.Modal.Base {
    constructor(options = {}) {
        super(options);

        this.template = template;
        this.class = 'modal-contact';
        this.ui = _.extend(this.ui, {
            'contactForm': '[data-js~=contact-form]',
            'input': '[data-js~=input]',
            'first': '@input[data-js~=first-name]',
            'last': '@input[data-js~=last-name]',
            'email': '@input[data-js~=email]',
            'message': '@input[data-js~=message]',
            'submit': '[data-js~=submit]'
        });
        this.events = _.extend(this.events, {
            'click @submit': 'onSubmit'
        });
    }

    onRenderComplete() {
        // this.ui.$input.each((i, el) => {
        //     new ExtendedElement({el});
        // });
    }

    onSubmit(ev) {
        let firstName = this.ui.$first.data('val'),
            lastName = this.ui.$last.data('val'),
            email = this.ui.$email.data('val'),
            msg = this.ui.$message.data('val'),
            errors = util.validateForm(this.ui.$contactForm);

        if (errors.length > 0) {
            util.showFormErrors(errors, {
                parentView: this,
                $parent: this.ui.$contactForm,
                posPad: 25
            });
        } else {
            $.ajax({
                type: 'POST',
                url: api.contact,
                data: util.convertKeyNames({
                    firstName,
                    lastName,
                    email,
                    msg,
                    to: 'support'
                }, false)
            })
                .done(() => {
                    this.close();
                    atlas.messenger.new('simple', {
                        msg: `Message received! We'll be in contact very shortly to help you out.`,
                        mode: 'success'
                    });
                });
        }
    }
}
