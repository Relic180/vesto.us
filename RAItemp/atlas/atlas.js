import './styles/atlas.scss';

import { Olympus, OlympusView } from 'olympus';
import Router from './router.js';

_.merge(Class, {
    View: {
        Page: {
            Home: '_atlas_page_home',
            HomeEmployer: '_atlas_page_home_employer',
            DashboardCandidate: '_atlas_page_dashboard_candidate',
            ProfileCandidate: '_atlas_page_profile_candidate',
            Login: '_atlas_page_login',
            CreateAccount: '_atlas_page_create_account',
            NotFound: '_atlas_page_notfound'
        },
        Component: {
            Roadmap: '_component_candidate',
            ProfileBuilder: '_component_candidate'
        }
    }
});

class ApplicationView extends OlympusView {
    constructor(options = {}) {
        super(options);

        this.ui = {
            'body': '[data-js~=app-body]',
            'pageContainer': '@body [data-js~=page-container]',
            'appLoading': '[data-js~=application-loading]'
        };
        _.extend(this.events, {

        });

        $.when(this.app.$applicationReady).done(() => {
            this.ui.$body.removeClass('is-hidden');

            if (!this.app.authUser.getClient().smallScreen) {
                TweenMax.from(this.ui.$body, .5, {
                    scale: 1.1
                });
            }

            TweenMax.to(this.ui.$appLoading, .3, {
                delay: .2,
                opacity: 0,
                onComplete: () => {
                    this.ui.$appLoading.remove();
                }
            });
        });
    }
}

class Atlas extends Olympus {
    constructor() {
        super();
        window.atlas = this; // Allows our router and appView immediate access to application object

        this.authUser = new Class.Model.AuthUser(util.convertKeyNames(django.authUser));
        this.appView = new ApplicationView({
            el: document.body,
            app: this
        });
        this.appView.render();

        this.router = new Router();
        if (this.clientIsUnsupported()) {
            this.navigate('browser/unsupported');
            return;
        }

        // TODO: Add tracker

        $(window).on('load', () => {
            this.$applicationReady.resolve();
        });
    }

    clientIsUnsupported() {
        let client = util.detectClient(),
            version = client.version,
            unsupported = false;

        switch (client.browser) {
            case 'Chrome':
                if (version < 50) {
                    unsupported = true;
                }
            break;
            case 'Firefox':
                if (version < 46) {
                    unsupported = true;
                }
            break;
            case 'Safari':
                if (version < 9) {
                    unsupported = true;
                }
            break;
            default:
                unsupported = true;
        }

        if (unsupported && DEBUGGING) {
            unsupported = false;

            this.messenger.new('simple', {
                msg: `Browser unsupported: ${this.userClient.browser} v.${version} [DEBUGGING]`
            });
        }

        return unsupported;
    }
}

new Atlas;
