// Company Model

const defaults = {

};

export default class Company extends Class.Model.Base {
    constructor(options ={}) {
        super(_.defaults(options, defaults));

        this.type = 'Company';
    }
}
