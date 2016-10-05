import template from './templates/autocomplete.dot';
import './styles/autocomplete.scss';

const defaults = {
    posAutoCorrect: false,
    hideNoResults: false, // Hide the autocomplete tip if there are "No Results"
    allowFreeform: true, // Allow submit custom typed text that does not match any autocompleted values
    allowEmpty: false, // Allow users to submit without any values
    clearOnSubmit: false, // Entered text is cleared from model and input element on submit
    stickyAutocomplete: false // Force autocompleted values to remain in the input only unless a new autocompleted value is selected
};

class AutocompleteTip extends Class.View.Screentip.Base {
    constructor(options = {}) {
        super(options);

        this.type = 'autocomplete';
        this.isLoaded = false;
        this.template = template;
        this.class = 'screentip-autocomplete';
        this.ui = {
            'menuOptions': '[data-js~=menu-option]'
        };
        this.events = {
            'mousedown @menuOptions': 'onSelectOption',
            'touchstart @menuOptions': 'onSelectOption'
        };
    }

    open() {
        this.options.$attached.addClass('is-menu-open');
        super.open();
    }

    close() {
        this.options.$attached.removeClass('is-menu-open');
        super.close();
    }

    onSelectOption(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        let $el = $(ev.currentTarget),
            name = $el.text().trim(),
            val = $el.data('val');

        this.options.onClick({name, val});
    }

    moveHightlight(to) {
        let $currentOption = this.ui.$menuOptions.filter('.is-selected'),
            $newOption;

        switch (to) {
            case 'up':
                if ($currentOption.length && $currentOption.index() > 0) {
                    $newOption = $currentOption.prev();
                } else {
                    $newOption = this.ui.$menuOptions.last();
                }
            break;
            case 'down':
                if ($currentOption.length && $currentOption.index() < this.ui.$menuOptions.length - 1) {
                    $newOption = $currentOption.next();
                } else {
                    $newOption = this.ui.$menuOptions.first();
                }
            break;
            default: // "to" = option name
                $newOption = this.ui.$menuOptions.filter((i, el) => {
                    return $(el).text().trim().toLowerCase() === to;
                }).first();
        }

        this.ui.$menuOptions.removeClass('is-selected');
        $newOption.addClass('is-selected');

        return $newOption.text().trim();
    }

    getSelectedVal() {
        let $highlightedOption = this.ui.$menuOptions.filter('.is-selected'),
            $selectedOption = $highlightedOption.length > 0 ? $highlightedOption : this.ui.$menuOptions.first(),
            selection = {
                name: $selectedOption.text().trim(),
                val: $selectedOption.data('val')
            };

        return $selectedOption.length > 0 ? selection : null;
    }
}

export default class Autocomplete extends Class.View.Base { // TODO: Should we support handling multiple inputs?
    constructor(options = {}) {
        let missingOptions = util.testForMissingOptions(['$attached', 'onSelect'], options);
        if (missingOptions) throw new Error(missingOptions);

        if (!options.$attached.is('input[type=text], .extended-input')) {
            throw new Error('Attempting to attach to an unsupported element.');
        }

        options = _.defaults(options, defaults);
        super(options);

        this.currentTip = null;
        this.model = new BaseModel({
            input: (options.location && options.location.name) || options.$attached.val() || options.$attached.data('val')
        });
        if (options.location) {
            this.selectedVal = this.storedVal = options.location;
            this.initGoogleAutocomplete();
        }

        this.listenTo(this.model, 'change:input', this.onChangeInput);
        this.options.$attached
            .on('input.autocomplete', _.bind(this.onInput, this))
            .on('keydown.autocomplete', _.bind(this.onKeydown, this))
            .on('blur.autocomplete', _.bind(this.onBlur, this))
            .on('focus.autocomplete', _.bind(this.onChangeInput, this))
            .on('click.autocomplete', (ev) => {
                ev.preventDefault();
                this.onChangeInput();
            });
    }

    initGoogleAutocomplete() {
        this.googleAutocomplete = new google.maps.places.AutocompleteService();
        this.googlePlaces = new google.maps.places.PlacesService(new google.maps.Map(document.createElement('div')));
    }

    load(options = {}) {
        this.currentTip = new AutocompleteTip(_.extend(options, {coordinator: this}));
        this.currentTip.render();
    }

    unload() {
        this.options.$attached.removeClass('is-autocompleted');

        if (this.currentTip && !this.currentTip.isClosing) {
            this.currentTip.close();
        }

        this.currentTip = null;
    }

    onDestroy() {
        this.unload();
        this.options.$attached.off('.autocomplete');
        this.isDestroyed = true;
    }

    submit(selection = this.selectedVal || this.storedVal) {
        if (!this.options.allowEmpty && (!selection || !selection.val || selection.val.length < 1)) return;

        let typedMatch = false;

        //// Allow for mismatched casing
        if (selection.name === selection.val && this.currentMatches) { // If name and val are equal, string was typed by the user
            for (let i = 0; i < this.currentMatches.length; i++) {
                if (this.currentMatches[i].name.toLowerCase() === selection.name.toLowerCase()) { // User typed an exact match to one of the autocomplete options
                    selection.val = this.currentMatches[i].val;
                    typedMatch = true;
                    break;
                }
            }

            if (!this.options.allowFreeform && !typedMatch) return;
        }

        if (this.options.clearOnSubmit) {
            this.options.$attached.val('');
            this.model.set('input', '');
        } else {
            this.options.$attached.val(selection.name);
        }

        if (this.options.location) {
            this.googlePlaces.getDetails({'placeId': selection.val}, (place, status) => {
                if (status !== 'OK') throw new Error(`Geocoder failed due to: ${status}`)

                let locationComponentsMapping = {
                        locality: ['long_name', 'city'],
                        administrative_area_level_1: ['long_name', 'state'],
                        country: ['long_name', 'country']
                    },
                    addressType,
                    googleVal,
                    ourName;

                if (!place.address_components) return;

                let location = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };

                for (let i = 0; i < place.address_components.length; i++) {
                    addressType = place.address_components[i].types[0];

                    if (locationComponentsMapping[addressType]) {
                        googleVal = locationComponentsMapping[addressType][0];
                        ourName = locationComponentsMapping[addressType][1];
                        location[ourName] = place.address_components[i][googleVal];
                    }
                }

                this.options.onSelect(selection, location);
            });
        } else {
            this.options.onSelect(selection);
        }

