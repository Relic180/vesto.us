import 'jquery-color';

export default class Utilities {
    constructor() {
        this.showFormErrors = _.throttle((errors, options, parent) => {
            let app = window.atlas || window.prometheus; // TODO: Is there a better way to do this?

            if (app) {
                app.screentip.closeAll({type: 'formFlag'});
            } else {
                throw new Error(`Couldn't find our application object!`);
            }

            errors.forEach((error) => {
                if (error.$attached && error.msg)  {
                    app.screentip.new('formFlag', _.extend({
                        $attached: error.$attached,
                        $listenEl: error.$listenEl, // Optional, otherwise $attached is used
                        $errorEl: error.$errorEl, // Optional, otherwise $attached is used
                        str: error.msg,
                        posDir: 'bottom',
                        posSpill: 'center',
                        maxWidth: error.$attached.outerWidth(),
                        multiScreentips: true
                    }, options, error.options), parent);
                }
            });
        }, 500, {trailing: false});
    }

    bindDispatcher(obj) {
        let dispatcher = _.extend({}, Backbone.Events);

        obj.on = dispatcher.on;
        obj.off = dispatcher.off;
        obj.once = dispatcher.once;
        obj.trigger = dispatcher.trigger;
        obj.listenTo = dispatcher.listenTo;
        obj.listenToOnce = dispatcher.listenToOnce;
        obj.stopListening = dispatcher.stopListening;
    }

    parseURL(options = {}) { // http://blog.stevenlevithan.com/archives/parseuri
        let url = options.url || window.location,
            parsed;

        function parseUri (str) {
            let o   = parseUri.options,
                m   = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str),
                uri = {},
                i   = 14;

            while (i--) uri[o.key[i]] = m[i] || '';

            uri[o.q.name] = {};
            uri[o.key[12]].replace(o.q.parser, ($0, $1, $2) => {
                if ($1) uri[o.q.name][$1] = $2;
            });

            return uri;
        };

        parseUri.options = {
            strictMode: false,
            key: ['source','protocol','authority','userInfo','user','password','host','port','relative','path','directory','file','query','hash'],
            q:   {
                name:   'queryKey',
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?&?([^#]*))?(?:#(.*))?)/
            }
        };

        parsed = parseUri(url);

        if (options.queryParam) {
            return parsed.queryKey[options.queryParam];
        }

        return parsed;
    }

    testURL(url) {
        if (!url || typeof url !== 'string' || url.length < 1) return false;

        let urlValidator = new RegExp( // https://gist.github.com/dperini/729294
            '^' +
                // protocol identifier
                '(?:(?:https?|ftp)://)' +
                // user:pass authentication
                '(?:\\S+(?::\\S*)?@)?' +
                '(?:' +
                    // IP address exclusion
                    // private & local networks
                    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
                    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
                    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
                    // IP address dotted notation octets
                    // excludes loopback network 0.0.0.0
                    // excludes reserved space >= 224.0.0.0
                    // excludes network & broacast addresses
                    // (first & last IP address of each class)
                    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
                    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
                    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
                '|' +
                    // host name
                    '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
                    // domain name
                    '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
                    // TLD identifier
                    '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
                    // TLD may end with dot
                    '\\.?' +
                ')' +
                // port number
                '(?::\\d{2,5})?' +
                // resource path
                '(?:[/?#]\\S*)?' +
            '$', 'i');

        return urlValidator.test(url);
    }

    removeURLHash() {
        let loc = window.location;
        history.pushState('', document.title, loc.pathname + loc.search);
    }

    setQueryParams(params) {
        let parsedUrl = this.parseURL(),
            queryParams = parsedUrl.queryKey,
            newParamStr = '?',
            newUrl;

        for (let key in params) {
            if (this.isDefined(params[key]) && params[key] !== '') {
                queryParams[key] = params[key];
            } else {
                delete queryParams[key];
            }
        }

        for (let key in queryParams) {
            newParamStr += `&${key}=${queryParams[key]}`;
        }

        newUrl = `${window.location.protocol}//${window.location.host + window.location.pathname}${newParamStr}`;
        window.history.pushState({path: newUrl}, '', newUrl);
    }

    testEmail(email) {
        if (!email || typeof email !== 'string' || email.length < 1) return false;

        let emailValidator = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9_-]+?\.[a-zA-Z]{2,3}$/);

