// Collection Base

export default class Collection extends Backbone.Collection {
    constructor(options = {}) {
        let models;

        if (options.models) {
            models = options.models;
            delete options.models;
        }

        super(models, options);
        this.setModelIndices();
    }

    initialize() {
        this.listenTo(this, 'add remove sort reset', _.debounce(() => {
            this.setModelIndices();
        }, 50));
    }

    getModelByAttribute(attr, value) {
        return this.find((model) => {
            return model.get(attr) === value;
        });
    }

    getModelsByAttributes(attrs) {
        return this.where(attrs);
    }

    setModelIndices() {
        _.each(this.models, (model, idx) => {
            model.set('index', idx);
        });
    }
}
