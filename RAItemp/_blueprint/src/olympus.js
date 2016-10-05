// Special case since Olympus classes are defined very early during application initialization
import View from './view.js';

export class OlympusView extends View {
    constructor(options) {
        super(options);

        this.app = options.app;
        this.ui = {

        };
        this.events = {
            'click': 'onClickGlobal',
            'mousedown': (ev) => this.trigger('global:mousedown', ev),
            'mouseup': (ev) => this.trigger('global:mouseup', ev),
            'keypress': (ev) => this.trigger('global:keypress', ev),
            'keyup': 'onKeyupGlobal',
            'mouseenter [data-helper-tip]': 'onMouseEnterHelperTip',
            'click [data-navigate]': 'onClickNavigate'
        };
    }

    render() {
        super.render();

        this.bindUI();
        this.setBodyClasses();

        // Attach listeners to throttling common spammy events
        this.triggerWindowResize = _.throttle(() => {
            this.handleResize();
            this.trigger('window:resize', util.getWindowSize())
        }, 20);
        this.triggerContentScroll = _.throttle(() => {
            let scrollTop = this.ui.$pageContainer[0].scrollTop;
            this.trigger('content:scroll', scrollTop);
        }, 20);
        $(window).on('resize', this.triggerWindowResize);
        this.ui.$pageContainer.on('scroll', this.triggerContentScroll);

        $.when(this.app.$applicationReady).done(() => {
            this.triggerWindowResize();
            this.triggerContentScroll();
        });
    }

    handleResize(options = {}) {
        this.appSize = this.app.authUser.setClient();

        $('body')
            .attr('data-appsize', this.appSize.size)
            .attr('data-orientation', this.appSize.orientation);
    }

    setBodyClasses() {
        let $widthTest = $('<div />'),
            $body = $('body'),
            userClient = this.app.authUser.getClient();

        if (util.isDefined(userClient)) {
            if (userClient.browser) {
                $body.addClass(`browser-${userClient.browser.toLowerCase()}`)
            } else if (DEBUGGING) {
                console.log('Unable to Detect Browser: ', userClient);
            }

            if (userClient.os) {
                $body.addClass(`os-${userClient.os.toLowerCase()}`);
            } else if (DEBUGGING) {
                console.log('Unable to Detect User OS: ', userClient);
            }

            if (userClient.platform) {
                $body.addClass(`platform-${userClient.platform.toLowerCase()}`);
            }
        }

        $.when(this.app.$applicationReady).done(() => {
            $widthTest.appendTo(this.ui.$pageContainer);

            if ($widthTest.width() < this.ui.$pageContainer.outerWidth()) {
                $body.addClass('has-scrollbar');
            }

            $widthTest.remove();
        });
    }

    onClickGlobal(ev) {
        if (ev.isDefaultPrevented()) return;
        this.trigger('global:click', ev);
    }

    onKeyupGlobal(ev) {
        this.trigger('global:keyup', ev);
    }

    onMouseEnterHelperTip(ev) {
        if (!this.app.screentip) return;

        let $el = $(ev.currentTarget),
            $parent = $el.parents().filter((i, el) => { // Dynamically determine if el is inside of a fixed parent
                return $(el).css('position') === 'fixed';
            }),
            options = {
                $attached: $el,
                str: $el.data('helper-tip'),
                delay: 0 // TODO: Should include a short delay for helper tips without breaking them, to determine intent
            };

        if ($parent.length > 0) {
            options.$parent = $parent;
        }

        this.app.screentip.new('simple', options);
    }

    onClickNavigate(ev) {
        this.app.navigate($(ev.currentTarget).data('navigate'));
    }
}

