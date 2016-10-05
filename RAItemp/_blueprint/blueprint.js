import './styles/olympus.scss';
import './styles/icons.scss'; // Need to import from a single location here because url paths to the font files are tricky with webpack
import './src/polyfills.js';

// Define ClassTree

import Utilities from './src/utilities.js';
import API from './src/api.js';

import Model from './src/model.js';
import User from '../model/user.js';
import AuthUser from '../model/authuser.js';

import View from './src/view.js';
import Page from './src/page.js';
import Collection from './src/collection.js';

window.util = new Utilities;
window.API = new API;
window.Class = {
    View: {
        Base: View,
        Page: {
            Base: Page
        },
        Components: {},
        Screentip: {
            Coordinator: '_component_screentips_core',
            Base: '_component_screentips_core',
            Simple: '_component_screentips_t1',
            Contextmenu: '_component_screentips_t1',
            Formflag: '_component_screentips_t2',
            Autocomplete: '_component_screentips_t2'
        },
        Modal: {
            Coordinator: '_component_modals_core',
            Base: '_component_modals_core',
            Prompt: '_component_modals_t1',
            Contact: '_component_modals_t1'
        },
        Messenger: {
            Coordinator: '_component_messenger_core',
            Base: '_component_messenger_core',
            Simple: '_component_messenger_t1'
        },
        Input: {
            Text: '_component_input_t1',
            Slider: '_component_input_t1',
            Select: '_component_input_t2',
            Check: '_component_input_t2',
            Radio: '_component_input_t2'
            //Scrollable: '' TODO: Not an input, so classify it better when we port it over
        }
    },
    Model: {
        Base: Model,
        User: User,
        AuthUser: AuthUser,
        Company: '_models_core',
        Offer: '_models_secondary'
    },
    Collection: {
        Base: Collection
    }
};
