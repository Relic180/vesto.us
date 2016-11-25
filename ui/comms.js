// TODO OPTIMIZATIONS (Just ideas, might not do all this):

// - Requests should be queued. Subsequent requests should check queue and piggyback instead of creating duplicates
// - Requests could be cached. Subsequent requets might check the cache and re-use responses from identical requests (This could potentially impact data integrity)
// - API should be able to dynamically fetch asynchronously or synchronosly if there are some dependencies involved in requests
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

const apiPrefix = '/api/';

function _idString(ids) {
    let str = '?ids=';

    ids = ids instanceof Array ? ids : [ids];
    for (var i = 0; i < ids.length; i++) {
        str += `${ids[i]},`;
    }

    return str.slice(0, -1);
}

export default class Comms {
    constructor(options = {}) {
        this.$apiDeferred = $.Deferred().resolve(); // Hook used by tests to know when all api requests have completed
    }

    _createRequest(endPoint, options = {}, data) {
        let $dfd = $.Deferred();

        options.data = util.convertKeyNames(data, false);
        if (options.method !== 'GET') {
            options.data = JSON.stringify(options.data);
        }

        this.$apiDeferred = $.when(this.$apiDeferred, $dfd);
        $.ajax(_.defaults(options, {
            url: apiPrefix + endPoint,
            contentType: 'application/json'
        }))
            .done((data) => {
                $dfd.resolve(util.convertKeyNames(data));
            })
            .fail((response) => {
                $dfd.reject(response);
            });

        return $dfd.promise();
    }

    /// Model endpoints //////////////////////////

    get(api, ids) {
        return this._createRequest(api + '/' + _idString(ids), {method: 'GET'});
    }

    create(api, data = {}) {
        return this._createRequest(api + '/', {method: 'POST'}, data);
    }

    update(api, data = {}, id) {
        return this._createRequest(api + '/' + id + '/', {method: 'PATCH'}, data);
    }

    delete(api, ids) {
        return this._createRequest(api + '/' + _idString(ids), {method: 'DELETE'});
    }
}

// TODO: Add socket support
