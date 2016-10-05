import 'jquery-color';

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
    }
});

export default class Utilities {
    constructor() {
        this.showFormErrors = _.throttle((errors, options) => {
            let app = window.atlas || window.prometheus; // TODO: Is there a better way to do this?

            if (app) {
                app.Screentips.closeAll({type: 'formFlag'});
            } else {
                throw new Error(`Couldn't find our application object!`);
            }

            errors.forEach((error) => {
                if (error.$attached && error.msg)  {
                    app.Screentips.load('formFlag', _.extend({}, {
                        $attached: error.$attached,
                        $listenEl: error.$listenEl, // Optional, otherwise $attached is used
                        $errorEl: error.$errorEl, // Optional, otherwise $attached is used
                        str: error.msg,
                        posDir: 'bottom',
                        posSpill: 'center',
                        maxWidth: error.$attached.outerWidth(),
                        multiScreentips: true
                    }, options, error.options));
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

            if ($this.attr('required') && (!val || val.length < 1)) {
                errors.push({
                    $attached: $this,
                    msg: `${name} is required`
                });
                return;
            }

            if ($this.attr('min-length') && val && val.length < $this.attr('min-length')) {
                errors.push({
                    $attached: $this,
                    msg: `${name} is too short`
                });
                return;
            }

            if ($this.attr('type') === 'email' && !this.testEmail(val)) {
                errors.push({
                    $attached: $this,
                    msg: val.length ? `Does not appear to be a valid email.` : `Looks like you forgot to enter an email address.`
                });
                return;
            }

            if ($this.attr('type') === 'checkbox' && !$this.is(':checked')) {
                errors.push({
                    $attached: $this,
                    msg: 'You must check this box to proceed.'
                });
                return;
            }
        });

        $form.find('.radio-group').each((i, el) => {
            var $this = $(el);

            if ($this.attr('required') && !$this.find('input:checked').length) {
                errors.push({
                    $attached: $this.find('.group-label'),
                    $listenEl: $this.find('input'),
                    msg: 'Please select 1 option'
                });
            }
        });

        $form.find('.select-box').each((i, el) => {
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

    generateRangeArray(startnum, endnum) { // Returns an array that contains each individual number between the start and end nums
        if (typeof startnum !== 'number' || typeof endnum !== 'number') return;

        let length = (endnum + 1) - startnum,
            arr = [];

        for (let i = startnum; i <= length; i++) {
            arr.push(parseInt(i));
        }

        return arr;
    }

    ////// COLOR TOOLS ///////

    getColorBlendAtPosition(color1, color2, atPosition = 50, type = 'hex') {
        if (!color1 || !color2) throw new Error('Missing a required parameter.');

        let $color1 = $.Color(color1),
            $color2 = $.Color(color2),
            $colorMixed = $color1.transition($color2, atPosition / 100);

        switch (type) {
            case 'hex':
                return $colorMixed.toHexString();
            case 'rgba':
                return $colorMixed.toRgbaString();
            case 'hsla':
                return $colorMixed.toHslaString();
        }
    }

    mixMultiColors(colors = []) { // https://github.com/AndreasSoiron/Color_mixer
        if (!(colors instanceof Array)) throw new Error('This method requires an array of color values.');

        let C = 0,
            M = 0,
            Y = 0,
            K = 0,
            A = 0,
            count = colors.length;

        for (let i = 0; i < count; i++) {
            if (this.isRGB(colors[i])) colors[i] = this.RGB2RGBa(colors[i]);
            if (!this.isRGBa(colors[i])) throw new Error('Trying to combine an invalid or unsupported color value.');

            colors[i] = this.RGBa2CMYK(colors[i]);

            C += colors[i].c;
            M += colors[i].m;
            Y += colors[i].y;
            K += colors[i].k;
            A += colors[i].a;
        }

        C = C / count;
        M = M / count;
        Y = Y / count;
        K = K / count;
        A = A / count;

        color = {c:C, m:M, y:Y, k:K, a:A};
        color = this.CMYK2RGBa(color);

        return color;
    }

    isHex(hex) { // https://regex101.com/r/yF0uY1/3
        return /^#(?:[A-Fa-f0-9]{3}){1,2}$/.test(hex);
    }

    isRGB(rgb) { // https://regex101.com/r/yF0uY1/4
        return /^rgb[(](?:\s*0*(?:\d\d?(?:\.\d+)?(?:\s*%)?|\.\d+\s*%|100(?:\.0*)?\s*%|(?:1\d\d|2[0-4]\d|25[0-5])(?:\.\d+)?)\s*(?:,(?![)])|(?=[)]))){3}[)]$/.test(rgb);
    }

    isRGBa(rgba) { // https://regex101.com/r/yF0uY1/5
        return /^rgba[(](?:\s*0*(?:\d\d?(?:\.\d+)?(?:\s*%)?|\.\d+\s*%|100(?:\.0*)?\s*%|(?:1\d\d|2[0-4]\d|25[0-5])(?:\.\d+)?)\s*,){3}\s*0*(?:\.\d+|1(?:\.0*)?)\s*[)]$/.test(rgba);
    }

    RGB2hex(rgb) {
        if (this.isHex(rgb)) {
            return rgb;
        } else if (!this.isRGB(rgb)) {
            throw new Error('Trying to convert an invalid or unsupported color value.');
        }

        let hex = (x) => {
            return ('0' + parseInt(x).toString(16)).slice(-2);
        }

        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

        return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
    }

    RGB2RGBa(rgb) { // TODO: Extend this method to take an alpha value and integrate transparency while maintaning the color
        if (!this.isRGB(rgb)) throw new Error('Trying to convert an invalid or unsupported color value.')

        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

        return `rgb(${r3},${g3},${b3}, 1)`;
    }

    RGBa2Hex(rgba) {
        if (this.isHex(rgba)) {
            return rgba;
        } else if (this.isRGB(rgba)) {
            return this.RGB2hex(rgba);
        } else if (!this.isRGB(rgba)) {
            throw new Error('Trying to convert an invalid or unsupported color value.');
        } else {
            return this.RGB2hex(this.RGBa2RGB(rgba));
        }
    }

    RGBa2RGB(rgba, base = {r: 255, g: 255, b: 255}) { // http://stackoverflow.com/questions/21576092/convert-rgba-to-hex
        if (!this.isRGBa(rgba)) throw new Error('Trying to convert an invalid or unsupported color value.');

        let alpha = rgba.a;

        return new Color(
            (1 - alpha) * base.r + alpha * rgba.r,
            (1 - alpha) * base.g + alpha * rgba.g,
            (1 - alpha) * base.b + alpha * rgba.b
        );
    }

    RGBa2CMYK(color) { // https://github.com/AndreasSoiron/Color_mixer
        cyan    = 255 - color._rgba[0];
        magenta = 255 - color._rgba[1];
        yellow  = 255 - color._rgba[2];
        black   = Math.min(cyan, magenta, yellow);
        cyan    = ((cyan - black) / (255 - black));
        magenta = ((magenta - black) / (255 - black));
        yellow  = ((yellow  - black) / (255 - black));

        return {c:cyan, m:magenta, y:yellow, k:black / 255, a:color._rgba[3]};
    }

    CMYK2RGBa(color) { // https://github.com/AndreasSoiron/Color_mixer
        color.c = color.c;
        color.m = color.m;
        color.y = color.y;
        color.k = color.k;

        R = color.c * (1.0 - color.k) + color.k;
        G = color.m * (1.0 - color.k) + color.k;
        B = color.y * (1.0 - color.k) + color.k;
        R = Math.round((1.0 - R) * 255.0 + 0.5);
        G = Math.round((1.0 - G) * 255.0 + 0.5);
        B = Math.round((1.0 - B) * 255.0 + 0.5);
        color = $.Color(R,G,B,color.a);

        return color;
    }
}
