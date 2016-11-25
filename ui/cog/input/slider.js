import template from './templates/slider';
import handleTemplate from './templates/slider_handle';
import './styles/slider';

const settings = {
    className: 'extended-el-slider',
},
defaults = {
    value: 0,
    range: false,
    rangeValue: undefined,
    startingWidth: 300,
    disabled: false,
    min: 0,
    max: 100,
    minLabel: undefined,
    maxLabel: undefined,
    valueHide: false,
    valueHandle: false, // Displays the current slider value inside the handle
    valueSnapTo: true, // Unimplemented
};

class Handle extends Class.View.Base {
    constructor(options, parent) {
        super(_.extend({}, options, {
            'className': 'slider-handle',
            'tagName': 'span'
        }));
        this.parent = parent;

        this.template = handleTemplate;

        this.ui = {
            'value': '[data-js~=value]'
        };
        this.events = {
            'mousedown': 'onMouseDown',
            'touchstart': 'onMouseDown',
            'click': 'onClick'
        };

        atlas.newClass('Model.Base', {}, this)
            .done((newModel) => {
                this.model = newModel;
                this.listenTo(this.model, 'change:value', _.throttle(this.onChangeValue, 20).bind(this));
            });
    }

    onRender() {
        $.when(atlas.$pageVisible).done(() => {
            this.handleWidth = this.$el.outerWidth() > 0 ? this.$el.outerWidth() : (this.options.handleVal ? 55 : 34); // Value is 0 if we're in the process of animating
            this.model.set({
                value: this.options.value
            });
        });
    }

    onChangeValue() {
        let val = this.model.get('value'),
            percent = this.valueAsPercent(val),
            displayValue;

        if (!util.isDefined(val)) return;

        if (this.options.labelConversion) {
            displayValue = this.options.labelConversion(val);
        }

        this.ui.$value.html(val);
        this.$el.css('left', `${percent - this.pixelsAsPercent(this.handleWidth / 2)}%`);

        this.parent.onChangeValue();
    }

    moveTo(pageX) {
        this.model.set('value', this.pixelsAsValue(pageX - this.parent.trackOffset.left));
    }

    onClick(ev) {
        ev.preventDefault();
    }

    onMouseDown(ev) {
        ev.preventDefault();

        if (this.options.onSliderStart) {
            this.options.onSliderStart();
        }

        this.parent.$el.addClass('is-focused');
        $(document)
            .on('mousemove.slider touchmove.slider', _.throttle((ev) => {
                ev.preventDefault();

                if (ev.type === 'touchmove') {
                    ev = ev.originalEvent.touches[0];
                }

                this.moveTo(ev.pageX);
            }, 20))
            .one('mouseup touchend', () => {
                $(document).off('.slider');
                this.parent.$el.removeClass('is-focused');

                if (this.options.onSliderStop) {
                    this.options.onSliderStop(this.model.get('value'));
                }
            });
    }

    percentAsValue(percent) {
        return Math.min(Math.max(Math.round(this.options.max * (percent / 100)), this.options.min), this.options.max);
    }

    valueAsPercent(val) {
        return Math.min(Math.max((val / this.options.max * 100).toFixed(2), 0), 100);
    }

    pixelsAsPercent(pix) {
        this.parent.storeDimensions(); // TODO Need this because of weird async behavior, and it still doesn't work sometimes. Talk to Dave about solutions.
        return Math.min(Math.max(parseFloat(pix / (this.parent.trackWidth > 0 ? this.parent.trackWidth : this.options.startingWidth) * 100).toFixed(2), 0), 100);
    }

    pixelsAsValue(pix) {
        return this.percentAsValue(this.pixelsAsPercent(pix));
    }
}

export default class Slider extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults({}, settings, options, defaults));

        this.type = 'slider';
        this.template = template;

        this.ui = {
            'label': '[data-js~=label]',
            'track': '[data-js~=track]',
            'progress': '[data-js~=progress]',
            'value': '[data-js~=value]'
        };
        this.events = {
            'click': 'onClick',
        };

        this.$el
            .toggleClass('is-labels-hidden', this.options.valueHide)
            .toggleClass('is-handle-value', this.options.valueHandle);

        this.onChangeValue = this.options.range ? this.onChangeValueRange : this.onChangeValueSingle;
        this.getValue = this.options.range ? this.getValueRange : this.getValueSingle;
    }

    onRender() {
        this.$el.appendTo(this.options.$append);
        this.storeDimensions();

        this.handles = [new Handle(this.options, this)];

        if (this.options.range) {
            let rangeValue = util.isDefined(this.options.rangeValue) ? this.options.rangeValue : this.options.max;
            this.handles.push(new Handle(_.extend(this.options, {value: rangeValue}), this));
        }

        for (let handle of this.handles) {
            this.ui.$track.append(handle.render().$el);
            this.childViews.push(handle);
        }
    }

    storeDimensions() {
        this.trackOffset = this.ui.$track.offset();
        this.trackWidth = parseInt(this.ui.$track.width());
    }

    onClick(ev) {
        if (ev.isDefaultPrevented()) return;
        ev.preventDefault();

        let val = this.handles[0].pixelsAsValue(ev.pageX),
            dist = (i) => Math.abs(this.handles[i].model.get('value') - val),
            closestHandle = dist(0) > dist(1) ? this.handles[1] : this.handles[0];

        if (this.options.onSliderStart) {
            this.options.onSliderStart();
        }

        closestHandle.moveTo(ev.pageX);
    }

    onChangeValueSingle() {
        let val = this.getValueSingle(),
            percent = this.handles[0].valueAsPercent(val);

        this.ui.$progress.css('width', `${percent}%`);

        if (this.options.onSliderMove) {
            this.options.onSliderMove(val);
        }

        this.ui.$value.html(val);
    }

    getValueSingle() {
        return this.handles[0].model.get('value');
    }

    onChangeValueRange() {
        let values = this.getValueRange(),
            percentMax = this.handles[0].valueAsPercent(values[1]),
            percentMin = this.handles[0].valueAsPercent(values[0]),
            displayValue;

        this.ui.$progress.css({left: percentMin + '%', width: `${percentMax - percentMin}%`});

        if (this.options.onSliderMove) {
            this.options.onSliderMove(values[0], values[1]);
        }

        if (this.options.labelConversion) {
            this.ui.$value.html(`${this.options.labelConversion(values[0], values[1])}`);
        } else {
            this.ui.$value.html(`${values[0]} - ${values[1]}`);
        }
        this.trigger('change:range', values[0], values[1]);
    }

    getValueRange() {
        let val1 = this.handles[0].model.get('value'),
            val2 = this.handles[1].model.get('value'),
            valMax = Math.max(val1, val2),
            valMin = Math.min(val1, val2);

        return [valMin, valMax];
    }

    toggleDisabled(force) {
        this.$el.toggleClass('is-disabled', force);
    }
}
