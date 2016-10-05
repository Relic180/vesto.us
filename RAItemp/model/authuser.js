// AuthUser Model

import User from './user.js'; // Special case since user model is defined very early during application initialization
import Mousetrap from 'mousetrap';

const defaults = {
    isSuperUser: false
},
teamDEV = [
    // Anna
    // Carlo
    // Dave Coy
    // Dennis
    // Erez
    // Lior
    // Rob
    // Tareq
],
teamQA = [
    // Karan
    // Kseniya
    // Margarita
    // Swathi
],
teamPRODUCT = [
    // Amir
    // Dave Cam
    // Kasia
    // Yaeli
],
teamSPECIAL = [
    // Temporary one-off storage of additional users
];

export default class AuthUser extends User {
    constructor(options ={}) {
        super(_.defaults(options, defaults));

        this.setClient();
        this.featureSettings = {};
        if (teamQA.concat(teamDEV, teamPRODUCT, teamSPECIAL).includes(this.get('id'))) {
            this.storeFeatureSettings(true);
        }
    }

    setClient() {
        this.set('userClient', _.merge(util.detectClient(), util.getAppSize()));
        return this.getClient();
    }

    getClient() {
        return this.get('userClient');
    }

    save(options) {
        let $dfd = $.Deferred();

        super.save(options)
            .done(() => {
                this.unset('password');
                $dfd.resolve();
            })
            .fail((data) => {
                $dfd.reject(data);
            });

        return $dfd.promise();
    }

    getPrimaryOrg() {
        let workHistory = this.get('workHistory');
        return (workHistory && workHistory[0]) || undefined;
    }

    login() {

    }

    logout() {

    }

    permissionMap() {
        let superUser = !!this.get('isSuperUser');
        return {superUser};
    }

    toggleFeatureSettings(ev) {
        let feature = ev.code.slice(-1),
            setting = this.featureSettings[feature];

        if (!setting) return;

        atlas.messenger.new('simple', {
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
            ], _.bind(this.toggleFeatureSettings, this));
        } else {
            util.setCookie('featureSettings', JSON.stringify(this.featureSettings));
        }
    }

    isRestrictedFeature(id) {
        let isQA = teamQA.includes(this.get('id')),
            isDEV = teamDEV.includes(this.get('id')),
            isPRODUCT = teamPRODUCT.includes(this.get('id')),
            isSPECIAL = teamSPECIAL.includes(this.get('id'));

        if (!this.featureSettings[id] || !this.featureSettings[id].enabled) return false;

        switch (id) {
            case 0: // Pending...
                /*if (isQA || isDEV) {
                    return true;
                }*/
            break;
        }

        return false;
    }
}
