import template from './templates/prompt';
import './styles/prompt';

const defaults = {
    type: 'prompt',
    title: 'Are you sure?',
    cancelLabel: 'Cancel',
    confirmLabel: 'OK'
};

export default class Prompt extends Class.View.Modal.Base {
    constructor(options = {}) {
        util.testForMissingOptions(['onConfirm'], options);

        if (!options.msg && !options.html) {
            throw new Error('Required option missing: msg OR html');
        }

        super(_.defaults(options, defaults));

        this.modalTemplate = template;

        this.ui = _.extend(this.ui, {
            'onCancel': '[data-js~=on-cancel]',
            'onConfirm': '[data-js~=on-confirm]',
            'onConfirmAlt': '[data-js~=on-confirm-alt]',
            'form': '[data-js~=form]',
            'input': '@form [data-js~=input]'
        });
        this.events = _.extend(this.events, {
            'click @onCancel': 'onClickCancel',
            'click @onConfirm': 'onClickConfirm',
            'click @onConfirmAlt': 'onClickConfirmAlt',
            'keydown @form': 'onFormKeydown'
        });
    }

    onRender() {
        super.onRender();

        this.ui.$form.css('opacity', 0);
    }

    onOpenComplete() {
        if (this.options.input) {
            atlas.newClass('View.Input.Text', _.extend({}, this.options.input, { // TODO: How do we init new classes inside modals without referencing atlas?
                $append: this.ui.$input
            }), this)
                .done((newInput) => {
                    this.input = newInput.render();

                    TweenMax.from(this.ui.$input, .2, {
                        opacity: 0
                    });
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
            if (!util.validateForm(this.ui.$form, {
                    minWidth: this.ui.$input.width(),
                    $parent: this.$el
                }, this)) return;

            this.options.onConfirm(this.ui.$input.val());
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
