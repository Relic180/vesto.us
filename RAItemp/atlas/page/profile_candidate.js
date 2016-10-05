import template from '../templates/page_profile_candidate.dot';
import '../styles/page_profile_candidate.scss';

export default class ProfileCandidate extends Class.View.Page.Base {
    constructor(options = {}) {
        super(options);

        this.template = template;
        this.ui = {
            'roadmap': '[data-js~=roadmap]'
        };
        this.events = {
        };

        this.bindUI();
    }

    onRender() {
        atlas.newClass('View.Component.Roadmap', {
            el: this.ui.$roadmap,
            actionCallback: _.bind(this.onClickNext, this),
            actionDisabled: false,
            steps: [
                {label: 'Select companies'},
                {
                    label: 'Build profile',
                    current: true
                },
                {label: 'Companies apply to you'}
            ]
        }, this)
            .done((newRoadmap) => {
                this.roadmap = newRoadmap;
                this.roadmap.render();
            });
    }

    onClickNext() {

    }
}
