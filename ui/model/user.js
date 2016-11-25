// User Model

import Model from './base.js'; // Special case since user model is defined very early during application initialization

const defaults = {
    username: '',
    email: '',
    avatarURL: '' // Provide default image?
};

export default class User extends Model {
    constructor(options ={}) {
        super(_.defaults(options, defaults));

        this.api = 'user'
    }
}
