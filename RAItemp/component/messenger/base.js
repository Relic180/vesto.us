import './styles/base';

const defaults = {
    defaultTimeout: 5000,
    persist: false
};

export default class MessageBase extends Class.View.Base {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.ui = {
            'close': '[data-js~=close]'
        };
        this.events = {
            'click @close': 'onClickClose'
        };
    }

    render() {
        this.$el
            .append(this.template(this.options))
            .addClass(`messenger-message ${this.type}`);

        this.bindUI();

        if (this.onRenderComplete) {
            this.onRenderComplete();
        }

        this.open();
    }

    open() {
        if (this.options.persist !== true) {
            setTimeout(() => {
                this.close();
            }, this.options.persist || this.options.defaultTimeout);
        }

        TweenMax.from(this.$el, .4, {
            left: '+=200px',
            opacity: 0,
            ease: Elastic.easeOut.config(1, 0.7)
        });
    }

    onClickClose(ev) {
        ev.preventDefault();
        this.close();
    }

    close(instant = false) {
        let aniLength = .4,
            cleanup = () => {
                this.$el.remove();

                if (this.options.onClose) {
                    this.options.onClose();
                }

                this.destroyView();
            };

        if (instant) {
            cleanup();
        } else {
            TweenMax.to(this.$el, aniLength * .75, {
                opacity: 0,
                scale: .9,
                top: '+=6px'
            });
            TweenMax.to(this.$el, aniLength * .5, {
                height: 0,
                marginTop: 0,
                onComplete: cleanup
            }).delay(aniLength * .33);
        }

        this.options.unload(this.type);
    }
}
