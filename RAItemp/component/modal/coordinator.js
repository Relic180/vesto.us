let currentModals = {};

export default class Coordinator {
    constructor(options = {}) {
        util.bindDispatcher(this);
        this.app = options.app;

        // TODO: Let's do this differently
        this.ui = {};
        this.ui.$body = $('body'),
        this.ui.$container = $(document.createElement('div')).attr('id', 'modal-container')
            .appendTo('body');
        this.ui.$mask = $(document.createElement('div')).attr('id', 'modal-mask')
            .appendTo(this.ui.$container)
            .on('click', _.throttle(this.onClickMask.bind(this), 100, {leading: false}));
    }

    new(type, options = {}) {
        let isMobile = util.getAppSize().smallScreen,
            $dfd = $.Deferred();

        type = util.capFirstLetter(type);

        this.app.newClass(`View.Modal.${type}`, _.extend({
            type,
            unload: _.bind(this.unload, this),
        }, options))
            .done((newModal) => {
                if (isMobile) {
                    this.scrollTopStore = this.app.ui.$pageContainer[0].scrollTop;
                }

                this.ui.$body.addClass('modal-open'); // This is only used for our mask

                currentModals[type] = newModal;

                setTimeout(() => { // Injecting small delay when mobile
                    if (isMobile) {
                        this.app.ui.$pageContainer[0].scrollTop = 0;
                    }
                    newModal.$el.appendTo(this.ui.$container);
                    newModal.render();

                    $dfd.resolve(newModal);
                }, isMobile ? 150 : 0);
            });

        return $dfd.promise();
    }

    unload(type) {
        if (!type) return;

        delete currentModals[type];

        if (Object.keys(currentModals).length < 1) {
            if (this.scrollTopStore) {
                this.app.ui.$pageContainer[0].scrollTop = this.scrollTopStore;
            }
            this.ui.$body.removeClass('modal-open');
        }
    }

    closeAll() {
        for (let type in currentModals) {
            currentModals[type].close(Object.keys(currentModals).length > 1); // Close all instantly, but animate the last one
            delete currentModals[type];
        }
    }

    onClickMask() {
        this.closeAll();
    }
}
