import template from './templates/base';
import './styles/base';

import Draggabilly from 'draggabilly';

const defaults = {
    className: 'modal'
};

export default class ModalBase extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.template = template;

        this.ui = {
            'close': '[data-js~=close]',
            'content': '[data-js~=content]'
        };
        this.events = {
            'click @close': 'onClickClose',
            'click [data-navigate]': 'onClickNavigate'
        };

        this.isOpen = false;
        this.type = options.type;
    }

    onRender() {
        this.$el
            .addClass(`modal-${this.type}`)
            .css('visibility', 'hidden');
        this.ui.$content.append(this.modalTemplate(this.options));

        this.bindUI();

        if (this.onRenderComplete) {
            this.onRenderComplete();
        }

        if (!$('body').is('[data-appsize=mobile]') && !$('body').is('[data-appsize=tablet]')) {
            this.$el.css('transform', 'translateX(-50%) translateY(-50%)');
        }

        setTimeout(this.open.bind(this), 0); // Required to recenter modals that change demensions after appending to dom
    }

    open() {
        let $dfd = $.Deferred(),
            isMobile = util.getAppSize().smallScreen;

        TweenMax.set(this.$el, {
            transformOrigin:'50% top -50',
            visibility: 'visible'
        });
        TweenMax.from(this.$el, .2, {
            opacity: 0,
            rotationX: '20deg',
            onComplete: _.bind(function() {
                this.isOpen = true;

                TweenMax.set(this.$el, {
                    clearProps: 'all'
                });

                if (!$('body').is('[data-appsize=mobile]') && !$('body').is('[data-appsize=tablet]')) {
                    this.$el.css('transform', 'translateX(-50%) translateY(-50%)');  // We want this to be immediately overwritten when dragging
                }

                this.dragger = new Draggabilly(this.$el[0], {
                    containment: $('#modal-container'),
                    handle: '#modal-container [data-js~=drag]' // Handle option requires a selector string. Bad plugin, no cookie.
                });

                if (isMobile) {
                    let updateClass = () => {
                            if (!$(document.activeElement).is('input, textarea') && !this.isTouching) {
                                this.$el.removeClass('is-typing');
                            }
                        },
                        timer;

                    this.isTouching = false;

                    $(document)
                        .on('touchstart.modalHandler', () => {
                            this.isTouching = true;
                        })
                        .on('touchend.modalHandler', () => {
                            this.isTouching = false;
                            timer = setTimeout(updateClass, 10);
                        });

                    this.$el.find('input, textarea')
                        .on('focus.modalHandler', () => {
                            this.$el.addClass('is-typing');
                        })
                        .on('blur.modalHandler', () => {
                            timer = setTimeout(updateClass, 10);
                        });
                }

                if (this.onOpenComplete) {
                    this.onOpenComplete();
                }

                $dfd.resolve();
            }, this)
        });

        return $dfd.promise();
    }

    close(instant = false) {
        if (this.disableClose) return;

        let $dfd = $.Deferred(),
            cleanup = () => {
                this.isOpen = false;
                this.destroyView();
                $dfd.resolve();
            };

        if (instant) {
            cleanup();
        } else {
            TweenMax.set(this.$el, {
                transformOrigin:'50% bottom -200'
            });
            TweenMax.to(this.$el, .2, {
                opacity: 0,
                rotationX: '-15deg',
                onComplete: cleanup
            });
        }
        this.options.unload(this.type);

        return $dfd.promise();
    }

    onClickClose(ev) {
        this.close();
    }

    onClickNavigate(ev) {
        atlas.navigate($(ev.currentTarget).data('navigate')); // TODO: How to navigate without referencing atlas?
    }

    destroyView() {
        $(document).off('.modalHandler');
        this.$el.off('.modalHandler');

        super.destroyView();
    }
}
