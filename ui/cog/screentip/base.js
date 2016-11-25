import './styles/base';

const defaults = {
    classNames: '', // instance-specific and added as one-off classes
    posDir: 'bottom', // top, right, bottom, left -- This is the direction to attach the tip relative to $atatched or cursor
    posSpill: 'center', // up, down, left, right, center, middle -- This is the direction the tip can flex or "slide" as its content size changes
    posPad: 5,
    posAutoCorrect: true,
    width: null,
    minWidth: null,
    maxWidth: null,
    resizeableH: false, // Tip can be squeezed horizontally when position autoCorrecting
    resizeableV: false, // Tip can be squeezed vertically when position autoCorrecting
    delay: 0,
    isOpen: false,
    // isSubmenu: false, // TODO: Add support for this
    persistOnScroll: true,
    persistOnMouseOut: true,
    persistOnClick: false,
    // toggleOnClick: false // TODO: Add support for this
};

export default class ScreentipBase extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        if (this.options.$attached && !(this.options.$attached instanceof $)) {
            this.options.$attached = $(this.options.$attached);
        }

        this.coordinator = this.options.coordinator;
        this.isOpen = false;
        this.isClosing = false;
    }

    render() {
        if (!this.options.$parent) {
            if (this.options.$attached && this.options.$attached.closest('#modal-container').length > 0) {
                this.options.$parent = $('#modal-container');
            } else {
                this.options.$parent = $('body');
            }
        }

        this.$el
            .append(this.template(this.options))
            .addClass(`screentip ${this.class} ${this.options.classNames}`)
            .data('tipKey', this.options.key);

        if (this.options.width) {
            this.$el.css('width', this.options.width);
        }
        if (this.options.minWidth) {
            this.$el.css('minWidth', this.options.minWidth);
        }
        if (this.options.maxWidth) {
            this.$el.css('maxWidth', this.options.maxWidth);
        }

        this.options.$parent.append(this.$el);
        this.bindUI();

        if (this.onRenderComplete) {
            this.onRenderComplete();
        }

        setTimeout(this.open.bind(this), 0); // Required to recenter screentips that change size after being appended
    }

    open() {
        this.openTimer = setTimeout(() => {
            this.openTimer = null;

            if (this.options.$attached) {
                this.options.$attached.data('tipKey', this.options.key);
                this.$el.css(this.getPositionVal());
            }

            TweenMax.from(this.$el, .15, {
                rotationY: '70deg',
                opacity: -.5, // Start at negative value so we're partly animated in before element is visible
                onComplete: () => { this.isOpen = true; }
            });
        }, this.options.delay);

        if (!this.options.persistOnMouseOut && this.options.$attached) {
            this.options.$attached.one('mouseleave', this.close.bind(this));
        }
    }

    close(options = {}) {
        this.isClosing = true;

        let $dfd = $.Deferred();

        if (!this.isOpen && this.openTimer) {
            clearTimeout(this.openTimer);
            options.instant = true;
        }

        if (options.instant) {
            this.destroyView();
            $dfd.resolve();
        } else {
            TweenMax.to(this.$el, .1, {
                rotationX: '60deg',
                opacity: -.5,
                onComplete: () => {
                    this.isOpen = false;
                    this.destroyView();
                    $dfd.resolve();
                }
            });
        }

        return $dfd.promise();
    }

    destroyView() {
        if (this.isOpen && !this.isClosing) {
            this.close();
            return;
        }

        if (this.options.$attached) {
            this.options.$attached.data('tipKey', undefined);
        }

        this.trigger('unloadTip');
        super.destroyView();
    }

    getPositionVal() {
        if (this.options.cursorEv) {
            return this.getPositionRelativeToCursor(this.options.cursorEv);
        } else if (!this.options.$attached || this.options.$attached.length < 1) return {};

        let attachedPos = this.options.$attached.offset(),
            parentPos = this.options.$attached.offset(),
            test = {
                tip: {
                    posPad: this.options.posPad,
                    width: this.$el.outerWidth(),
                    height: this.$el.outerHeight()
                },
                attached: {
                    width: this.options.$attached.outerWidth(),
                    height: this.options.$attached.outerHeight(),
                    top: attachedPos.top,
                    left: attachedPos.left
                },
                parent: {
                    width: this.options.$parent.width(),
                    height: this.options.$parent.height(),
                    top: parentPos.top,
                    left: parentPos.left
                },
                dirType: null
            },
            css = _.extend({}, attachedPos, {
                transformOrigin: 'center center'
            });

        _.merge(test.attached, {
            bottom: Math.max(test.parent.height - (test.attached.top + test.attached.height), 0),
            right: Math.max(test.parent.width - (test.attached.left + test.attached.width), 0)
        });

        // Set origin point based off of positionDir
        switch (this.options.posDir) {
            case 'top':
            case 'up':
                css.bottom = test.attached.bottom + test.attached.height + test.tip.posPad;
                delete css.top;

                css.transformOrigin = 'bottom center';
                test.dirType = 'v';
            break;
            case 'right':
                css.left += test.attached.width + test.tip.posPad;
                css.transformOrigin = 'center left';
                test.dirType = 'h';
            break;
            case 'bottom':
            case 'down':
                css.top += test.attached.height + test.tip.posPad;
                css.transformOrigin = 'top center';
                test.dirType = 'v';
            break;
            case 'left':
                css.right = test.attached.right + test.attached.width + test.tip.posPad;
                delete css.left;

                css.transformOrigin = 'center right';
                test.dirType = 'h';
            break;
        }

        // Set spill adjustment
        if (test.dirType === 'h') {
            switch (this.options.posSpill) {
                case 'top':
                case 'up':
                    css.top -= test.tip.height - test.attached.height;
                break;
                case 'center':
                case 'middle':
                    css.top -= (test.tip.height - test.attached.height) / 2;
                break;
            }
        } else if (test.dirType === 'v') {
            switch (this.options.posSpill) {
                case 'left':
                    css.left -= test.tip.width - test.attached.width;
                break;
                case 'center':
                case 'middle':
                    css.left -= (test.tip.width - test.attached.width) / 2;
                break;
            }
        }

        if (!!this.options.posAutoCorrect) {
            return this.positionAutoCorrect(css, test);
        } else {
            return css;
        }
    }

    positionAutoCorrect(css, test) {
        var scrollTop = 0,
            scrollLeft = 0;

        switch (test.dirType) {
            case 'h': // Screentip is to the left or right of its attached element
                // Slide up/down if contact with edge
                if (css.top) {
                    if (css.top < 0) { // Contact top edge
                        css.top = 0;
                    } else if (css.top + test.tip.height > test.parent.height) { // Contact bottom edge
                        css.top = test.parent.height - test.tip.height;
                    }
                } else if (css.bottom) {
                    if (css.bottom < 0) { // Contact bottom edge
                        css.bottom = 0;
                    } else if (css.bottom + test.tip.height > test.parent.height) { // Contact top edge
                        css.bottom = test.parent.height - test.tip.height;
                    }
                }

                // Reposition left/right if contact with edge
                if (css.left) {
                    if (css.left < 0) { // Contact left edge
                        if (test.attached.right > test.tip.width && !this.options.resizeableH) { // There's enough room to move the tip to the right side
                            css.left = test.attached.left + test.attached.width + test.tip.posPad;
                            css.transformOrigin = 'center left';
                        } else { // Not enough room on the right, so resize tip instead
                            css.maxWidth = test.attached.left - test.tip.posPad;
                        }
                    } else if (css.left + test.tip.width - scrollLeft > test.parent.width) { // Contact right edge
                        if (test.attached.left > test.tip.width && !this.options.resizeableH) { // There's enough room to move the tip to the left side
                            css.left = test.attached.left - test.tip.width - test.tip.posPad;
                            css.transformOrigin = 'center right';
                        } else { // Not enough room on the left, so resize tip instead
                            css.maxWidth = test.attached.right - test.tip.posPad;
                        }
                    }
                } else if (css.right) {
                    if (css.right < 0) { // Contact right edge
                        if (test.attached.left > test.tip.width && !this.options.resizeableH) { // There's enough room to move the tip to the left side
                            css.right = test.attached.right + test.attached.width + test.tip.posPad;
                            css.transformOrigin = 'center right';
                        } else { // Not enough room on the left, so resize tip instead
                            css.maxWidth = test.attached.right - test.tip.posPad;
                        }
                    } else if (css.right + test.tip.width - scrollleft > test.parent.width) { // Contact left edge
                        if (test.attached.right > test.tip.width && !this.options.resizeableH) { // There's enough room to move the tip to the right side
                            css.right = test.attached.right - test.tip.width - test.tip.posPad;
                            css.transformOrigin = 'center left';
                        } else { // Not enough room on the right, so resize tip instead
                            css.maxWidth = test.attached.left - test.tip.posPad;
                        }
                    }
                }
            break;
            case 'v': // Screentip is above or below its attached element
                // Slide left/right if contact with edge
                if (css.left) {
                    if (css.left < 0) { // Contact left edge
                        css.left = 0;
                    } else if (css.left + test.tip.width > test.parent.width) { // Contact right edge
                        css.left = test.parent.width - test.tip.width;
                    }
                } else if (css.right) {
                    if (css.right < 0) { // Contact right edge
                        css.right = 0;
                    } else if (css.right + test.tip.width > test.parent.width) { // Contact left edge
                        css.right = test.parent.width - test.tip.width;
                    }
                }

                // Reposition top/bottom if contact with edge
                if (css.top) {
                    if (css.top < 0) { // Contact top edge
                        if (test.attached.bottom > test.tip.height && !this.options.resizeableV) { // There's enough room to move the tip below
                            css.top = test.attached.top + test.attached.height + test.tip.posPad;
                            css.transformOrigin = 'top center';
                        } else { // Not enough room below, so resize tip instead
                            css.maxHeight = test.attached.top - test.tip.posPad;
                        }
                    } else if (css.top + test.attached.top + test.tip.height - scrollTop > test.parent.height) { // Contact bottom edge
                        if (test.attached.top > test.tip.height && !this.options.resizeableV) { // There's enough room to move the tip above
                            css.top = test.attached.top - test.tip.height - test.tip.posPad;
                            css.transformOrigin = 'bottom center';
                        } else { // Not enough room above, so resize tip instead
                            css.maxHeight = test.attached.bottom - test.tip.posPad;
                        }
                    }
                } else if (css.bottom) {
                    if (css.bottom < 0) { // Contact bottom edge
                        if (test.attached.top > test.tip.height && !this.options.resizeableV) { // There's enough room to move the tip above
                            css.bottom = test.attached.bottom + test.attached.height + test.tip.posPad;
                            css.transformOrigin = 'bottom center';
                        } else { // Not enough room above, so resize tip instead
                            css.maxHeight = test.attached.bottom - test.tip.posPad;
                        }
                    } else if (css.bottom + test.tip.height - scrollTop > test.parent.height) { // Contact top edge
                        if (test.attached.bottom > test.tip.height && !this.options.resizeableV) { // There's enough room to move the tip below
                            css.bottom = test.attached.bottom - test.tip.height - test.tip.posPad;
                            css.transformOrigin = 'top center';
                        } else { // Not enough room below, so resize tip instead
                            css.maxHeight = test.attached.top - test.tip.posPad;
                        }
                    }
                }
            break;
        }

        return css;
    }

    getPositionRelativeToCursor(ev) {
        let test = {
                posPad: this.options.posPad,
                width: this.$el.outerWidth(),
                height: this.$el.outerHeight(),
                window: {
                    width: $(window).width(),
                    height: $(window).height()
                }
            },
            css = {
                top: ev.pageY - 4,
                left: ev.pageX - 4,
                transformOrigin: 'top left'
            };

        if (css.left + test.width > test.window.width) { // Contact right edge
            css.left = test.window.width - test.width;
            css.transformOrigin = 'top center';
        }

        if (css.top + test.height > test.window.height) { // Contact bottom edge
            css.top = test.window.height - test.height;
            css.transformOrigin = 'center left';
        }

        return css;
    }
}
