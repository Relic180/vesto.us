let currentScreentips = {};

function _newKeyGen() {
    let newKey = Date.now();

    if (currentScreentips[newKey]) {
        return _newKeyGen();
    } else {
        return newKey;
    }
}

export default class Coordinator {
    constructor(options = {}) {
        util.bindDispatcher(this);
        this.app = options.app;

        this.listenTo(this.app, 'global:click', _.bind(this.onClickGlobal, this));
    }

    new(type, options = {}) {
        let $antiCollisionDfd = $.Deferred(),
            $dfd = $.Deferred();

        type = util.capFirstLetter(type);

        if (options.key && currentScreentips[options.key]) {
            currentScreentips[options.key].close()
                .done(() => {
                    $antiCollisionDfd.resolve();
                });
        } else {
            if (!options.key) {
                options.key = _newKeyGen(); // Ensures we get a unique key, even when creating a bunch of tips simultaneously
            }
            $antiCollisionDfd.resolve();
        }

        this.app.newClass(`View.Screentip.${type}`, _.extend({
            type,
            unload: _.bind(this.unload, this),
        }, options))
            .done((newScreentip) => {
                $.when($antiCollisionDfd).done(() => {
                    if (!options.multiScreentips && newScreentip.type !== 'simple') {
                        this.closeAll({exclude: options.key});
                    }

                    newScreentip
                        .on(`navigate`, (url, options) => this.trigger('navigate', url, options)) // TODO: Temporary workaround until context menus can use pushstate to navigate instead
                        .on(`closeAll`, _.bind(this.closeAll, this))
                        .on(`unloadTip`, () => {
                            this.close(options.key);
                        });
                    newScreentip.render();
                    currentScreentips[options.key] = newScreentip;

                    $dfd.resolve(newScreentip);
                });
            });

        return $dfd.promise();
    }

    close(key) {
        if (!key) return;

        let tip = currentScreentips[key];

        if (tip) {
            if (tip instanceof Class.View.Screentip.Base) {
                tip.close();
            }

            this.unload(key);
        }
    }

    unload(key) {
        if (!key) return;

        delete currentScreentips[key];
    }

    closeAll(options = {}) {
        for (let key in currentScreentips) if (currentScreentips.hasOwnProperty(key)) {
            if (options.type && currentScreentips[key].type !== options.type) continue; // Only close screentips of a certain options.type, if argument is passed
            if (options.exclude && key == options.exclude) continue; // Requires loose equality (num == str)

            this.close(key);
        }
    }

    onClickGlobal(ev) {
        if (ev.isDefaultPrevented()) return;

        let $clickedTip = $(ev.target).closest('.screentip'),
            clickedTipKey = $clickedTip ? $clickedTip.data('tipKey') : null;

        for (let key in currentScreentips) if (currentScreentips.hasOwnProperty(key)) {
            if (!currentScreentips[key].persistOnClick && clickedTipKey !== currentScreentips[key].options.key && currentScreentips[key].isOpen) {
                this.close(key);
            }
        }
    }

    currentTips() {
        return currentScreentips;
    }
}
