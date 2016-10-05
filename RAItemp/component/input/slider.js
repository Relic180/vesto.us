import template from './templates/slider.dot';
import './styles/slider';

const settings = {
    className: 'exetended-el-slider',
    range: false // TODO: Force disabled, but move this to 'defaults' when ready
},
defaults = {
    value: 0,
    //range: false,
    rangeValue: null,
    startingWidth: 300,
    disabled: false,
    min: 0,
    max: 100,
    minLabel: undefined,
    maxLabel: undefined,
    valueHide: false,
    valueHandle: false, // Displays the current slider value inside the handle
    valueSnapTo: false
};

export default class Slider extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults({}, settings, options, defaults));

        this.type = 'slider';
        this.template = template;
        this.valueRangeArray = util.generateRangeArray(this.options.min, this.options.max);
        this.xPosOffset = this.options.valueSnapTo ? this.percentAsPixels(this.indexAsPercent(1) / 2) : 0;

        this.ui = {
            'label': '[data-js~=label]',
            'track': '[data-js~=track]',
            'progress': '[data-js~=progress]',
            'handle': '[data-js~=handle]',
            'rangeHandle': '[data-js~=range-handle]',
            'value': '[data-js~=value]'
        };
        this.events = {
            'click': 'onClick',
            'mousedown @handle': 'onClickHandle',
            'touchstart @handle': 'onClickHandle'
        };

        this.$el
            .toggleClass('is-labels-hidden', this.options.valueHide)
            .toggleClass('is-handle-value', this.options.valueHandle);

        atlas.newClass('Model.Base', {}, this)
            .done((newModel) => {
                this.model = newModel;

                this.listenTo(this.model, 'change:value', _.bind(_.throttle(this.onChangeValue, 20), this));
                if (this.options.range) {
                    this.listenTo(this.model, 'change:rangeValue', _.bind(_.throttle(this.onChangeRangeValue, 20), this));
                }
            });
    }

    render() {
        super.render();
        this.$el.appendTo(this.options.$append);
        this.storeDimensions();

        this.model.set({
            value: this.options.value,
            rangeValue: this.options.rangeValue
        });

        return this;
    }

    storeDimensions() {
        this.trackOffset = this.ui.$track.offset(),
        this.handleWidth = this.ui.$handle.outerWidth() > 0 ? this.ui.$handle.outerWidth() : (this.options.handleVal ? 55 : 34), // Value is 0 if we're in the process of animating
        this.trackWidth = parseInt(this.ui.$track.width());
    }

    onClick(ev) {
        ev.preventDefault();

        if (this.options.onSliderStart) {
            this.options.onSliderStart();
        }

        this.storeDimensions();
        this.model.set('value', this.pixelsAsValue(ev.pageX - this.trackOffset.left))
    }

    onClickHandle(ev) {
        ev.preventDefault();

        if (this.options.onSliderStart) {
            this.options.onSliderStart();
        }

        this.storeDimensions();

        this.$el.addClass('is-focused');
        $(document)
            .on('mousemove.slider touchmove.slider', _.throttle((ev) => {
                ev.preventDefault();

                if (ev.type === 'touchmove') {
                    ev = ev.originalEvent.touches[0]
                }

                this.model.set('value', this.pixelsAsValue(ev.pageX - this.trackOffset.left));
            }, 20))
            .one('mouseup touchend', () => {
                $(document).off('.slider');
                this.$el.removeClass('is-focused');

                if (this.options.onSliderStop) {
                    this.options.onSliderStop(this.model.get('value'));
                }
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

        if (this.options.valueSnapTo) {
            percent = indexAsPercent(this.valueRangeArray.indexOf(val));
        }

        this.ui.$value.html(val);
        this.ui.$handle.css('left', `${percent - this.pixelsAsPercent(this.handleWidth / 2)}%`);
        this.ui.$progress.css('width', `${percent}%`);

        if (this.options.onSliderMove) {
            this.options.onSliderMove(val);
        }
    }

    onChangeRangeValue() {
        let rangeValue = this.model.get('rangeValue');

        // TODO: Need to update slider based on model rangeValue
    }

    percentAsValue(percent) {
        return Math.min(Math.max(Math.round(this.options.max * (percent / 100)), this.options.min), this.options.max);
    }

    percentAsPixels(percent) {
        return (this.trackWidth > 0 ? this.trackWidth : this.options.startingWidth) * (percent / 100);
    }

    valueAsPercent(val) {
        return Math.min(Math.max((val / this.options.max * 100).toFixed(2), 0), 100);
    }

    pixelsAsPercent(pix) {
        return Math.min(Math.max(parseFloat(pix / (this.trackWidth > 0 ? this.trackWidth : this.options.startingWidth) * 100).toFixed(2), 0), 100);
    }

    pixelsAsValue(pix) {
        return this.percentAsValue(this.pixelsAsPercent(pix));
    }

    indexAsPercent(index) {
        return index / (this.valueRangeArray.length - 1) * 100;
    }
}
