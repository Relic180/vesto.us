// Atlas router file

const defaults = {
    routes: {
        '': 'redirectHome',
        'home(/:type)': 'home',
        'login': 'login',
        'create-account': 'createAccount',
        'profile(/:type(/:id))': 'profile',
        'dashboard(/:type(/:id))': 'dashboard',
        'oauth(/:type)': 'oauth',
        'browser/unsupported': 'browserUnsupported',
        '*path' :'notFound'
    }
};

export default class Router extends Backbone.Router {
    constructor(options = {}) {
        super(_.defaults(options, defaults));

        this.history = Backbone.history;
        this.history.start({pushState: true});
    }

    redirectHome() {
        this.navigate('home', {trigger: true});
    }

    home(type) {
        let page = !!type && type === 'employer' ? 'HomeEmployer' : 'Home';
        atlas.loadPage(page);
    }

    login(options = {}) {
        atlas.loadPage('Login');
    }

    createAccount(options = {}) {
        atlas.loadPage('CreateAccount');
    }

    dashboard(type = 'candidate', id) {
        atlas.loadPage(`Dashboard${util.capFirstLetter(type)}`, {id});
    }

    profile(type = 'candidate', id) {
        atlas.loadPage(`Profile${util.capFirstLetter(type)}`, {id});
    }

    oauth(type = 'facebook') {
        window.location.href = `${type === 'google' ? django.endpoints.page.googleLogin : django.endpoints.page.fbLogin}?user_type=C&next=/profile/candidate`;
    }

    browserUnsupported(options = {}) {
        console.warn('load unsupported browser page');
    }

    notFound(options = {}) {
        atlas.loadPage('NotFound');
    }
}
