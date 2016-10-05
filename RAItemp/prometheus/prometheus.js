import './styles/prometheus.scss';

import { Olympus, OlympusView } from 'olympus';
import Router from './router.js';

_.merge(Class, {
    View: {
        Page: {
            Home: '_prometheus_page_home'
        },
        Component: {

        }
    }
});

class ApplicationView extends OlympusView {
    constructor(options = {}) {
        super(options);

        this.ui, {
            'body': '[data-js~=app-body]',
            'pageContainer': '@body [data-js~=page-container]',
            'appLoading': '[data-js~=application-loading]'
        };
        _.extend(this.events, {

        });

        $.when(this.app.$applicationReady).done(() => {
            this.ui.$body.removeClass('is-hidden');
            TweenMax.to(this.ui.$appLoading, .4, {
                opacity: 0,
                onComplete: () => {
                    this.ui.$appLoading.remove();
                }
            });
        });
    }
}

class Prometheus extends Olympus {
    constructor(options = {}) {
        super();
        window.prometheus = this; // Allows our router and appView immediate access to application object

        this.authUser = new Class.Model.AuthUser(util.convertKeyNames(django.authUser));
        this.appView = new ApplicationView({
            el: document.body,
            app: this
        });
        this.appView.render();

        this.router = new Router();

        $(window).on('load', () => {
            this.$applicationReady.resolve();
        });
    }
}

new Prometheus;
