import template from '../templates/page_home.dot';
import '../styles/page_home.scss';

const defaults = {
    pageName: 'home'
};

export default class Home extends Class.View.Page.Base {
    constructor(options = {}) {
        options = _.defaults(options, defaults);
        super(options);

        this.ui = {
            'prefix': '[data-js~=prefix]',
            'titleInput': '[data-js~=title]',
            'companyInput': '[data-js~=company]',
            'start': '[data-js~=start]'
        };
        this.events = {
            'click @start': 'onClickStart'
        };
        this.template = template;
        this.bindUI();
    }

    onRender() {
        let inputs = [
            {key: 'titleInput', placeholder: 'title (e.g. sales manager, student)'},
            {key: 'companyInput', placeholder: 'company / school'}];
        _.each(inputs, (input) => {
            this.extendInput(input);
        });
    }

    extendInput(input = {}) {
        atlas.newClass('View.Input.Text', {
            $append: this.ui[`$${input.key}`],
            placeholder: input.placeholder,
            lighten: true,
            white: true
        })
            .done((extendedInput) => {
                this[input.key] = extendedInput.render();
            });
    }

    onClickStart() {
        let title = this.titleInput.model.get('input'),
            company = this.companyInput.model.get('input'),
            primaryOrg = {};
        if (!title || !company) return;
        primaryOrg.title = title;
        primaryOrg.companyName = company;
        atlas.authUser.set('workHistory', [primaryOrg]);
        atlas.navigate('dashboard/candidate');
    }
}
