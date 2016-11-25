import View from './view/base'; // Special case since classes are defined very early during app initialization

import Tracker from './tracker';
import Router from './router';

import './styles/Bones';

export default class Bones { // Main application object
    constructor(options = {}) {
        let $pageInitializedDfd = $.Deferred(),
            $windowLoadDfd = $.Deferred();
        this.$applicationReady = $.Deferred();

        util.bindDispatcher(this);
        this.listenToOnce(this, 'page:new', () => {
            $pageInitializedDfd.resolve();
        });
        this.listenTo(this, 'page:new', this.onNewPage);
        $(window).on('load', () => {
            $windowLoadDfd.resolve();
        });

        this.currentPage = null;
        this.requestQueue = {};

        this.preloadClasses(['View.Modal.Coordinator', 'View.Screentip.Coordinator', 'View.Messenger.Coordinator']);
        this.setUpTempCoordinators();

        this.authUser = new Class.Model.AuthUser(util.convertKeyNames(server.authUser));
        this.appView = new BonesView({
            el: document.body,
            app: this
        });
        this.appView.render();
        this.tracker = new Tracker({app: this});
        this.router = new Router({app: this});

        if (this.clientIsUnsupported()) {
            this.navigate('browser/unsupported');
            return;
        }

        $.when($pageInitializedDfd, $windowLoadDfd).done(() => {
            this.$applicationReady.resolve();
        });
    }

    setUpTempCoordinators() { // Setting temporary request-catchers before our coordinators are loaded up
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
                        coordinator.new(requests[i].type, requests[i].options).done((instance) => {
                            requests[i].$dfd.resolve(instance);
                        });
                    }
                }
            };

        this.modal = {
            new: (type, options = {}) => {
                return handleEarlyCoordinatorRequests('modal', {type, options, $dfd: $.Deferred()});
            }
        };
        this.screentip = {
            new: (type, options = {}) => {
                return handleEarlyCoordinatorRequests('screentip', {type, options, $dfd: $.Deferred()});
            }
        };
        this.messenger = {
            new: (type, options = {}) => {
                return handleEarlyCoordinatorRequests('messenger', {type, options, $dfd: $.Deferred()});
            }
        };

        // After app is loaded, fetch respective coordinators, overwrite the requestCatchers with them and resolve queued requests
        this.newClass('View.Modal.Coordinator', {app: this}, 'no-parent')
            .done((CoordinatorClass) => {
                $.when(this.$applicationReady).done(() => {
                    this.modal = CoordinatorClass;
                    resolveEarlyCoordinatorRequests('modal', this.modal);
                });
            });
        this.newClass('View.Screentip.Coordinator', {app: this}, 'no-parent')
            .done((CoordinatorClass) => {
                $.when(this.$applicationReady).done(() => {
                    this.screentip = CoordinatorClass;
                    resolveEarlyCoordinatorRequests('screentip', this.screentip);
                });
            });
        this.newClass('View.Messenger.Coordinator', {app: this}, 'no-parent')
            .done((CoordinatorClass) => {
                $.when(this.$applicationReady).done(() => {
                    this.messenger = CoordinatorClass;
                    resolveEarlyCoordinatorRequests('messenger', this.messenger);
                });
            });
    }

    loadPage(pageName, options = {}) {
        this.newClass(`View.Page.${pageName}`, _.extend(options, {
            el: this.appView.ui.$page
        }), 'no-parent')
            .done((pageView) => {
                if (this.currentPage) {
                    this.currentPage.destroyView({preserveParentEl: true});
                }

                this.currentPage = pageView;
                this.currentPage.render();
                this.currentPage.$el.attr('class', `page-${this.currentPage.className}`);

                this.trigger('page:new', this.currentPage);
            });
    }

    onNewPage(currentPage) {
        let isFlexRow = !!{ // Set pagename as key, to toggle flex direction for that page
                Browser: true
            }[currentPage.pageName];

        this.appView.ui.$page.toggleClass('is-flex-row', isFlexRow);
    }

    clientIsUnsupported() {
        let client = util.detectClient(),
            version = client.version,
            unsupported = false;

        switch (client.browser) {
            case 'Chrome':
                if (version < 50) {
                    unsupported = true;
                }
            break;
            case 'Firefox':
                if (version < 46) {
                    unsupported = true;
                }
            break;
            case 'Safari':
                if (version < 9) {
                    unsupported = true;
                }
            break;
            default:
                unsupported = true;
        }

        if (unsupported && !server.isPRODUCTION) {
            unsupported = false;

            this.messenger.new('simple', {
                title: 'Browser Unsupported',
                msg: `${this.userClient.browser} v.${version}`,
                mode: 'error'
            });
        }

        return unsupported;
    }

    navigate(path, options) {
        if (this.router) {
            this.router.navigate(path, _.extend({trigger: true}, options));
        }
    }

    // Class Management Handlers /////////////////////////

    newClass(branchDef, options = {}, parent) {
        let $dfd = $.Deferred();

        if (!parent) throw new Error('newClass requires passing a parent view to ensure cleanup (or explicitly overriding by passing "no-parent")');

        this.fetchClass(branchDef)
            .done((branch) => {
                let newClassInstance = new branch(options);

                if (parent && parent !== 'no-parent') {
                    let childArr = newClassInstance instanceof Class.View.Base ? parent.childViews : parent.childModels;
                    childArr.push(newClassInstance)
                }

                $dfd.resolve(newClassInstance);
            });

        return $dfd.promise();
    }

    preloadClasses(branchDefs) { // Pass a single branch map or array of maps
        let $dfd = $.Deferred(),
            $dfdBranches = [];

        if (!Array.isArray(branchDefs)) {
            branchDefs = [branchDefs];
        }

        for (let def of branchDefs) {
            let $dfdBranch = $.Deferred();
            $dfdBranches.push($dfdBranch);

            this.fetchClass(def)
                .done(() => {
                    $dfdBranch.resolve();
                });
        }

        $.when(...$dfdBranches).done(() => {
            $dfd.resolve();
        });

        return $dfd.promise();
    }

    fetchClass(branchDef) {
        if (typeof branchDef !== 'string' || branchDef.length < 1) throw new Error('A branch definition is required when fetching a new class.');

        let branchDefArray = branchDef.split('.'),
            getBranch = () => { return branchDefArray.reduce((obj, index) => obj[index], Class); },
            branch = getBranch(),
            $dfd = $.Deferred(),
            obj;

        if (!branch) throw new Error(`Invalid branch definition - ${branchDef}`);

        if (typeof branch !== 'string') { // Class already loaded
            return $dfd.resolve(branch).promise();
        }

        if (this.requestQueue[branch]) { // Request in progress
            this.requestQueue[branch].done(() => {
                $dfd.resolve(getBranch());
            });
            return $dfd.promise();
        }

        this.requestQueue[branch] = $dfd;
        $.ajax(`${server.bundlePath}${branch}.js`, { // Fetch missing bundle (The bundles append their own classes to the Class tree)
            dataType: 'script'
        })
            .done(() => {
                $dfd.resolve(getBranch());
            })
            .fail(() => {
                // Handle bundle fetching failure
            });

        return $dfd.promise();
    }
}

