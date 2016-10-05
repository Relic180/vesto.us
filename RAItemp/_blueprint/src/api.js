// TODO OPTIMIZATIONS (Just ideas, might not do all this):

// - Requests should be queued. Subsequent requests should check queue and piggyback instead of creating duplicates
// - Requests could be cached. Subsequent requets might check the cache and re-use responses from identical requests (This could potentially impact data integrity)
// - API should be able to dynamically fetch asynchronously or synchronosly if there are some dependancies involved in requests
// - Requests can be cancelled before they have been returned
// - Auto-retry failed requests X number of times after X milliseconds before resolving as failed
// - Integrate additional handling for 3rd party APIs in here (as needed)
// - Integrate default app behaviors if platform is "down for maintenance"

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        let csrfSafe = ['GET','HEAD','OPTIONS','TRACE'],
            csrftoken = util.fetchCookie('csrftoken');

        if (csrfSafe.indexOf(settings.type) === -1 && !this.crossDomain) {
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
        }
    },
    timeout: 15000 // TODO: Create fallback for timeout failures
});

function _createRequest(endPoint, options = {}, data) {
    let $dfd = $.Deferred();

    if (data) {
        options.data = JSON.stringify(util.convertKeyNames(data, false));
    }

    $.ajax(_.defaults(options, {
        url: endPoint
    }))
        .done((data) => {
            $dfd.resolve(util.convertKeyNames(data));
        })
        .fail((response) => {
            // TODO handle error code 409 (conflicting update), DUP (model already exists), probably param validation as well?
            $dfd.reject();
        });

    return $dfd.promise();
}

function _idString(ids) {
    let str = '?ids=';

    ids = ids instanceof Array ? ids : [ids];
    for (var i = 0; i < ids.length; i++) {
        str += `${ids[i]},`;
    }

    return str.slice(0, -1);
}

export default class API {
    constructor(options = {}) {
        // TODO: Do we need any additional processing here?
    }

    get(type, ids) {
        return _createRequest(django.endpoints.api.userauth[type.toLowerCase()] + _idString(ids), {method: 'GET'});
    }

    create(type, data = {}) {
        return _createRequest(django.endpoints.api.userauth[type.toLowerCase()], {method: 'POST'}, data);
    }

    update(type, data = {}, id) {
        return _createRequest(django.endpoints.api.userauth[type.toLowerCase()] + id + '/', {method: 'PATCH'}, data);
    }

    delete(type, ids) {
        return _createRequest(django.endpoints.api.userauth[type.toLowerCase() + id + '/'], {method: 'DELETE'});
    }

    ///////////////////////////////////////

    login() {
        // TODO: Request to login
    }

    logout() {
        // TODO: Request to logout
    }

    forgotLogin() {
        // TODO: Request for login assistance
    }
}
