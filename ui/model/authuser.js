// AuthUser Model

import User from './user.js'; // Special case since user model is defined very early during application initialization
import Mousetrap from 'mousetrap';

const defaults = {
    isSuperUser: false
},
teamDEV = [
    // Add an array of user ids to unlock features for specific users
];

export default class AuthUser extends User {
    constructor(options ={}) {
        super(_.defaults(options, defaults));

        this.setClient();
        this.featureSettings = {};

        if (teamDEV.includes(this.get('id'))) {
            this.storeFeatureSettings(true);
        }
    }

    setClient() {
        this.userClient = _.merge(util.detectClient(), util.getAppSize());
        return this.userClient;
    }

    save(options) {
        let $dfd = $.Deferred();

        super.save(options)
            .done((currentAttributes) => {
                if (currentAttributes === false) { // Save was skipped
                    return $dfd.resolve(false);
                }

                this.unset('password');
                delete currentAttributes.password;

                this.updateLastSaved(currentAttributes);
                $dfd.resolve();
            })
            .fail((data) => {
                $dfd.reject(data);
            });

        return $dfd.promise();
    }

    toggleFeatureSettings(ev) {
        let feature = ev.code.slice(-1),
            setting = this.featureSettings[feature];

        if (!setting) return;

        Bones.messenger.new('simple', {
            msg: `${setting.enabled ? 'Disabling' : 'Enabling'} feature: <strong>${setting.name}</strong><br>Refresh the page for settings to take affect.`,
            mode: `${setting.enabled ? 'error' : 'success'}`
        });

        setting.enabled = !setting.enabled;
        this.storeFeatureSettings();
    }

    storeFeatureSettings(init = false) {
        if (init) {
            this.featureSettings = _.extend({
                1: {
                    name: 'Pending...',
                    enabled: true
                }
            }, JSON.parse(util.fetchCookie('featureSettings')));

            Mousetrap.bind([
                'ctrl+shift+1',
                'ctrl+shift+2',
                'ctrl+shift+3',
                'ctrl+shift+4',
                'ctrl+shift+5'
            ], this.toggleFeatureSettings.bind(this));
        } else {
            util.setCookie('featureSettings', JSON.stringify(this.featureSettings));
        }
    }

    isRestrictedFeature(id) {
        let isDEV = teamDEV.includes(this.get('id'));

        if (!this.featureSettings[id] || !this.featureSettings[id].enabled) return false;

        switch (id) {
            case 0: // Pending...
                /*if (isDEV) {
                    return true;
                }*/
            break;
        }

        return false;
    }

    isSuperUser() {
        return this.get('isSuperUser');
    }
}
