let currentMessages = {};

function _newKeyGen() {
    let newKey = Date.now();

    if (currentMessages[newKey]) {
        return _newKeyGen();
    } else {
        return newKey;
    }
}

export default class Coordinator {
    constructor(options = {}) {
        util.bindDispatcher(this);
        this.app = options.app;

        // TODO: Let's do this differently
        this.$el = $(document.createElement('div'))
            .attr('id', 'messenger-container')
            .appendTo('body');
    }

    new(type, options = {}) {
        util.testForMissingOptions(['msg'], options);

        let $antiCollisionDfd = $.Deferred(),
            $dfd = $.Deferred();

        type = util.capFirstLetter(type);

        if (options.key && currentMessages[options.key]) {
            currentMessages[options.key].close()
                .done(() => {
                    $antiCollisionDfd.resolve();
                });
        } else {
            if (!options.key) {
                options.key = _newKeyGen(); // Ensures we get a unique key, even when creating a bunch of tips simultaneously
            }
            $antiCollisionDfd.resolve();
        }

        if (options.msg.length > 300) { // Enforcing a hard limit of 300 characters for now
            options.msg = `${options.msg.substring(0, 300)}...`;
        }

        this.app.newClass(`View.Messenger.${type}`, _.extend(options, {
           unload: this.unload
        }), 'no-parent')
            .done((newMessage) => {
                $.when($antiCollisionDfd).done(() => {
                    currentMessages[options.key] = newMessage;

                    newMessage.$el.appendTo(this.$el);
                    newMessage.render();

                    $dfd.resolve(newMessage);
                });
            });

        return $dfd.promise();
    }

    close(key, instant = false, kill = false) {
        let message = currentMessages[key];

        if (message) {
            message.close(instant, kill);
        }
    }

    closeAll() {
        for (let key in currentMessages) {
            currentMessages[key].close();
        }
    }

    unload(key) {
        if (!key) return;
        delete currentMessages[key];
    }

    currentMesseges() {
        return currentMesseges;
    }
}
