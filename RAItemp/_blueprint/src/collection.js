export default class Collection extends Backbone.Collection {
    constructor(options = {}, models) {
        super(options);
        util.bindDispatcher(this);

        this.model = options.model || Model;

        if (options.comparator !== void 0) {
            this.comparator = options.comparator;
        }

        this._reset();
        this.initialize.apply(this, arguments);

        if (models) {
            this.reset(models, _.extend({
                silent: true
            }, options));
        }

        this.listenTo(this, 'add', _.debounce(() => {
            this.setModelIndices();
        }, 100));
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
