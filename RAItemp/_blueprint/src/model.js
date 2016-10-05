export default class Model extends Backbone.Model {
    constructor(options = {}, attributes) {
        super(options);
        util.bindDispatcher(this);
    }

    fetch() {
        let id = this.get(this.idAttribute)
            $dfd = $.Deferred();

        if (!id) return $dfd.reject();

        API.get(this.type, this.get('id'))
            .done((data) => {
                this.set(data);
                $dfd.resolve(data);
            })
            .fail((data) => {
                $dfd.reject(data);
            });

        return $dfd.promise();
    }

    save(options = this.attributes) { // Defaults to saving/creating the entire attribute hash
        let hasId = !!this.get('id'),
            $dfd = $.Deferred();

        if (hasId) {
            API.update(this.type, options, this.get('id'))
                .done((data) => {
                    $dfd.resolve(data);
                })
                .fail((data) => {
                    $dfd.reject(data);
                });
        } else {
            API.create(this.type, options)
                .done((data) => {
                    this.set('id', data.id);
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

        API.delete(this.type, this.get('id'))
            .done(() => {
                $dfd.resolve();
            })
            .fail((data) => {
                $dfd.reject(data);
            });

        return $dfd.promise();
    }
}
