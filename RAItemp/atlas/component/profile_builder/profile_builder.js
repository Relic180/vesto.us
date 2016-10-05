import template from './templates/profile_builder.dot';
import './styles/profile_builder.scss';

import basic from './templates/question_basic.dot';
import tagpicker from './templates/question_tagpicker.dot';
import Mousetrap from '../../../_blueprint/libs/mousetrap.js';

export default class ProfileBuilder extends Class.View.Base {
    constructor(options = {}) {
        super(options);

        this.template = template;
        this.ui = {
            'question': '[data-js~=question]',
            'userInput': '[data-js~=user-input]',
            'action': '[data-js~=action]',
            'skip': '[data-js~=skip]',
            'cta': '[data-js~=cta]',
            'progress': '[data-js~=progress]',
            'addSkill': '[data-js~=add]',
            'selectedSkills': '[data-js~=selected]',
            'qInput': '[data-js~=q-input]'
        };
        this.events = {
            'click @action': 'onClickAction',
            'click @skip': 'onClickSkip',
            'click @progress': 'onClickProgress',
            'input @userInput': 'onUserInput',
            'click @addSkill': 'onClickAddSkill',
            'click @selectedSkills': 'onClickRemoveSkill'
        };

        this.bindUI();
        this.templateMap = {basic, tagpicker};
    }

    isQuestionAnswered(question) {
        let prop = question.prop,
            split = prop.split('.'),
            val = atlas.authUser.get(split[0]),
            arrayIdx = split[1] || 0;

        if (!val) return false;

        if ($.isEmptyObject(val)) return false;

        if (!Array.isArray(val)) return true;

        return val.length > arrayIdx;
    }

    onRender() {
        let firstUnansweredQuestionIdx = _.findIndex(this.questions, (question) => {
            return question == this.questions[this.questions.length - 1] || !this.isQuestionAnswered(question);
        });

        if (-1 != firstUnansweredQuestionIdx) {
            return this.loadQuestion(firstUnansweredQuestionIdx);
        }
    }

    onClickAddSkill(ev) {
        ev.preventDefault();
        let skill = this.inputViews[0].model.get('input');
        if (!skill) return;
        this.inputViews[0].setInput('');
        this.ui.$selectedSkills.append(`<span class="tagpicker-skill-bubble">${skill}<i class="icon icon-x"></i></span>`);
    }

    onClickRemoveSkill(ev) {
        ev.preventDefault();
        if (!$(ev.originalEvent.target).hasClass('icon-x')) return;
        $(ev.originalEvent.target).parent().remove();
    }

    onClickProgress(ev) {
        ev.preventDefault();
        let target = $(ev.originalEvent.target),
            index = target.data('index'),
            isCurrent = target.hasClass('is-current');
        if (isCurrent || !target.hasClass('icon-circle-o')) return;
        this.loadQuestion(index);
    }

    loadQuestion(idx) {
        this.currentQuestion = idx;
        this.ui.$progress.children()
            .removeClass('is-current')
            .eq(idx).addClass('is-current');
        this.ui.$userInput.empty();

        if (this.currentQuestion == this.questions.length - 1) {
            this.ui.$question.html(this.questions[idx].title);
            this.ui.$action.text(`I'm ready!`);
            this.ui.$skip.addClass('is-hidden');
            this.ui.$cta.addClass('is-hidden');
        } else {
            this.ui.$userInput.append(this.templateMap[this.questions[idx].template](this.questions[idx]));
            this.ui.$question.text(this.questions[idx].title);
            this.ui.$action.text('Next');
            this.ui.$skip.removeClass('is-hidden');
            this.ui.$cta.removeClass('is-hidden');
        }
        this.bindUI();
        this.extendInputs();
    }

    extendInputs() {
        this.inputViews = [];
        Mousetrap.unbind('enter');

        _.each(this.questions[this.currentQuestion].inputs, (input, idx) => {
            atlas.newClass('View.Input.Text', {
                $append: this.ui.$qInput.eq(idx),
                placeholder: input.label,
                mousetrap: this.questions[this.currentQuestion].template === 'tagpicker'
            })
                .done((extendedInput) => {
                    this.inputViews.push(extendedInput.render());
                    if (extendedInput.options.mousetrap) {
                        Mousetrap.bind('enter', _.bind(this.onClickAddSkill, this));
                    }
                });
        });
    }

    onClickAction(ev) {
        ev.preventDefault();

        if (this.currentQuestion == this.questions.length - 1) {
            if (this.onComplete) {
                this.onComplete();
            }

            return;
        }

        let inputs = [],
            curQuestion = this.questions[this.currentQuestion],
            tagpicker = curQuestion.template === 'tagpicker';
        if (tagpicker) {
            _.each(this.ui.$selectedSkills.find('span'), (skill) => {
                inputs.push($(skill).text());
            });
        } else {
            _.each(this.inputViews, (input, idx) => {
                let value = input.model.get('input')
                if (!!value) {
                    inputs.push({key: curQuestion.inputs[idx].key, value});
                }
            });
        }
        if (inputs.length === curQuestion.inputs.length || (tagpicker && inputs.length > 0)) {
            this.submitAnswer(curQuestion, inputs);
            this.loadQuestion(this.currentQuestion + 1);
        }
    }

    onClickSkip(ev) {
        this.loadQuestion(this.currentQuestion + 1);
    }

    submitAnswer(question, inputs = []) {
        let split = question.prop.split('.'),
            modelProp = atlas.authUser.get(split[0]),
            arrayIdx = split.length > 1 ? split[1] : 0,
            valsAreObj = !!inputs[0].key;

        if (!valsAreObj) { // Array of strings
            atlas.authUser.set(split[0], inputs);
        } else {
            let answer = {}
            _.each(inputs, (input) => {
                answer[input.key] = input.value;
            });

            if (Array.isArray(modelProp)) {
                modelProp[arrayIdx] = answer;
                atlas.authUser.set(split[0], modelProp);
            } else {
                atlas.authUser.set(split[0], answer);
            }
        }

        atlas.authUser.save();
    }
}