        if (this.currentTip) {
            this.currentTip.close();
        }
    }

    onInput(ev) { // Funnel changes from input element OR extended element into our model
        this.model.set('input', this.options.$attached.val() || this.options.$attached.data('val'));
    }

    onChangeInput() {
        let input = this.model.get('input');

        if (this.selectedVal) {
            this.storedVal = this.selectedVal;
            this.selectedVal = null;
        }

        if (!input) {
            this.unload();
        } else {
            if (this.options.location) {
                this.googleAutocomplete.getPlacePredictions({
                    input: input,
                    types: ['(cities)'],
                    componentRestrictions: {country: 'us'}
                }, (response, status) => {
                    let matches = [];

                    if (util.isDefined(response)) {
                        for (let result of response) {
                            matches.push({
                                name: result.description,
                                val: result.place_id
                            });
                        }

                        this.handleMatches({matches}, input);
                    } else {
                        this.unload();
                    }
                });
            } else {
                let encodedInput = encodeURIComponent(input.toLowerCase()),
                    url = this.options.api + '?q=' + encodedInput;

                if (this.options.getExcludes) {
                    url += `&ex=${this.options.getExcludes().join(',')}`;
                }

                $.get(url)
                    .done((data) => {
                        this.handleMatches(util.convertKeyNames(data), input);
                    });
            }
        }
    }

    handleMatches(response, input) {
        let newHighlight;

        this.currentMatches = response.matches;

        if (this.options.hideNoResults && response.matches.length < 1) {
            this.unload();
        } else {
            if (this.currentTip) {
                this.currentTip.$el
                    .empty().unbind()
                    .append(this.currentTip.template({items: response.matches}));
                this.currentTip.bindUI();
            } else if (!this.isDestroyed) {
                this.load(_.extend({}, this.options, {
                    items: response.matches,
                    onClick: (selected) => {
                        this.selectedVal = this.storedVal = selected;
                        this.options.$attached
                            .val(selected.name)
                            .trigger('input').blur();
                        this.submit();
                    }
                }));
            }

            // Automatically highlight if there is an exact match
            if (this.currentTip && !this.isDestroyed) {
                newHighlight = this.currentTip.moveHightlight(input.toLowerCase());
                if (newHighlight) {
                    this.options.$attached
                        .addClass('is-autocompleted')
                        .val(newHighlight);
                    this.selectedVal = this.currentTip.getSelectedVal();
                }
            }
        }
    }

    onKeydown(ev) {
        let key = ev.which,
            setSelected = (selected) => {
                this.selectedVal = this.storedVal = selected;
                this.options.$attached
                    .val(selected.name)
                    .trigger('input').blur();
            };

        if (key === 27) { // Escape key
            if (this.options.stickyAutocomplete) {
                setSelected(this.storedVal);
            } else {
                setSelected({name: '', val: ''});
            }
        } else if (this.currentTip) {
            switch (key) {
                case 13: // Enter key
                    let options;

                    if (!this.selectedVal) {
                        if (!this.options.allowFreeform) {
                            setSelected(this.currentTip.getSelectedVal());
                        } else {
                            setSelected({
                                name: this.options.$attached.val(),
                                val: this.options.$attached.val()
                            });
                        }
                    }

                    this.submit();
                break;
                case 38: // Up arrow
                case 40: // Down arrow
                    ev.preventDefault();
                    this.options.$attached
                        .addClass('is-autocompleted')
                        .val(this.currentTip.moveHightlight(key === 38 ? 'up' : 'down'));
                break;
                case 9: // Tab key
                    ev.preventDefault();
                    setSelected(this.currentTip.getSelectedVal());
                break;
                default:
                    this.options.$attached.removeClass('is-autocompleted');
            }
        } else {
            switch (key) {
                case 13: // Enter key
                    if (this.options.allowFreeform) {
                        setSelected({
                            name: this.options.$attached.val(),
                            val: this.options.$attached.val()
                        });

                    } else if (this.options.stickyAutocomplete) {
                        setSelected(this.storedVal);
                    }

                    this.submit();
                break;
            }
        }
    }

    onBlur() {
        if (this.stickyAutocomplete && !this.selectedVal) {
            this.selectedVal = this.selectedVal || this.storedVal;
            this.options.$attached
                .val(this.selectedVal && this.selectedVal.name)
                .trigger('input');
        }

        setTimeout(() => { // Need to allow any click events on the menu to be captured by the coordinator
            if (this.options.clearOnSubmit) {
                this.selectedVal = this.storedVal = undefined;
                this.options.$attached.val('');
            }

            if (this.currentTip) {
                this.unload();
            }
        }, 100);
    }
}
