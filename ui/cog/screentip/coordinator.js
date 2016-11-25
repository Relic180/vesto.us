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

        this.listenTo(this.app, 'global:click', this.onClickGlobal.bind(this));
    }

    new(type, options = {}, parent) {
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
            unload: this.unload.bind(this),
        }, options), parent)
            .done((newScreentip) => {
                $.when($antiCollisionDfd).done(() => {
                    if (!options.multiScreentips && newScreentip.type !== 'simple') {
                        this.closeAll({exclude: options.key});
                    }

                    newScreentip
                        .on(`navigate`, (url, options) => this.trigger('navigate', url, options)) // TODO: Temporary workaround until context menus can use pushstate to navigate instead
                        .on(`closeAll`, this.closeAll.bind(this))
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

    close(keys) {
        if (!keys && typeof keys !== 'string' && !Array.isArray(keys)) return;

        if (!Array.isArray(keys)) {
            keys = [keys];
        }

        for (let key of keys) {
            let tip = currentScreentips[key];

            if (tip) {
                if (tip instanceof Class.View.Screentip.Base) {
                    tip.close();
                }

                this.unload(key);
            }
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
