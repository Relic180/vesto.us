// Offer Model

const defaults = {

};

export default class Offer extends Class.Model.Base {
    constructor(options ={}) {
        super(_.defaults(options, defaults));

        this.type = 'Offer';
    }
}
