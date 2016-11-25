import View from '../base.js'; // Class is not yet assigned to window object

export default class Page extends View {
    constructor(options = {}) {
        super(options);
        util.bindDispatcher(this);
    }

    // TODO: Extend page base with additional methods?
}
