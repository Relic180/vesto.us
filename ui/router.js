// Atlas router file

// Defining permission based routs
// 'myroute': permissionedRoute('routeHandler', '_isPermissionTest', 'alternateRouteHandler'),

const routes = {
    '': 'entry',
    'browser': 'browser', // Landing page for unsupported browser

    '*path' :'notFound'
};

function permissionedRoute(callback, permissionFunc, redirectTo) {
    return {
        callback,
        permissionFunc,
        redirectTo
    };
}

export default class Router extends Backbone.Router {
    constructor(options = {}) {
        super(options);

        this.app = options.app;
        this.routes = {};
        this.permissionsMap = {};

        for (let route in routes) {
            let routeEntry = routes[route];

            if (routeEntry instanceof Object) {
                this.permissionsMap[routeEntry.callback] = {
                    permissionFunc: this[routeEntry.permissionFunc],
                    redirectTo: routeEntry.redirectTo
                };
                routeEntry = routeEntry.callback;
            }

            this.routes[route] = this.routeHandler(routeEntry);
        }

        this._bindRoutes();
        this.history = Backbone.history;
        this.history.start({pushState: true});
    }

    routeHandler(route, redirectTo) {
        return (...args) => {
            this.currentRoute = route;
            if (!this.permissionsMap[route] || this.permissionsMap[route].permissionFunc()) {
                return this[route](...args);
            }

            this._redirect(this.permissionsMap[route].redirectTo);
        }
    }

    // Route Handlers //////////////////////////////////////////////////

    entry() {
        this.app.loadPage('Home');
    }

    browser() {
        this.app.loadPage('Browser');
    }

    notFound(options = {}) {
        this.app.loadPage('NotFound');
    }

    // Permission Tests ///////////////////////////////////////////////

    _isLoggedIn() {
        return util.isDefined(this.app.authUser.get('id'));
    }

    _isSuperUser() {
        return (false && this._isLoggedIn() && this.app.authUser.permissionMap().superuser);  // TODO: Superuser property doesn't exist on users yet
    }

    _redirect(redirectTo = '') {
        return this.navigate(redirectTo, {trigger: true, replace: true});
    }

    _recheckPermission() {
        let currentRoute = this.permissionsMap[this.currentRoute];

        if (currentRoute && !currentRoute.permissionFunc()) {
            this._redirect(currentRoute.redirectTo);
        }
    }
}
