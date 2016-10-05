// Prometheus router file

var defaults = {
    routes: {
        'tools/': 'home',
        '*path' :'notFound'
    }
};

export default class Router extends Backbone.Router {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.history = Backbone.history;
        this.history.start({pushState: true});
    }

    home(options = {}) {
        console.warn('load home');
    }

    notFound(options = {}) {
        console.warn('not found page');
    }
}
