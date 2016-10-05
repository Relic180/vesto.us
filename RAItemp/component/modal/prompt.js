import template from './templates/prompt.dot';
import './styles/prompt.scss';
//import ExtendedElement from '../../components/extended_element/extended_element.js';

const defaults = {
    title: 'Are you sure?',
    cancelLabel: 'Cancel',
    confirmLabel: 'OK'
};

export default class Prompt extends Class.View.Modal.Base {
    constructor(options = {}) {
        let missingOptions = util.testForMissingOptions(['onConfirm'], options);
        if (missingOptions) throw new Error(missingOptions);

        if (!options.msg && !options.html) {
            throw new Error('Required option missing: msg OR html');
        }

        options = _.defaults(options, defaults);
        super(options);

        this.template = template;
        this.input = options.input || false;

        this.class = 'modal-prompt' + (this.class ? ` ${this.class}` : '');
        this.ui = _.extend(this.ui, {
            'onCancel': '[data-js~=on-cancel]',
            'onConfirm': '[data-js~=on-confirm]',
            'onConfirmAlt': '[data-js~=on-confirm-alt]',
            'form': '[data-js~=form]',
            'input': '@form [data-js~=prompt-input]'
        });
        this.events = _.extend(this.events, {
            'click @onCancel': 'onClickCancel',
            'click @onConfirm': 'onClickConfirm',
            'click @onConfirmAlt': 'onClickConfirmAlt',
            'keydown @form': 'onFormKeydown'
        });
    }

    onOpenComplete() {
        if (this.input) {
            new ExtendedElement({el: this.ui.$input});
            TweenMax.from(this.ui.$input, .2, {
                opacity: 0
            });
        }
    }

    onClickCancel(ev) {
        if (this.options.onCancel) {
            this.options.onCancel();
        }
        if (this.options.confirmClass === "btn-google") {
            mixpanel.track("Connect Outreach Canceled");
        }
        this.close();
    }

    onClickConfirm(ev) {
        if (this.input) {
            let errors = util.validateForm(this.ui.$form);

            if (errors.length > 0) {
                util.showFormErrors(errors, {
                    minWidth: this.ui.$input.width(),
                    $parent: this.$el
                });
                return;
            } else {
                this.options.onConfirm(this.ui.$input.val());
            }
        } else {
            this.options.onConfirm();
        }

        if (this.options.confirmClass === "btn-google") {
            mixpanel.track("Login with Google Pressed");
            mixpanel.time_event("Connected with Outreach");
        }

        this.close();
    }

    onClickConfirmAlt(ev) {
        this.options.onConfirmAlt();
        this.close();
    }

    onFormKeydown(ev) {
        if (ev.which === 13) { // return key
            ev.preventDefault();
            this.onClickConfirm();
        }
    }
}
