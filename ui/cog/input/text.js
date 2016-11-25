import template from './templates/text';
import './styles/text';

import Mousetrap from 'mousetrap';

const settings = {
    className: 'extended-el-text'
},
defaults = {
    type: 'text', // 'email', 'password'
    line: 'under', // 'over'
    align: 'left', // 'right', 'center'
    required: false,
    disabled: false,
    swapline: false, // alternate overline/underline behavior
    white: false, // colors the labels & input white for dark backgrounds
    blend: false, // blend the input into the page as normal content (looks like an input only when focused)
    hidePlaceholderOnInput: false,
    counter: false, // requires a #
    minLength: false, // template attribute for input el
    autoResize: false, // text or textarea shrinks/grows as you type
    mousetrap: false, // Used to help bind keyboard shortcuts from parentViews using Mousetrap lib

    onChange: undefined,

    // Handle submitions
    submitIcon: false, // show icon to triggers submit
    submitAutoclear: false, // automatically clear input on submit
    autocomplete: null,
    autocompleteOptions: {},
    autofill: undefined, // Applies a value to the autocomplete attribute

    // Textarea
    multiline: false,
    forceLabel: true,
    resizeTextarea: false, // if multiline, toggle whether drag-to-resize is allowed
    rows: 1 // Acts as minimum rows for autoResized inputs
};

export default class Text extends Class.View.Base {
    constructor(options = {}) {
        if (options.autoResize && options.autocomplete) {
            throw new Error(`Can't set autoResize on an autocomplete input`);
        }

        super(_.defaults({}, settings, options, defaults));

        if (this.options.autocompleteOptions.location) {
            this.options.submitIcon = false;
        }

        this.type = this.options.type;
        this.template = template;

        this.ui = {
            input: '[data-js~=input]',
            placeholder: '[data-js~=placeholder]',
            counter: '[data-js~=counter]',
            submit: '[data-js~=submit]',
            constant: '[data-js~=constant]'
        };
        this.events = {
            'input @input': 'onInput',
            'focus @input': 'onFocusBlurInput',
            'blur @input': 'onBlurInput',
            'click @submit': 'onClickSubmit'
        };

        this.$el
            .addClass({
                under: 'is-underlined',
                over: 'is-overlined'
            }[this.options.line])
            .toggleClass('is-blended', this.options.blend)
            .toggleClass('is-swap-line', this.options.swapline)
            .toggleClass('is-white', this.options.white)
            .toggleClass('is-multiline', this.options.multiline)
            .toggleClass('has-icon', this.options.submitIcon);

        if (this.options.jsHook) {
            this.$el.attr('data-js', this.options.jsHook);
        }

        if (this.options.submitIcon === true) {
            this.options.submitIcon = 'plus';
        }

        if (this.options.align !== 'left') {
            this.$el.addClass({
                right: 'is-aligned-right',
                center: 'is-centered'
            }[this.options.align]);
        }

        atlas.newClass('Model.Base', {
            input: '',
            hasInput: false
        }, this)
            .done((newModel) => {
                this.model = newModel;
                util.delegateChangeEvents(this.model, this, this.options);

                this.listenTo(this.model, 'change:hasInput', this.onChangeHasInput.bind(this));
                this.listenTo(this.model, 'change:input', this.onChangeInput.bind(this));
                this.onChangeHasInput();
            });

        if (this.options.onSubmit && !this.options.autocompleteOptions.location) {
            this.options.mousetrap = true;
            Mousetrap.bind('enter', this.onClickSubmit.bind(this));
        }

        if (this.options.disabled) {
            this.toggleDisableInput(true);
        }

        if (this.options.type === 'password') {
            if (util.isDefined(options.required)) {
                this.options.required = options.required;
            } else {
                this.options.required = true;
            }
        }
    }

    onRender() {
        this.$el.appendTo(this.options.$append);

        if (this.options.fontSize) {
            this.adjustFontSize(this.options.fontSize);
        }

        if (this.options.multiline && this.options.resizeTextarea) {
            this.ui.$input.css('resize', 'vertical');
        }

        if (this.options.autoResize) {
            this.autoResize();
        }
    }

    renderAutocomplete() {
        if (this.autocompleteRendered) return;
        this.autocompleteRendered = true;

        let onSelect = (selected) => {
                this.setInput(selected.name);
                this.submit();
            },
            onSelectLocation = (selected) => {
                this.setInput(`${selected.city}, ${selected.stateCode || selected.countryCode}`);
                this.submit(selected);
            };

        atlas.newClass('View.Screentip.Autocomplete', _.defaults({}, this.options.autocompleteOptions, {
            $input: this.ui.$input,
            $attached: this.$el,
            key: `text-autocomplete-${this.model.cid}`,
            width: this.$el.outerWidth(true),
            api: this.options.autocomplete,
            onSelect: !!this.options.autocompleteOptions.location ? onSelectLocation : onSelect,
            posPad: -(this.ui.$constant.height())
        }), this)
            .done((newAutocomplete) => {
                this.autocomplete = newAutocomplete;
            });
    }

    adjustFontSize(fontSize) {
        let fontFactor = fontSize + 6,
            labelBottom = (fontFactor / 2) + this.ui.$constant.height();

        this.ui.$input.css('font-size', fontSize);
        if (this.options.placeholderFontSize) {
            this.ui.$placeholder.css('font-size', this.options.placeholderFontSize);
        }

        if (!this.options.multiline) {
            this.ui.$input.css('height', fontFactor);
            this.ui.$placeholder.css('bottom', labelBottom);
        } else {
            this.ui.$input.css('line-height', fontFactor + 'px');
        }

        if (this.options.blend) {
            this.ui.$placeholder.css('line-height', fontFactor + 'px');
        }
        if (this.options.submitIcon) {
            this.ui.$submit.css('font-size', fontSize);
        }
    }

    onChangeInput() {
        this.model.set('hasInput', !!this.model.get('input'));
        if (this.options.onChange) {
            this.options.onChange(this.model.get('input'));
        }
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

        if (this.options.autocomplete && !this.autocomplete && !this.settingInput) {
            this.renderAutocomplete();
        }
        this.settingInput = false;
    }

    onFocusBlurInput(ev) {
        this.$el.toggleClass('is-focused', this.ui.$input[0] === document.activeElement);
    }

    onBlurInput(ev) {
        this.trigger('blur', this.model);
        this.onFocusBlurInput(ev);
    }

    setInput(value) {
        this.settingInput = true;
        this.model.set('input', value);
        this.ui.$input
            .val(value)
            .trigger('input');
    }

    submit(autocompleteInput) {
        if (this.options.onSubmit) {
            this.options.onSubmit(autocompleteInput || this.model.get('input'));
            if (this.options.submitAutoclear) {
                this.setInput('');
            }
        }
    }

    onClickSubmit(ev) {
        ev.preventDefault();

        this.submit();
    }

    focus() {
        this.ui.$input.focus();
    }

    rebindMousetrap() {
        Mousetrap.unbind('enter');
        Mousetrap.bind('enter', this.onClickSubmit.bind(this));
    }

    toggleDisableInput(force = undefined) {
        this.$el.toggleClass('is-disabled', util.isDefined(force) ? force : !this.$el.hasClass('is-disabled'));
    }

    autoResize() {
        this.ui.$input.autoResizeInput({
            padding: 15,
            placeholder: this.options.placeholder,
            rows: this.options.rows,
            vertical: this.options.multiline
        });
    }

    getInput() {
        return this.model.get('input');
    }
}
