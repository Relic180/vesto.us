import template from '../templates/page_home_employer.dot';
import '../styles/page_home.scss';

const defaults = {
    pageName: 'home-employer'
},
personalEmailDomains =[
    /* Default domains included */
    'aol.com', 'att.net', 'comcast.net', 'facebook.com', 'gmail.com', 'gmx.com', 'googlemail.com',
    'google.com', 'hotmail.com', 'hotmail.co.uk', 'mac.com', 'me.com', 'mail.com', 'msn.com',
    'live.com', 'sbcglobal.net', 'verizon.net', 'yahoo.com', 'yahoo.co.uk',
    /* Other global domains */
    'email.com', 'games.com' /* AOL */, 'gmx.net', 'hush.com', 'hushmail.com', 'icloud.com', 'inbox.com',
    'lavabit.com', 'love.com' /* AOL */, 'outlook.com', 'pobox.com', 'rocketmail.com' /* Yahoo */,
    'safe-mail.net', 'wow.com' /* AOL */, 'ygm.com' /* AOL */, 'ymail.com' /* Yahoo */, 'zoho.com', 'fastmail.fm',
    'yandex.com',
    /* United States ISP domains */
    'bellsouth.net', 'charter.net', 'comcast.net', 'cox.net', 'earthlink.net', 'juno.com',
    /* British ISP domains */
    'btinternet.com', 'virginmedia.com', 'blueyonder.co.uk', 'freeserve.co.uk', 'live.co.uk',
    'ntlworld.com', 'o2.co.uk', 'orange.net', 'sky.com', 'talktalk.co.uk', 'tiscali.co.uk',
    'virgin.net', 'wanadoo.co.uk', 'bt.com',
    /* Domains used in Asia */
    'sina.com', 'qq.com', 'naver.com', 'hanmail.net', 'daum.net', 'nate.com', 'yahoo.co.jp', 'yahoo.co.kr', 'yahoo.co.id', 'yahoo.co.in', 'yahoo.com.sg', 'yahoo.com.ph',
    /* French ISP domains */
    'hotmail.fr', 'live.fr', 'laposte.net', 'yahoo.fr', 'wanadoo.fr', 'orange.fr', 'gmx.fr', 'sfr.fr', 'neuf.fr', 'free.fr',
    /* German ISP domains */
    'gmx.de', 'hotmail.de', 'live.de', 'online.de', 't-online.de' /* T-Mobile */, 'web.de', 'yahoo.de',
    /* Russian ISP domains */
    'mail.ru', 'rambler.ru', 'yandex.ru', 'ya.ru', 'list.ru',
    /* Belgian ISP domains */
    'hotmail.be', 'live.be', 'skynet.be', 'voo.be', 'tvcablenet.be', 'telenet.be',
    /* Argentinian ISP domains */
    'hotmail.com.ar', 'live.com.ar', 'yahoo.com.ar', 'fibertel.com.ar', 'speedy.com.ar', 'arnet.com.ar',
    /* Domains used in Mexico */
    'hotmail.com', 'gmail.com', 'yahoo.com.mx', 'live.com.mx', 'yahoo.com', 'hotmail.es', 'live.com', 'hotmail.com.mx', 'prodigy.net.mx', 'msn.com'
];

export default class HomeEmployer extends Class.View.Page.Base {
    constructor(options = {}) {
        options = _.defaults(options, defaults);
        super(options);

        this.ui = {
            'hero': '[data-js~=hero]',
            'title': '[data-js~=title]',
            'email': '[data-js~=email]',
            'google': '[data-js~=google]',
            'facebook': '[data-js~=facebook]',
            'signup': '[data-js~=signup]',
            'candidateTab': '[data-js~=candidate]',
            'termsOfService': '[data-js~=tos]',
            'privacyPolicy': '[data-js~=privacy]'
        };
        this.events = {
            'click @signup': 'onClickSignup',
            'click @google': 'onClickSignupWithGoogle',
            'click @facebook': 'onClickSignupWithFacebook',
            'click @candidateTab': 'onClickCandidateTab',
            'click @termsOfService': 'onClickTermsOfService',
            'click @privacyPolicy': 'onClickPrivacyPolicy'
        };
        this.template = template;
        this.bindUI();
    }

    onClickCandidateTab(ev) {
        atlas.navigate('home');
    }

    onClickSignup(ev) {
        atlas.authUser.set('email', email);
        atlas.navigate('dashboard/company');
    }

    onClickSignupWithGoogle() {
        window.location.href = django.endpoints.page.googleLogin + '?next=/dashboard/company';
    }

    onClickSignupWithFacebook() {
        window.location.href = django.endpoints.page.fbLogin + '?next=/dashboard/company';
    }
}