export class Olympus {
    constructor(options = {}) {
        util.bindDispatcher(this);

        let handleEarlyCoordinatorRequests = (key, request) => {
                if (!this.requestQueue[key]) {
                    this.requestQueue[key] = [];
                }

                if (request) {
                    this.requestQueue[key].push(request);
                    return request.$dfd.promise();
                } else {
                    return this.requestQueue[key];
                }
            },
            resolveEarlyCoordinatorRequests = (key, coordinator) => {
                let requests = handleEarlyCoordinatorRequests(key);

                if (requests.length > 0) {
                    for (let i = 0; i < requests.length; i++) {
                        coordinator.new(requests[i]).done((instance) => {
                            requests[i].$dfd.resolve(instance);
                        });
                    }
                }
            };

        this.$applicationReady = $.Deferred();
        this.currentPage = null;
        this.childModels = [];
        this.requestQueue = {};

        // Setting temporary request-catchers before our coordinators are loaded up
        this.modal = {};
        this.screentip = {};
        this.messenger = {};

        // These methods fetch their respective coordinators and overwrite themselves with it
        this.modal.new = (type, options = {}) => {
            return handleEarlyCoordinatorRequests('modal', {type, options, $dfd: $.Deferred});
        };
        this.screentip.new = (type, options = {}) => {
            return handleEarlyCoordinatorRequests('screentip', {type, options, $dfd: $.Deferred});
        };
        this.messenger.new = (type, options = {}) => {
            return handleEarlyCoordinatorRequests('messenger', {type, options, $dfd: $.Deferred});
        };

        $.when(this.$applicationReady).done(() => {
            this.newClass('View.Modal.Coordinator', {app: this})
                .done((CoordinatorClass) => {
                    this.modal = CoordinatorClass;
                    resolveEarlyCoordinatorRequests('modal', this.modal);
                });
            this.newClass('View.Screentip.Coordinator', {app: this})
                .done((CoordinatorClass) => {
                    this.screentip = CoordinatorClass;
                    resolveEarlyCoordinatorRequests('screentip', this.screentip);
                });
            this.newClass('View.Messenger.Coordinator', {app: this})
                .done((CoordinatorClass) => {
                    this.messenger = CoordinatorClass;
                    resolveEarlyCoordinatorRequests('messenger', this.messenger);
                });
        });
    }

    newClass(branchDef, options = {}, parent) {
        if (typeof branchDef !== 'string' || branchDef.length < 1) throw new Error('A branch definition is required when fetching a new class.');

        let branchDefArray = branchDef.split('.'),
            branch = branchDefArray.reduce((obj, index) => obj[index], Class),
            $dfd = $.Deferred(),
            requestParams = {branchDefArray, options, parent, $dfd},
            resolveRequest = (params, branch) => { // We have class so initialize it, push it to tracking array and resolve it
                branch = branch || params.branchDefArray.reduce((obj, index) => obj[index], Class);

                let newClassInstance = new branch(params.options);

                if (params.parent) {
                    let childArr = newClassInstance instanceof Class.View.Base ? params.parent.childViews : params.parent.childModels;
                    childArr.push(newClassInstance)
                }

                return params.$dfd.resolve(newClassInstance);
            };

        if (!branch) throw new Error(`Invalid branch definition - ${branchDef}`);

        if (typeof branch === 'string') { // Class not loaded yet, so we need to fetch it
            if (this.requestQueue[branch]) { // Already fetching, store additional request and return out
                this.requestQueue[branch].push(requestParams);
                return $dfd.promise();
            } else { // Not yet fetching, create queue, store the request and continue onto fetching it
                this.requestQueue[branch] = [requestParams];
            }
        } else {  // Found class, immediatly init and resolve
            return resolveRequest(requestParams, branch);
        }

        $.ajax(`/static/${branch}.js`, { // Fetch missing bundle (The bundles append their own classes to the Class tree)
            type: 'script'
        })
            .done(() => {
                let queue = this.requestQueue[branch];

                for (let i = 0; i < queue.length; i++) { // Resubmit all requests now that the classes have been stored
                    resolveRequest(queue[i]);
                }

                delete this.requestQueue[branch];
            })
            .fail(() => {
                // Handle bundle fetching failure
            });

        return $dfd.promise();
    }

    loadPage(pageName, options = {}) {
        this.newClass(`View.Page.${pageName}`, _.extend(options, {
            el: this.appView.ui.$pageContainer
        }))
            .done((pageView) => {
                // TODO: This setTimeout forces our next pageview load in a seperate thread, which fixes gross
                // rendering problems when the next page has massive images to load. But, it's kinda weird and
                // we should probably implement some lazy loading of these MONSTROUS bg images instead.
                // (or just get them out of the spec) <- +100
                setTimeout(() => {
                    if (this.currentPage) {
                        this.currentPage.destroyView({preserveParentEl: true});
                    }

                    this.currentPage = pageView;
                    this.currentPage.render();
                }, 5);
            });
    }

    navigate(path) {
        if (this.router) {
            this.router.navigate(path, {trigger: true});
        }
    }
}
