import template from './templates/context_menu';
import './styles/context_menu';

const defaults = {
    minWidth: '135px',
    maxWidth: '175px',
    resizeableV: true
};

export default class ContextMenu extends Class.View.Screentip.Base {
    constructor(options = {}) {
        util.testForMissingOptions(['items'], options);

        super(_.defaults(options, defaults));

        this.type = 'contextMenu';
        this.template = template;
        this.class = 'screentip-contextmenu';

        this.ui = {
            'menuItems': '.menu-item'
        };
        this.events = {
            'click @menuItems': 'onClickMenuItem'
        };

        for (var i = 0; i < this.options.items.length; i++) {
            this.options.items[i].idx = i;
        }
    }

    open() {
        let $attached = this.options.$attached;

        if ($attached && $attached.length) {
            $attached.addClass('menu-open');
        }

        return super.open();
    }

    close() { // TODO: This should work as a toggle instead of immediately reopening the menu
        let $attached = this.options.$attached;

        if ($attached && $attached.length) {
            $attached.removeClass('menu-open');
        }

        return super.close();
    }

    onClickMenuItem(ev) {
        var $clicked = $(ev.currentTarget),
            onClick = this.options.onClick,
            onClickItem = this.options.items[$clicked.data('idx')].onClickItem,
            url = $clicked.data('navigate') || '',
            post = $clicked.data('post') || '',
            val = $clicked.data('val');

        if (url.length > 0) {
            this.trigger('closeAll');
        }

        if (onClickItem || onClick) {
            ev.preventDefault();

            if (onClickItem) { // Individual onClick
                onClickItem(val, ev);
            } else if (onClick) { // Global onClick
                onClick(val, ev);
            }

            this.close();
        } else if (post.length > 0) {
            ev.preventDefault();

            $.ajax(post, {
                type: 'POST'
            })
                .done(() => {
                    if (url.length > 0) {
                        // TODO: Repair router and let these use pushstate instead
                        this.trigger('navigate', url, {ev, allowDefault: true});
                    }
                });
        } else {
            this.trigger('navigate', url, {ev});
        }
    }
}
