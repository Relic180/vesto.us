export default class Tracker {
    constructor(options = {}) {
        util.bindDispatcher(this);
        this.app = options.app;

        $.when(this.app.$applicationReady).done(() => {
            // Initialize Google analytics
            ga('create', 'UA-XXXXXXXX-1', 'auto');

            this.trackEvents('AppLoad', { // Track the initial pageload
                label: this.app.currentPage.pageName,
                value: util.parseURL().path
            });

            this.listenTo(this.app, 'all', this.captureEvents);
        });
    }

    captureEvents(event, data) {
        let track = '',
            props = {};

        switch(event) {
            case 'track': // Generic tracking hook
                track = data.hitType || 'GenericRequest';
                props = data;
            break;
            case 'page:new':
                track = 'PageLoad';
                props = {
                    label: data.pageName
                };
            break;
        }

        this.trackEvents(track, props);
    }

    trackEvents(track = 'GenericRequest', props = {}, type = 'google') {
        _.extend(props, server.trackingConstants, {userId: this.app.authUser.get('id')});

        switch(type) {
            case 'google':
                if (window.ga) {
                    ga('send', {
                        hitType: track,
                        eventCategory: props.category || 'Unspecified',
                        eventAction: props.action || 'Unspecified',
                        eventLabel: props.label || 'Unspecified',
                        eventValue: props.value || 'Unspecified'
                    });
                }
            break;
        }
    }
}
