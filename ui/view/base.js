//Cached regex to split keys for `delegate`.
let delegateEventSplitter = /^(\S+)\s*(.*)$/;

function replaceTokens(str, map) {
    let tokenRegex = /@(\w*)/g;

    return str.replace(tokenRegex, (match, token) => {
        let expansion = map[token];

        if (expansion) {
            return replaceTokens(expansion, map);
        } else {
            return match;
        }
    });
}

export default class View extends Backbone.View {
    initialize(options = {}) {
        this.options = options;
        this.childViews = [];
        this.childModels = [];
    }

    render() {
        if (!this.$el || !this.template || !this.options) return this;

        this.$el.append(this.template(this.options));
        this.bindUI();

        if (this.onRender) {
            this.onRender();
        }

        return this;
    }

    bindUI() { // TODO: Should be able to run this multiple times but sometimes the old listeners aren't getting removed
        if (!this.ui) return;

        if (!this._uiBindings) {
            this._uiBindings = this.ui;
        }
        this.ui = {};

        _.each(this._uiBindings, (selector, name) => {
            let parsedSelector = replaceTokens(selector, this._uiBindings);
            this.ui['$' + name] = this.$el.find(parsedSelector);
        });

        this.delegateEvents();
    }

    delegateEvents(events) {
        let uiBindings = this._uiBindings || this.ui,
            parsedEvents = {};

        events || (events = _.result(this, 'events'));
        if (!events) return this;

        _.each(events, function(method, key) {
            let parsedKey = replaceTokens(key, uiBindings);
            parsedEvents[parsedKey] = method;
        });

        this.undelegateEvents();
        for (let key in parsedEvents) {
            let method = parsedEvents[key],
                match;

            if (!_.isFunction(method)) {
                method = this[method];
            }
            if (!method) continue;

            match = key.match(delegateEventSplitter);
            this.delegate(match[1], match[2], method.bind(this));
        }

        return this;
    }

    destroyView(options = {}) {
        this.isDestroyed = true;

        // Execute any view-specific logic
        if (_.isFunction(this.onDestroy)) {
            this.onDestroy();
        }

        // Listeners and data
        this.stopListening();
        this.undelegateEvents();
        this.off(null, null, this);
        this.$el.removeData().unbind();

        // Cleanup children
        if (this.childViews.length > 0) {
            this.cleanupChildViews();
        }
        if (this.childModels.length > 0) {
            this.cleanupChildModels();
        }

        // Markup
        if (!!options.preserveParentEl) {
            this.$el.empty();
        } else {
            this.$el.remove();
        }
    }

    cleanupChildModels(options = {}) {
        if (this.childModels.length === 0) return;

        // TODO: Cleanup childModels (do not automatically send DELETE commands to the api)
    }

    cleanupChildViews(options = {}) {
        if (this.childViews.length === 0) return;

        let preserveParentEl = util.isDefinedElse(options.preserveParentEl, false);

        for (let i = 0; i < this.childViews.length; i++) {
            let view = this.childViews[i];

            if (view) {
                view.destroyView({preserveParentEl});
            }
        }
    }
}
