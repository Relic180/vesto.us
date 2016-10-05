import BackboneCollectionView from '../libs/backbone.collectionView.js';

export default class CollectionView extends BackboneCollectionView {
    constructor(options = {}, models = []) {
        super(options);
        util.bindDispatcher(this);

        this.listenTo(this, 'contentFiltered add remove', _.bind(_.debounce(this.setVisibleIndices, 50), this));
    }

    setVisibleIndices() {
        let visibleModels = this.filterResults();

        _.each(this.collection.models, (model) => {
            model.set('visibleIndex', null);
        });

        _.each(visibleModels, (model, idx) => {
            model.set('visibleIndex', idx);
        });
    }

    // To clear a filter, pass the filter key as a remove param, or pass the key along with "remove = true"
    // Fetch currently visible result set (as standard array) by passing no parameters
    filterResults(filterObj) {
        this.filters = this.filters || [];

        if (!filterObj) {
            let arr = this.collection.models;

            _.each(this.filters, (val, key) => {
                if (val.affectAccess) {
                    arr = arr.filter(val.filterFunc);
                }
            });

            return arr;
        }

        if ((!filterObj.key || !filterObj.filterFunc) && !filterObj.remove) throw new Error('Incomplete or malformed filter object was received');
        let filterIndex = _.findIndex(this.filters, {key: filterObj.key || filterObj.remove});

        _.defaults(filterObj, {
            affectAccess: true
        });

        if (filterIndex < 0 && !filterObj.remove) {
            this.filters.push(filterObj);
        } else if (filterObj.remove) {
            this.filters.splice(filterIndex, 1);
        } else {
            this.filters[filterIndex] = filterObj; // Update existing filter
        }

        this.setOption('visibleModelsFilter', (model) => {
            if (this.filters.length === 0) {
                return true;
            } else {
                let filtered = false;

                _.each(this.filters, (val, key) => {
                    filtered = !val.filterFunc(model);
                });

                return !filtered;
            }
        });

        if (filterObj.affectAccess) {
            this.trigger('contentFiltered');
        }
    }
}
