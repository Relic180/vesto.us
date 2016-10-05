import template from './templates/text.dot';
import './styles/text';

const settings = {
    className: 'extended-el-text'
},
defaults = {
    type: 'text',
    line: 'under', // or 'over'
    required: false,
    disabled: false,
    counter: false,
    minLength: false,
    multiline: false,
    swapline: false, // Flag to tweak the overline/underline behaviors
    lighten: false,
    white: false,
    hidePlaceholderOnInput: false,
    mousetrap: false // Used to help bind keyboard shortcuts from parentViews using Mousetrap lib
};

export default class Text extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults({}, settings, options, defaults));

        this.type = this.options.type;
        this.template = template;

        this.ui = {
            input: '[data-js~=input]',
            placeholder: '[data-js~=placeholder]',
            counter: '[data-js~=counter]'
        };
        this.events = {
            'input @input': 'onInput',
            'focus @input': 'onInputFocusBlur',
            'blur @input': 'onInputFocusBlur'
        };

        this.$el
            .addClass({
                under: 'is-underlined',
                over: 'is-overlined'
            }[this.options.line])
            .toggleClass('is-swap-lined', this.options.swapline)
            .toggleClass('is-lighten', this.options.lighten)
            .toggleClass('is-white', this.options.white);

        atlas.newClass('Model.Base', {
            input: '',
            hasInput: false
        }, this)
            .done((newModel) => {
                this.model = newModel;

                this.listenTo(this.model, 'change:hasInput', _.bind(this.onChangeHasInput, this));
                this.listenTo(this.model, 'change:input', _.bind(this.onChangeInput, this));
                this.onChangeHasInput();
            });
    }

    render() {
        super.render();
        this.$el.appendTo(this.options.$append);

        return this;
    }

    onChangeInput() {
        this.model.set('hasInput', !!this.model.get('input'));
    }

    onChangeHasInput() {
        let hasInput = this.model.get('hasInput');

        this.$el.toggleClass(this.options.hidePlaceholderOnInput ? 'is-filled-hide-placeholder' : 'is-filled', hasInput);
    }

    onInput(ev) {
        let input = this.ui.$input.val();

        this.model.set({
            input,
            hasInput: input.length > 0
        });

        if (this.options.counter) {
            this.ui.$counter.text(input.length);
        }
    }

    onInputFocusBlur(ev) {
        this.$el.toggleClass('is-focused', this.ui.$input[0] === document.activeElement);
    }

    setInput(value) {
        this.model.set('input', value);
        this.ui.$input.val(value);
    }
}