class BonesView extends View {
    constructor(options) {
        super(options);

        this.app = options.app;
        this.ui = {
            'body': '#application-body',
            'page': '@body [data-js~=page]'
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
        this.bindUI();
        this.setBodyAttrs();

        // Attach listeners to throttling common spammy events
        this.triggerWindowResize = _.throttle(() => {
            this.handleResize();
            this.trigger('window:resize', util.getWindowSize())
        }, 20);
        this.triggerContentScroll = _.throttle(() => {
            let scrollTop = this.ui.$page[0].scrollTop;
            this.trigger('content:scroll', scrollTop);
        }, 20);
        $(window).on('resize', this.triggerWindowResize);
        this.ui.$page.on('scroll', this.triggerContentScroll);

        $.when(this.app.$applicationReady).done(() => {
            this.triggerWindowResize();
            this.triggerContentScroll();
        });
    }

    handleResize(options = {}) {
        this.appSize = this.app.authUser.setClient();

        this.$el
            .attr('data-appsize', this.appSize.size)
            .attr('data-orientation', this.appSize.orientation);
    }

    setBodyAttrs() {
        let userClient = this.app.authUser.userClient;

        if (util.isDefined(userClient)) {
            if (userClient.browser) {
                this.$el.attr('data-browser', userClient.browser.toLowerCase())
            }

            if (userClient.os) {
                this.$el.attr('data-os', userClient.os.toLowerCase());
            }
        }
    }

    onClickGlobal(ev) {
        if (ev.isDefaultPrevented()) return;
        this.trigger('global:click', ev);
    }

    onKeyupGlobal(ev) {
        this.trigger('global:keyup', ev);
    }

    onClickNavigate(ev) {
        let $clicked = $(ev.currentTarget),
            nav = $clicked.data('navigate');

        if (nav.substring(0, 6) === 'mailto') { // Looks like an email link
            window.location.href = nav;
        } else if (nav.substring(0, 4) === 'http' || $clicked.attr('target') === '_blank') { // Looks like an external link
            let win = window.open(nav, '_blank');
            win.focus();
        } else {
            this.app.navigate(nav);
        }
    }
}
