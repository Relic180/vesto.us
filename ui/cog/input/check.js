import template from './templates/check';
import './styles/check';

const settings = {
    className: 'extended-el-check'
},
defaults = {
    filled: false,
    inline: false,
    light: false,
    radio: false,
    round: false,
    disabled: false,
    single: false, // only one item can be checked at the same time
    group: undefined
};

export default class Check extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults({}, settings, options, defaults));

        this.type = 'check';
        this.items = this.options.items;
        this.template = template;

        this.ui = {
            'row': '[data-js~=row]',
            'custom': '[data-js~=custom]'
        };
        this.events = {
            'click @row': 'onClickCheck',
            'input @custom': _.throttle(this.onCustomInput, 20),
        };

        this.modelProps = {};
        if (!this.options.single) {
            _.each(this.options.items, (item) => {
                this.modelProps[item.key] = item.allowCustom ? '' : (item.initialValue || false);
            });
        } else {
            let initValue = _.filter(this.options.items, (item) => {
                return !!item.initialValue;
            });
            if (initValue.length > 1) {
                throw new Error(`Checklist Init: Can't set >1 initial values to true in single mode`);
            }
            this.modelProps[this.options.prop] = initValue[0] ? initValue[0].key : null;
        }

        atlas.newClass('Model.Base', this.modelProps, this)
            .done((newModel) => {
                this.model = newModel;
                util.delegateChangeEvents(this.model, this, this.options);
            });

        this.$el
            .toggleClass('is-filled', this.options.filled)
            .toggleClass('is-inline', this.options.inline)
            .toggleClass('is-light', this.options.light)
            .toggleClass('is-radio', this.options.radio)
            .toggleClass('is-round', this.options.round);

        if (this.options.disabled) {
            this.toggleDisableInput(true);
        }
    }

    onRender() {
        this.$el.appendTo(this.options.$append);
        if (!this.options.single) {
            _.each(this.modelProps, (item, key) => { //Pre-select any items with initialValue = true
                if (!!item) {
                    let $elem = this.$el.find(`[data-key=${key}]`);
                    $elem.find('.icon-check').removeClass('is-hidden');
                    $elem.addClass('is-selected');
                }
            });
        } else {
            let $elem = this.$el.find(`[data-key=${this.modelProps[this.options.prop]}]`);
            $elem.find('.icon-check').removeClass('is-hidden');
            $elem.addClass('is-selected');
        }

        return this;
    }

    onClickCheck(ev) {
        if ($(ev.currentTarget).hasClass('is-custom')) {
            return this.toggleCustomInput(ev);
        }
        let $row = $(ev.currentTarget),
            key = $row.data('key'),
            $check = $row.find('.icon-check'),
            checked = this.model.get(key),
            $uncheck;

        if (this.options.single) {
            $uncheck = $(_.filter(this.ui.$row, (row) => {
                return $(row).hasClass('is-selected');
            }));
            if ($uncheck.length) {
                $uncheck.toggleClass('is-selected', false);
                this.animateCheck($uncheck.find('.icon-check'), false);
            }
        }
        $row.toggleClass('is-selected', !checked);
        this.animateCheck($check, !checked, () => {
            if (!this.options.single) {
                this.model.set(key, !checked);
            } else {
                this.model.set(this.options.prop, key);
            }
        });
    }

    toggleCustomInput(ev) {
        let $row = $(ev.currentTarget),
            key = $row.data('key'),
            $check = $row.find('.icon-check'),
            $customInput = $row.find('.custom-text');

        // allow auto toggling "on" of custom option if user clicks in text box, but dont toggle "off" if they click away then back in the text box
        if ($(ev.originalEvent.target).hasClass('custom-text') && !$check.hasClass('is-hidden')) return;

        if ($check.hasClass('is-hidden')) {
            $row.addClass('is-selected');
            this.animateCheck($check, true, () => {
                $customInput.focus();
            });
        } else {
            $row.removeClass('is-selected');
            this.animateCheck($check, false, () => {
                if (!this.options.single) {
                    this.model.set(key, '');
                } else {
                    this.model.set(this.options.prop, null);
                }
            });
            $customInput.val('');
        }
    }

    animateCheck($elem, add, callback) {
        if (add) {
            $elem.removeClass('is-hidden');
            TweenMax.from($elem, .125, {
                scale: 0.9,
                opacity: 0,
            });
            TweenMax.to($elem, .125, {
                scale: 1.15,
                ease: Back.easeOut.config(1.7),
                onComplete: () => {
                    if (callback) {
                        callback();
                    }
                    $elem.removeAttr('style');
                }
            });
        } else {
            TweenMax.to($elem, .175, {
                opacity: 0,
                scale: 0.6,
                onComplete: () => {
                    if (callback) {
                        callback();
                    }
                    $elem
                        .addClass('is-hidden')
                        .removeAttr('style');
                }
            });
        }
    }

    onCustomInput(ev) {
        ev.preventDefault();
        let $input = $(ev.currentTarget),
            val = $input.val(),
            key = $input.parent().data('key');

        if (!this.options.single) {
            this.model.set(key, val);
        } else {
            this.model.set(this.options.prop, val);
        }
    }

    toggleDisableInput(force = undefined) {
        this.$el.toggleClass('is-disabled', util.isDefined(force) ? force : !this.$el.hasClass('is-disabled'));
    }
}
