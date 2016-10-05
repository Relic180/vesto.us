import './styles/base.scss';

const defaults = {
    classNames: '', // instance-specific and added as one-off classes
    posDir: 'bottom', // top, right, bottom, left -- This is the direction to attach the tip relative to $atatched or cursor
    posSpill: 'center', // up, down, left, right, center, middle -- This is the direction the tip can flex or "slide" as its content size changes
    posPad: 5,
    posAutoCorrect: true,
    posAutoCorrectContain: false,
    width: null,
    minWidth: '0px',
    maxWidth: '100%', // TODO: This needs some testing...
    delay: 0,
    isOpen: false,
    isSubmenu: false,
    persistOnScroll: true,
    persistOnMouseOut: true,
    persistOnClick: false,
    toggleOnClick: false
};

export default class ScreentipBase extends Class.View.Base {
    constructor(options = {}) {
        options = _.defaults(options, defaults);
        super(options);

        let $el = options.$attached;

        if ($el && !($el instanceof $)) {
            options.$attached = $($el); // Ensure $attached is a jQuery object
        }

        this.coordinator = options.coordinator;
        this.isOpen = false;
        this.isClosing = false;

        if (options.parentView) {
            options.parentView.childViews[options.key] = this;
        }
    }

    render() {
        let $appendEl;

        if (this.options.$parent) {
            $appendEl = this.options.$parent;
        } else if (this.options.$attached && this.options.$attached.closest('#modal-container').length > 0) {
            $appendEl = this.options.$parent = $('#modal-container');
        } else {
            $appendEl = $('body');
        }

        this.$el
            .append(this.template(this.options))
            .addClass(`screentip ${this.class} ${this.options.classNames}`)
            .data('tipKey', this.options.key);

        if (this.options.width) {
            this.$el.css({
                width: this.options.width
            });
        } else {
            this.$el.css({
                minWidth: this.options.minWidth,
                maxWidth: this.options.maxWidth
            });
        }

        $appendEl.append(this.$el);
        this.bindUI();
        this.open();
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
                onComplete: () => {
                    this.isOpen = true;
                }
            });
        }, this.options.delay);

        if (!this.options.persistOnMouseOut && this.options.$attached) {
            this.options.$attached.one('mouseleave', _.bind(this.close, this));
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
            this.closeTimer = setTimeout(() => {
                TweenMax.to(this.$el, .1, {
                    rotationX: '60deg',
                    opacity: -.5,
                    onComplete: () => {
                        this.isOpen = false;
                        this.destroyView();
                        $dfd.resolve();
                    }
                });

                this.closeTimer = null;
            }, this.options.delay);
        }

        return $dfd.promise();
    }

    destroyView() {
        let $attached = this.options.$attached;

        if (this.isOpen && !this.isClosing) {
            this.close();
            return;
        }
        if ($attached) {
            $attached.data('tipKey', undefined);
        }

        this.trigger('unloadTip');
        super.destroyView();
    }

    getPositionVal() {
        if (this.options.cursorEv) {
            return this.getPositionRelativeToCursor(this.options.cursorEv);
        } else if (!this.options.$attached || !this.options.$attached.length) {
            return false;
        }

        let attachedPos = this.options.$attached.offset();

        if (this.options.$parent) {
            let parentPos = this.options.$parent.offset();
            attachedPos.top = attachedPos.top - parentPos.top;
            attachedPos.left = attachedPos.left - parentPos.left;
        }

        let test = {
                posPad: this.options.posPad,
                width: this.$el.outerWidth(),
                height: this.$el.outerHeight(),
                attached: {
                    width: this.options.$attached.outerWidth(),
                    height: this.options.$attached.outerHeight(),
                    top: attachedPos.top,
                    left: attachedPos.left
                },
                window: {
                    width: $(window).width(),
                    height: $(window).height()
                },
                dirType: null
            },
            css = {
                top: test.attached.top,
                left: test.attached.left,
                transformOrigin: 'center center'
            };

        test.attached.bottom = test.window.height - (test.attached.top + test.attached.height);
        test.attached.right = test.window.width - (test.attached.left + test.attached.width);

        // Set origin point based off of positionDir
        switch (this.options.posDir) {
            case 'top':
            case 'up':
                css.bottom = test.attached.bottom + test.attached.height + test.posPad;
                delete css.top;

                css.transformOrigin = 'bottom center';
                test.dirType = 'v';
            break;
            case 'right':
                css.left += test.attached.width + test.posPad;
                css.transformOrigin = 'center left';
                test.dirType = 'h';
            break;
            case 'bottom':
            case 'down':
                css.top += test.attached.height + test.posPad;
                css.transformOrigin = 'top center';
                test.dirType = 'v';
            break;
            case 'left':
                css.right = test.attached.right + test.attached.widht + test.posPad;
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
                    css.top -= test.height - test.attached.height;
                break;
                case 'center':
                case 'middle':
                    css.top -= (test.height - test.attached.height) / 2;
                break;
            }
        } else if (test.dirType === 'v') {
            switch (this.options.posSpill) {
                case 'left':
                    css.left -= test.width - test.attached.width;
                break;
                case 'center':
                case 'middle':
                    css.left -= (test.width - test.attached.width) / 2;
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
            scrollLeft = 0,
            attachedOffset = this.options.$attached.offset();

        test.attached.topGap = this.options.posAutoCorrectContain ? test.attached.top : attachedOffset.top;
        test.attached.rightGap = this.options.posAutoCorrectContain ? test.window.width - (attachedOffset.left + test.attached.width) : test.attached.right;
        test.attached.bottomGap = this.options.posAutoCorrectContain ? test.window.height - (attachedOffset.top + test.attached.height) : test.attached.bottom;
        test.attached.leftGap = this.options.posAutoCorrectContain ? test.attached.left : attachedOffset.left;

        switch (test.dirType) {
            case 'h': // Screentip is to the left or right of its attached element
                // Slide up/down if contact with edge
                if (css.top) {
                    if (css.top < 0) { // Contact top edge
                        css.top = 0;
                    } else if (css.top + test.height > test.window.height) { // Contact bottom edge
                        css.top = test.window.height - test.height;
                    }
                } else if (css.bottom) {
                    if (css.bottom < 0) { // Contact bottom edge
                        css.bottom = 0;
                    } else if (css.bottom + test.height > test.window.height) { // Contact top edge
                        css.bottom = test.window.height - test.height;
                    }
                }

                // Reposition left/right if contact with edge
                if (css.left) {
                    if (css.left < 0) { // Contact left edge
                        if (test.attached.rightGap > test.width) { // There's enough room to move the tip to the right side
                            css.left = test.attached.left + test.attached.width + test.posPad;
                            css.transformOrigin = 'center left';
                        } else { // Not enough room on the right, so resize tip instead
                            css.width = test.attached.leftGap;
                        }
                    } else if (css.left + test.width - scrollLeft > test.window.width) { // Contact right edge
                        /*if (this.options.isSubmenu) { // TODO: We don't officially support submenus yet
                            css.left = parentMenuPos.left || parentMenuPos.right;
                        }*/
                        if (test.attached.leftGap > test.width) { // There's enough room to move the tip to the left side
                            css.left = test.attached.left - test.width - test.posPad;
                            css.transformOrigin = 'center right';
                        } else { // Not enough room on the left, so resize tip instead
                            css.width = test.attached.rightGap;
                        }
                    }
                } else if (css.right) {
                    if (css.right < 0) { // Contact right edge
                        if (test.attached.leftGap > test.width) { // There's enough room to move the tip to the left side
                            css.right = test.attached.right + test.attached.width + test.posPad;
                            css.transformOrigin = 'center right';
                        } else { // Not enough room on the left, so resize tip instead
                            css.width = test.attached.rightGap;
                        }
                    } else if (css.right + test.width - scrollleft > test.window.width) { // Contact left edge
                        /*if (this.options.isSubmenu) { // TODO: We don't officially support submenus yet
                            css.right = parentMenuPos.left || parentMenuPos.right;
                        }*/
                        if (test.attached.rightGap > test.width) { // There's enough room to move the tip to the right side
                            css.right = test.attached.right - test.width - test.posPad;
                            css.transformOrigin = 'center left';
                        } else { // Not enough room on the right, so resize tip instead
                            css.width = test.attached.leftGap;
                        }
                    }
                }
            break;
            case 'v': // Screentip is above or below its attached element
                // Slide left/right if contact with edge
                if (css.left) {
                    if (css.left < 0) { // Contact left edge
                        css.left = 0;
                    } else if (css.left + test.width > test.window.width) { // Contact right edge
                        css.left = test.window.width - test.width;
                    }
                } else if (css.right) {
                    if (css.right < 0) { // Contact right edge
                        css.right = 0;
                    } else if (css.right + test.width > test.window.width) { // Contact left edge
                        css.right = test.window.width - test.width;
                    }
                }

                // Reposition top/bottom if contact with edge
                if (css.top) {
                    if (css.top < 0) { // Contact top edge
                        if (test.attached.bottomGap > test.height) { // There's enough room to move the tip below
                            css.top = test.attached.top + test.attached.height + test.posPad;
                            css.transformOrigin = 'top center';
                        } else { // Not enough room below, so resize tip instead
                            css.height = test.attached.topGap;
                        }
                    } else if (css.top + test.height - scrollTop > test.window.height) { // Contact bottom edge
                        if (test.attached.topGap > test.height) { // There's enough room to move the tip above
                            css.top = test.attached.top - test.height - test.posPad;
                            css.transformOrigin = 'bottom center';
                        } else { // Not enough room above, so resize tip instead
                            css.height = test.attached.bottomGap;
                        }
                    }
                } else if (css.bottom) {
                    if (css.bottom < 0) { // Contact bottom edge
                        if (test.attached.topGap > test.height) { // There's enough room to move the tip above
                            css.bottom = test.attached.bottom + test.attached.height + test.posPad;
                            css.transformOrigin = 'bottom center';
                        } else { // Not enough room above, so resize tip instead
                            css.height = test.attached.bottomGap;
                        }
                    } else if (css.bottom + test.height - scrollTop > test.window.height) { // Contact top edge
                        if (test.attached.bottomGap > test.height) { // There's enough room to move the tip below
                            css.bottom = test.attached.bottom - test.height - test.posPad;
                            css.transformOrigin = 'top center';
                        } else { // Not enough room below, so resize tip instead
                            css.height = test.attached.topGap;
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