        return emailValidator.test(email);
    }

    testForMissingOptions(tests = [], obj) {
        if (!obj) return;

        let failures = [],
            error = 'Required option';

        for (let i = 0; i < tests.length; i++) {
            let test = tests[i];

            if (typeof test === 'string' && !obj[test]) { // Tests must be strings, else skip it
                failures.push(test);
            }
        }

        if (failures.length > 0) {
            if (failures.length > 1) {
                error += 's';
            }
            error += ' missing:';

            for (let i = 0; i < failures.length; i++) {
                error += ` ${failures[i]},`;
            }

            return error.substring(0, error.length - 1);
        }

        return false;
    }

    fetchCookie(name) { // http://www.the-art-of-web.com/javascript/getcookie/
        if (!name || name.length < 1 || typeof name !== 'string') return;

        let re = new RegExp(name + '=([^;]+)'),
            value = re.exec(document.cookie);

        return (value != null) ? unescape(value[1]) : null;
    }

    setCookie(name, val, expiryDays) {
        let expiryDate,
            expiryStr = '';

        if (expiryDays) {
            expiryDate = new Date();
            expiryDate.setTime(expiryDate.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
            expiryStr = expiryDate.toGMTString();
        }

        document.cookie = `${name}=${val}; expires=${expiryStr}; path=/`
    }

    removeCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
    }

    isDefined(val) {
        return val !== undefined && val !== null;
    }

    isDefinedElse(val, altVal) {
        return (this.isDefined(val) ? val : altVal);
    }

    isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    isFunction(func) {
        return func instanceof Function;
    }

    isDeferred($dfd) { // Test if an object is an instance of jQuery.Deferred()  --  http://stackoverflow.com/questions/13075592/how-can-i-tell-if-an-object-is-a-jquery-promise-deferred
        if (typeof $dfd !== 'object' || typeof $dfd.then !== 'function') return false;

        let promiseThenSrc = String($.Deferred().then),
            valueThenSrc = String($dfd.then);

        return promiseThenSrc === valueThenSrc;
    }

    capFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    failCode(data = {}, parsed = false) {
        let code = data.responseJSON && this.isDefined(data.responseJSON.error_code) && data.responseJSON.error_code,
            msg = (data.responseJSON && this.isDefined(data.responseJSON.error) && data.responseJSON.error) || '';

        if (parsed) {
            return {code, msg};
        } else {
            return code || msg;
        }
    }

    getWindowSize() {
        let width = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth,
            height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;

        return {width, height};
    }

    getWindowScroll() {
        return window.pageYOffset || document.documentElement.scrollTop;
    }

    getAppSize() {
        let width = this.getWindowSize().width,
            height = this.getWindowSize().height,
            size, orientation;

        if (width > height) {
            orientation = 'landscape';

            if (width <= 670) {
                size = 'mobile';
            } else if (width <= 1025) {
                size = 'tablet';
            }
        } else {
            orientation = 'portrait';

            if (width <= 530) {
                size = 'mobile';
            } else if (width <= 950) {
                size = 'tablet';
            }
        }

        if (!this.isDefined(size)) {
            if (width <= 1300) {
                size = 'desktop';
            } else  {
                size = 'desktop-wide';
            }
        }

        return {size, orientation, smallScreen: (size === 'mobile' || size === 'tablet'), width, height};
    }

    convertKeyNames(item, toCamel = true) { // Reformat key names between camelCase and under_score
        let mappedVals;

        if (!item || typeof item !== 'object') return item; // 'item' could be null or undefined and should be returned that way

        function renameKey(key) {
            if (!toCamel) {
                return key.replace(/[A-Z]/g, (match) => {
                    return '_' + match.toLowerCase();
                });
            } else {
                return key.replace(/_(.)/g, (match, group) => {
                    return group.toUpperCase();
                });
            }
        }

        function renameVal(val) {
            if (typeof val === 'object') {
                return this.convertKeyNames(val, toCamel);
            } else {
                return val;
            }
        }

        mappedVals = _.map(_.values(item), renameVal.bind(this));
        if (item instanceof Array) {
            return mappedVals;
        }

        return _.zipObject(_.map(_.keys(item), renameKey), mappedVals);
    }

    detectClient() {
        let appVersion = navigator.appVersion,
            platform = navigator.platform,
            os = 'unknown',
            client = (() => { // http://stackoverflow.com/questions/5916900/how-can-you-detect-the-version-of-a-browser
                let agent = navigator.userAgent,
                    engine = agent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [],
                    build;

                if(/trident/i.test(engine[1])){
                    build = /\brv[ :]+(\d+)/g.exec(agent) || [];
                    return {browser:'IE', version:(build[1] || '')};
                }

                if(engine[1] === 'Chrome'){
                    build = agent.match(/\bOPR\/(\d+)/);

                    if(build !== null) {
                        return {browser: 'Opera', version: build[1]};
                    }
                }

                engine = engine[2] ? [engine[1], engine[2]] : [navigator.appName, appVersion, '-?'];

                if((build = agent.match(/version\/(\d+)/i)) !== null) {
                    engine.splice(1, 1, build[1]);
                }

                return {
                  browser: engine[0],
                  version: Number(engine[1])
                };
            })();

        switch (true) {
            case appVersion.indexOf('Win') > -1:
                client.os = 'Windows';
            break;
            case appVersion.indexOf('Mac') > -1:
                client.os = 'MacOS';
            break;
            case appVersion.indexOf('X11') > -1:
                client.os = 'UNIX';
            break;
            case appVersion.indexOf('Linux') > -1:
                client.os = 'Linux';
            break;
        }

        switch (platform) { // http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
            case 'iPhone':
            case 'iPod':
            case 'iPad':
            case 'iPhone Simulator':
            case 'iPod Simulator':
            case 'iPad Simulator':
            case 'Pike v7.6 release 92':
            case 'Pike v7.8 release 517':
                client.platform = 'Apple-mobile';
            break;
            case 'Macintosh':
            case 'MacIntel':
            case 'MacPPC':
            case 'Mac68K':
                client.platform = 'Apple';
            break;
            case 'Android':
                client.platform = 'Android';
            break;
        }

        return client;
    }

    delegateChangeEvents(model, context, options) { // http://stackoverflow.com/questions/15295768/backbone-events-with-wildcards/15296232#15296232
        context.listenTo(model, 'all', (event, model) => {
            if (event.substring(0, 6) === 'change') {
                context.trigger(event, model, options);
            }
        });
    }

    googlePlaceToLocation(place) {
        let locationComponentsMapping = {
                locality: ['long_name', 'city'],
                administrative_area_level_1: ['short_name', 'stateCode'],
                country: ['short_name', 'countryCode'],
                street_address: ['long_name', 'street'],
                street_number: ['long_name', 'streetNumber'],
                route: ['long_name', 'route']
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

        if (!location.street) {
            if (location.route) {
                location.street = location.route;
                delete location.route;

                if (location.street_number) {
                    location.street = `${location.street_number} ${location.street}`;
                    delete location.street_number;
                }
            }
        }

        return location;
    }

    getRange(el) {
        let start,
            end;

        if (window.getSelection) {
            let range = window.getSelection().getRangeAt(0),
                preSelectionRange = range.cloneRange();

            preSelectionRange.selectNodeContents(el);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            start = preSelectionRange.toString().length;
            end = start + range.toString().length;
        } else if (document.selection) {
            let selectedTextRange = document.selection.createRange(),
                preSelectionTextRange = document.body.createTextRange();

            preSelectionTextRange.moveToElementText(el);
            preSelectionTextRange.setEndPoint('EndToStart', selectedTextRange);
            start = preSelectionTextRange.text.length;
            end = start + selectedTextRange.text.length;
        }

        return {start, end};
    }

    setRange(el, savedRange) {
        if (window.getSelection && document.createRange) {
            let charIndex = 0,
                range = document.createRange(),
                nodeStack = [el],
                node,
                foundStart = false,
                stop = false,
                sel;

            range.setStart(el, 0);
            range.collapse(true);

            while (!stop && (node = nodeStack.pop())) {
                if (node.nodeType == 3) {
                    let nextCharIndex = charIndex + node.length;

                    if (!foundStart && savedRange.start >= charIndex && savedRange.start <= nextCharIndex) {
                        range.setStart(node, savedRange.start - charIndex);
                        foundStart = true;
                    }

                    if (foundStart && savedRange.end >= charIndex && savedRange.end <= nextCharIndex) {
                        range.setEnd(node, savedRange.end - charIndex);
                        stop = true;
                    }

                    charIndex = nextCharIndex;
                } else {
                    let i = node.childNodes.length;

                    while (i--) {
                        nodeStack.push(node.childNodes[i]);
                    }
                }
            }

            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            let textRange = document.body.createTextRange();

            textRange.moveToElementText(el);
            textRange.collapse(true);
            textRange.moveEnd('character', savedRange.end);
            textRange.moveStart('character', savedRange.start);
            textRange.select();
        }
    }

    setCarot(el, pos) {
        this.setRange(el, pos, pos);
    }

    validateForm($form) {
        let errors = [];

        $form.find('input, textarea').each((i, el) => {
            var $this = $(el),
                val = $this.val(),
                name = $this.attr('error-name') || $this.data('label') || $this.attr('placeholder') || $this.attr('type');

            if ($this.attr('required')) {
                if ($this.attr('type') === 'checkbox' && !$this.is(':checked')) { // TODO: Extend to differentiate between required and required from a group
                    errors.push({
                        $attached: $this,
                        msg: 'You must check this box to proceed.'
                    });
                } else if ($this.attr('type') === 'email' && !this.testEmail(val)) {
                    errors.push({
                        $attached: $this,
                        msg: val.length ? `Does not appear to be a valid email.` : `Looks like you forgot to enter an email address.`
                    });
                } else if (!val || val.length < 1) {
                    errors.push({
                        $attached: $this,
                        msg: `${name} is required`
                    });
                }
            } else if ($this.attr('min-length') && (!val || val.length < $this.attr('min-length'))) {
                errors.push({
                    $attached: $this,
                    msg: `${name} is too short`
                });
            }
        });

        $form.find('.radio-group').each((i, el) => { // TODO: Will we still need this once the checkbox test above is extended?
            var $this = $(el);

            if ($this.attr('required') && !$this.find('input:checked').length) {
                errors.push({
                    $attached: $this.find('.group-label'),
                    $listenEl: $this.find('input'),
                    msg: 'Please select 1 option'
                });
            }
        });

        $form.find('.select-box').each((i, el) => { // TODO: Extended version doesn't exist yet, but update this once it does
            var $this = $(el);

            if ($this.attr('required') && $this.find('input').val() === '') {
                errors.push({
                    $attached: $this,
                    msg: 'Menu requires a selection'
                });
            }
        });

        return errors;
    }

    keyProducesText(keycode, isMultilineInput) {
        return (keycode > 47 && keycode < 58) || // number keys
                keycode === 32 || // spacebar
                (isMultilineInput && keycode === 13) || // return key
                (keycode > 64 && keycode < 91) || // letter keys
                (keycode > 95 && keycode < 112) || // numpad keys
                (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
                (keycode > 218 && keycode < 223); // [\]' (in order)
    }

    getArticle(input) {
        if (typeof input !== 'string') throw new Error('getArticle method only accepts string values');

        // TODO:  Find a library to handle this more thoroughly (returns "a" or "an", depending on the following letter/word)

        let article = 'a',
            cases = ['a', 'e', 'i', 'o', 'u', 'hour'],
            exceptions = ['euphemism'];

        for (let i = 0; i < cases.length; i++) {
            let test = input.substring(0, [cases[i].length]).toLowerCase();

            if (test === cases[i] && exceptions.indexOf(test) === -1) {
                article = 'an';
            }
        }

        return article;
    }

    elObserver(el, params, callback) { // Sets a mutationObserver on an element to listen for DOM related changes
        let observer = new window.MutationObserver((mutations, observer) => {
            callback(mutations, observer);
        });

        return observer.observe(el, params);
    }

    repaintEl(el) { // http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes
        if (!el) return;

        if (el.constructor === Array) {
            el.forEach((el) => {
                this.repaintEl(el);
            });
        } else if (el instanceof $) {
            el = el[0];
        }

        if (el.offsetHeight) {
            let isHidden = el.style.visibility === 'hidden';
            el.style.visibility = isHidden ? 'visible' : 'hidden';

            setTimeout(function () {
                el.offsetHeight;
                el.style.visibility = isHidden ? 'hidden' : 'visible';
            }, 0);
        }
    }

    getDateFromUnix(timestamp, long) {
        let date = !timestamp ? new Date() : new Date(parseInt(timestamp) * 1000),
            monthsDisplay = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            monthsDisplayLong = ['January','February','March','April','May','June','July','August','September','October','November','December'],
            monthRaw = date.getMonth(),
            month = long ? monthsDisplayLong[monthRaw] : monthsDisplay[monthRaw],
            year = date.getFullYear();

        return {month, monthRaw, year, present: !timestamp};
    }

    formatDateRange(end, start) {
        let endInMonths = end.year * 12 + end.monthRaw,
            startInMonths = start.year * 12 + start.monthRaw,
            range = endInMonths - startInMonths,
            months = range % 12,
            years = (range - months) / 12;
        return `${years > 0 ? `${years} ${years > 1 ? 'years' : 'year'}${months > 0 ? ' ':''}` : ''}${months > 0 ? `${months} ${months > 1 ? 'months' : 'month'}` : ''}`;
    }

    /*
    Utility that powers a UI timer, operates in two modes:
        mode:   Default 'S', base unit of seconds, counts up to a maximum of 59m:59s
                'M', base unit of minutes, counts up to a maximum of 23hr:59m

        time:   Time in milliseconds

        el:     Ui element with two child elements with .major & .minor classes
                in case of 'S' mode, .major corresponds to minutes element, and .minor corresponds to seconds

        timerId:ID returned by setInterval instance that was used to start timer,
                used to stop interval when maxTime reached

        initial:Contains a value only when setting the initial time (starting point)
                of the timer. Since 0 is a valid starting time, we must differentiate
                between 0 and undefined
    */
    countTime(mode = 'S', time, el, timerId, initial) {
        let minorTime = (mode === 'S') ? 1000 : 60000, //1 sec or 1 min
            doubleDigitTime = minorTime * 10, //10 sec or 10 min, when minor unit no longer needs leading 0
            majorTime = minorTime * 60, //1 min or 1 hr
            maxTime = (mode === 'S') ? 3600000 : 86400000, //60 mins or 24 hrs
            $el = (el instanceof $) ? el : $(el),
            $major = $el.find('.major'),
            $minor = $el.find('.minor');

        if (!$major.length || !$minor.length) return;
        if (initial || initial === 0) { //Recognize 0 as a valid initial setting
            let init = {
                major: (initial - (initial % majorTime)) / majorTime,
                minor: (initial % majorTime) / minorTime
            };
            $major.text(init.major);
            $minor.text(`${init.minor < 10 ? `0${init.minor}` : init.minor}`);
            return;
        }

        if (time >= maxTime) {
            clearInterval(timerId);
            return;
        };
        if (time % majorTime === 0) {
            $major.text(
                parseInt($major.text()) + 1
            );
            $minor.text('00');
        } else {
            if (time % minorTime === 0 && (time % majorTime) > doubleDigitTime) {
                $minor.text(
                    parseInt($minor.text()) + 1
                );
            } else if (time % minorTime === 0 && (time % majorTime) <= doubleDigitTime) {
                $minor.text(
                    `${(time % majorTime) !== doubleDigitTime ? '0' : ''}${parseInt($minor.text().slice(1)) + 1}`
                );
            }
        }
    }

    ////// COLOR TOOLS /////// -- https://github.com/jquery/jquery-color

    getColorBlendAtPosition(color1, color2, atPosition = 50) {
        if (!color1 || !color2) throw new Error('Missing a required parameter.');

        let $color1 = $.Color(color1),
            $color2 = $.Color(color2),
            $colorMixed = $color1.transition($color2, atPosition / 100);

        return $colorMixed.toHexString();
    }
}

//////////////////////////////////////////////////////////////////////////////
// Extend jQuery

$.fn.extend({
    swapClasses: function(cls1, cls2, condition) {
        return this.each((i, el) => {
            let $el = $(el);

            if (condition) {
                $el.addClass(cls1).removeClass(cls2);
            } else {
                $el.removeClass(cls1).addClass(cls2);
            }
        });
    },
    draggableText: function(options = {}) {
        return this.attr('draggable', true)
            .on('dragstart', (ev) => {
                $(this).css({ // Temporarly change style of the original element so that our drag clone is semi-transparent
                    opacity: .2
                });
                setTimeout(() => {
                    $(this).removeAttr('style');
                }, 0);

                if (options.onDrag) {
                    options.onDrag(ev);
                }
            })
            .on('dragend', (ev) => {
                // Chrome highlights the text after dropping, so de-select it
                if (document.selection) {
                    document.selection.empty();
                } else if (window.getSelection) {
                    window.getSelection().removeAllRanges();
                }

                if (options.onDrop) {
                    options.onDrop(ev);
                }
            })
            .on('click', (ev) => {
                if (options.onClick) {
                    options.onClick(ev);
                }
            });
    },
    insertAtCaret: function(content, inserAfterCaret= false) { // TODO: There seems to be some issues with this method, inserting 1 char to the left or right of where it should
        let sel,
            range;

        if (window.getSelection) { // IE9 and non-IE
            sel = window.getSelection();

            if (sel.getRangeAt && sel.rangeCount) {
                let el = document.createElement('div'),
                    frag = document.createDocumentFragment(),
                    node,
                    lastNode;

                el.innerHTML = content;
                range = sel.getRangeAt(0);
                range.deleteContents();

                while ( (node = el.firstChild) ) {
                    lastNode = frag.appendChild(node);
                }

                let firstNode = frag.firstChild;
                range.insertNode(frag);

                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);

                    if (inserAfterCaret) {
                        range.collapse(true);
                    } else {
                        range.setStartAfter(lastNode);
                    }

                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if ( (sel = document.selection) && sel.type !== 'Control') { // IE < 9
            let originalRange = sel.createRange();

            if (inserAfterCaret) {
                originalRange.collapse(true);
            } else {
                // TODO: Force IE9 to put cursur after newly pasted content
            }
            sel.createRange().pasteHTML(content);
        }

        return this;
    },
    selectRange: function(start, end) {
        if(end === undefined) end = start;

        return this.each(function() {
            if('selectionStart' in this) {
                this.selectionStart = start;
                this.selectionEnd = end;
            } else if(this.setSelectionRange) {
                this.setSelectionRange(start, end);
            } else if(this.createTextRange) {
                let range = this.createTextRange();

                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        });
    },
    selectText: function() {
        let el = this[0];

        if ($(el).is('input')) {
            el.setSelectionRange(0, el.value.length);
        } else if (document.body.createTextRange) {
            let range = document.body.createTextRange();

            range.moveToElementText(el);
            range.select();
        } else if (window.getSelection) {
            let selection = window.getSelection(),
                range = document.createRange();

            range.selectNodeContents(el);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        return this;
    },
    inlineStyle: function(prop) {
         let styles = this.attr('style'),
             value;

         styles && styles.split(';').forEach((e) => {
             let style = e.split(':');

             if ($.trim(style[0]) === prop) {
                 value = style[1];
             }
         });

         return value;
    },
    textWidth: function(text, font) { // http://stackoverflow.com/questions/8100770/auto-scaling-inputtype-text-to-width-of-value
        let fakeEl = $('<span>').hide().appendTo(document.body).text(text || this.val() || this.text()).css('font', font || this.css('font')),
            width = fakeEl.width();
        fakeEl.remove();
        return width;
    },
    autoResizeInput: function(options = {}) { // http://stackoverflow.com/questions/8100770/auto-scaling-inputtype-text-to-width-of-value
        options = _.extend({padding: 10, minWidth: 45, maxWidth: 300}, options);

        if (!options.vertical) {
            $(this).on('input', function() {
                let val = $(this).val(),
                    contextMinWidth;

                if (val === '' && !!options.placeholder) {
                    contextMinWidth = $(this).textWidth(options.placeholder) + options.padding;
                } else {
                    contextMinWidth = $(this).textWidth() + options.padding;
                }

                $(this).css('width', Math.min(options.maxWidth, Math.max(options.minWidth, contextMinWidth)));
            }).trigger('input');
        } else {
            $(this).on('input', function() {
                $(this).attr('rows', 1);

                let lineHeight = parseInt($(this).css('line-height')),
                    numLines = $(this)[0].scrollHeight / lineHeight;

                $(this).attr('rows', Math.max(options.rows, numLines + 1));
            }).trigger('input');
        }
        return this;
    }
});

//////////////////////////////////////////////////////////////////////////////
// Apply required polyfills

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, fromIndex) {
        if (fromIndex == null) {
            fromIndex = 0;
        } else if (fromIndex < 0) {
            fromIndex = Math.max(0, this.length + fromIndex);
        }

        for (var i = fromIndex, j = this.length; i < j; i++) {
            if (this[i] === obj) {
                return i;
            }
        }

        return -1;
    };
}

if (!Array.isArray) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

if (!Object.keys) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

if (typeof Object.assign !== 'function') { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    Object.assign = function (target) {
        'use strict';

        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }

        return output;
    };
}

window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

// Extend base functionality of the client

if (typeof window.history !== 'function') { // http://stackoverflow.com/questions/4570093/how-to-get-notified-about-changes-of-the-history-via-history-pushstate
    (function(history){
        var pushState = history.pushState;

        history.pushState = function(state) {
            if (typeof history.onpushstate == "function") {
                history.onpushstate({state: state});
            }

            return pushState.apply(history, arguments);
        }
    })(window.history);
}
