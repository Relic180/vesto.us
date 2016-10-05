import template from '../templates/page_dashboard_candidate.dot';
import '../styles/page_dashboard_candidate.scss';

export default class DashboardCandidate extends Class.View.Page.Base {
    constructor(options = {}) {
        super(options);

        this.template = template;
        this.ui = {
            'profileBuilder': '[data-js~=profile-builder]',
            'getOffers': '[data-js~=get-offers]',
            'numCompanies': '[data-js~=num-companies]',
            'filterLocations': '[data-js~=locations]',
            'filterCategories': '[data-js~=categories]',
            'filterEmployees': '[data-js~=employees]'
        };
        this.events = {
            'click @filterLocations': 'onClickFilterLocations',
            'click @filterCategories': 'onClickFilterCategories',
            'click @filterEmployees': 'onClickFilterEmployees'
        };

        this.bindUI();
    }

    onRender() {
        if (atlas.authUser.get('activated')) {
            return this.ui.$profileBuilder.remove();
        }

        atlas.newClass('View.Component.ProfileBuilder', {
            el: this.ui.$profileBuilder,
            questions: [
                {
                    title: 'What is your current job?',
                    inputs: [
                        {key: 'title', label: 'Job title'},
                        {key: 'companyName', label: 'Company name'}
                    ],
                    prop: 'workHistory.0',
                    template: 'basic'
                },
                {
                    title: `Where'd you work before?`,
                    inputs: [
                        {key: 'title', label: 'Job title'},
                        {key: 'companyName', label: 'Company name'}
                    ],
                    prop: 'workHistory.1',
                    template: 'basic'
                },
                {
                    title: `What's your highest degree?`,
                    inputs: [
                        {key: 'degree', label: 'Degree type'},
                        {key: 'subject', label: 'Subject'},
                        {key: 'institution', label: 'Institution'}
                    ],
                    prop: 'education',
                    template: 'basic'
                },
                {
                    title: 'What are your top skills?',
                    inputs: [{key: null, label: 'Add skills'}],
                    prop: 'skills',
                    template: 'tagpicker'
                },
                {
                    title: '<p class="title">Pre-screen your connections with filters.</p><p class="title">Then, let up to <span>5,243</span> companies compete for you.</p>'
                }
            ],
            onComplete: () => {
                atlas.navigate('create-account');
            }
        }, this)
            .done((newProfileBuilder) => {
                this.profileBuilder = newProfileBuilder;
                this.profileBuilder.render();
            });
    }

    onClickFilterLocations(ev) {

    }

    onClickFilterCategories(ev) {

    }

    onClickFilterEmployees(ev) {

    }
}
