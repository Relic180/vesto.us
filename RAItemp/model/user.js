// User Model

import Model from '../_blueprint/src/model.js'; // Special case since user model is defined very early during application initialization

const defaults = {
    username: '',
    firstName: '',
    lastName: '',
    title: '',
    avatarURL: '', // Use default image here
    email: '',
    workHistory: [],
    education: [],
    skills: []
};

export default class User extends Model {
    constructor(options ={}) {
        super(_.defaults(options, defaults));

        this.type = 'User';
    }

    getFullName() {
        return `${this.get('firstName')} ${this.get('lastName')}`;
    }
}
