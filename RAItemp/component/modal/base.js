import './styles/base.scss';
//import Draggabilly from 'draggabilly'; // TODO: Not sure if we're going to use this. Used for tragging modals around the screen

export default class ModalBase extends Class.View.Base {
    constructor(options = {}) {
        super(options);

        this.ui = {
            'header': '[class|=modal-header]',
            'close': '[data-js~=modal-close]'
        };
        this.events = {
            'click @close': 'onClickClose',
            'click [data-navigate]': 'onClickNavigate'
        };

        this.isOpen = false;
    }

    render() {
        this.$el
            .append(this.template(this.options))
            .addClass(`modal ${this.class}`);

        if (!$('body').is('[data-appsize=mobile]') && !$('body').is('[data-appsize=tablet]')) {
            this.$el.css('transform', 'translateX(-50%) translateY(-50%)');
        }

        this.bindUI();

        if (this.onRenderComplete) {
            this.onRenderComplete();
        }

        this.open();
    }

    open() {
        let $dfd = $.Deferred(),
            isMobile = util.getAppSize().smallScreen;

        TweenMax.set(this.$el, {
            transformOrigin:'50% top -50'
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

               /* if (this.dragHandle) {
                    if (this.dragHandle instanceof $) {
                        this.dragHandle = this.dragHandle[0];
                    }
                    if (this.dragHandle.nodeType) {
                        let classes = this.dragHandle.className.split(' '),
                            tag = this.dragHandle.localName,
                            id = this.dragHandle.id,
                            cls = classes.join('.');
                        this.dragHandle = `${tag}${id ? ('#' + id) : ''}${cls ? ('.' + cls) : ''}`;
                    }

                    this.draggie = new Draggabilly(this.$el[0], {
                        containment: $('#modal-container'),
                        handle: (typeof this.dragHandle === 'string') ? this.dragHandle : '' // Handle must be a selector string
                    });
                }*/

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

        // TODO: This is intended to handle tips attached to the modal. Watch out for other closing bugs if we have more complex modals later
        if (this.childViews && !$.isEmptyObject(this.childViews)) {
            for (let key in this.childViews) {
                TweenMax.to(this.childViews[key].$el.css('opacity', 1), .2, {
                    opacity: 0
                });
            }
        }

        return $dfd.promise();
    }

    onClickClose(ev) {
        this.close();
    }

    onClickNavigate(ev) {
        atlas.navigate($(ev.currentTarget).data('navigate'));
    }

    destroyView() {
        $(document).off('.modalHandler');
        this.$el.off('.modalHandler');

        super.destroyView();
    }
}
