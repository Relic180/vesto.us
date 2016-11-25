// Model Base

export default class Model extends Backbone.Model {
    constructor(options = {}) {
        super(options);
        util.bindDispatcher(this);

        this.updateLastSaved();
    }

    updateLastSaved(options = this.attributes) {
        this.lastSaved = _.cloneDeep(options);
    }

    getUnsavedAttributes() {
        let changed = {};

        for (let attr in _.extend({}, this.attributes, this.lastSaved)) {
            if (!_.isEqual(this.attributes[attr], this.lastSaved[attr])) {
                changed[attr] = this.attributes[attr];
            }
        }

        return changed;
    }

    fetch() {
        let id = this.get(this.idAttribute)
            $dfd = $.Deferred();

        if (!id) return $dfd.reject();

        API.get(this.api, this.get('id'))
            .done((data) => {
                this.set(data);
                this.updateLastSaved();
                $dfd.resolve(data);
            })
            .fail((data) => {
                $dfd.reject(data);
            });

        return $dfd.promise();
    }

    save(options) { // Defaults to saving/creating the entire attribute hash
        let hasId = !!this.get('id'),
            curAttributes = _.cloneDeep(this.attributes),
            $dfd = $.Deferred();

        if (hasId) {
            options = options || this.getUnsavedAttributes();
            if ($.isEmptyObject(options)) {
                $dfd.resolve(false);
            } else {
                API.update(this.api, options, this.get('id'))
                    .done(() => {
                        $dfd.resolve(curAttributes);
                        this.updateLastSaved(curAttributes);
                    })
                    .fail((data) => {
                        $dfd.reject(data);
                    });
            }
        } else {
            options = options || this.attributes;
            API.create(this.api, options)
                .done((data) => {
                    this.set('id', data.id);
                    curAttributes.id = data.id;
                    this.updateLastSaved(curAttributes);
                    $dfd.resolve(data);
                })
                .fail((data) => {
                    $dfd.reject(data);
                });
        }

        return $dfd.promise();
    }

    delete(options = {}) {
        let $dfd = $.Deferred();

        API.delete(this.api, this.get('id'))
            .done(() => {
                $dfd.resolve();
            })
            .fail((data) => {
                $dfd.reject(data);
            });

        return $dfd.promise();
    }
}
