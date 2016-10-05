import CollectionView from './collection_view.js';

const defaults = {
    itemBuffer: 15, // Rows to render beyond currently visible rows
    selectable: false,
    sortable: false,
    emptyListCaption: 'List is Empty',
    reuseModelViews: false,
    detachedRendering: true
};

export default class List extends View {
    constructor(options = {}) {
        let missingOptions = util.testForMissingOptions(['collection'], options);
        if (missingOptions) throw new Error(missingOptions);

        options = _.defaults(options, defaults);
        super(options);

        this.$el = (options.el instanceof $) ? options.el : $(options.el);
        this.$list = $('<div class="collection-list" />');
        this.$el.addClass('collection-list-parent');
        this.$list.appendTo(this.$el).append('<ul />');
        this.list = new CollectionView(_.extend(options, {
            el: this.$list.find('ul')
        }));

        this.rowHeight = new options.modelView().options.rowHeight; // TODO: Is this weird?
        this.prevScrollPos = this.$list.scrollTop();
        this.rendered = false;
    }

    render() {
        if (this.options.headerRow) {
            let $row = new this.options.modelView({headerRow: this.options.headerRow}).render().$el;
            this.$el.prepend($row.css('flex', '0 0 auto'));
        }

        this.list.render();
        this.$spacer = $('<li />');
        this.$spacer.prependTo(this.list.el);

        $(window).on('resize', _.bind(_.throttle(this.onResize, 20), this));
        this.$list.on('scroll', _.bind(_.throttle(this.onScroll, 20, {trailing: true}), this));
        this.listenTo(this.list, 'contentFiltered add remove', _.bind(_.debounce(this.onCollectionVisibilityChange, 50), this));
        this.onCollectionVisibilityChange();
        this.onResize();
        this.onScroll(null, true);

        this.atStart = true;
        this.nearStart = true;
        this.rendered = true;
    }

    onResize() {
        this.viewportHeight = this.$list.height();
        this.maxVisible = Math.floor(this.viewportHeight / this.rowHeight);
    }

    onScroll(ev, silent) {
        let scrollTop = this.$list.scrollTop(),
            firstVisible, firstIndex,
            lastVisible, lastIndex;

        if (this.currentVisibleCollection && this.currentVisibleCollection.length <= this.maxVisible + this.itemBuffer) {
            this.setVisibleRows();
            this.trigger('shortList');
            return;
        }

        firstVisible = Math.floor(scrollTop / this.rowHeight);
        lastVisible = Math.floor((scrollTop + this.viewportHeight) / this.rowHeight);
        firstIndex = Math.max(firstVisible - this.itemBuffer, 0);
        lastIndex = Math.min(lastVisible + this.itemBuffer, this.currentVisibleCollection.length);

        if (firstVisible === 0) {
            this.nearStart = true;

            if (!this.atStart) {
                this.atStart = true;
                if (!silent) {
                    this.trigger('start:at');
                }
            }
        } else {
            this.atStart = false;

            if (firstIndex === 0) {
                if (!this.nearStart) {
                    this.nearStart = true;
                    if (!silent) {
                        this.trigger('start:near');
                    }
                }
            } else {
                this.nearStart = false;
            }
        }

        if (lastVisible === this.currentVisibleCollection.length) {
            this.nearEnd = true;

            if (!this.atEnd) {
                this.atEnd = true;
                if (!silent) {
                    this.trigger('end:at');
                }
            }
        } else {
            this.atEnd = false;

            if (lastIndex === this.currentVisibleCollection.length) {
                if (!this.nearEnd) {
                    this.nearEnd = true;
                    if (!silent) {
                        this.trigger('end:near');
                    }
                }
            } else {
                this.nearEnd = false;
            }
        }

        this.setVisibleRows(firstIndex, lastIndex);
        this.prevScrollPos = scrollTop;
    }

    setVisibleRows(firstIndex = 0, lastIndex = (this.maxVisible + this.itemBuffer)) {
        if (!this.rendered) return;

        this.list.filterResults({
            key: 'listVisibleRowsByScroll',
            affectAccess: false,
            filterFunc: (model) => {
                let index = model.get('visibleIndex');
                return util.isDefined(index) && index >= firstIndex && index <= lastIndex;
            }
        });

        this.$spacer
            .prependTo(this.list.el)
            .height(firstIndex * this.rowHeight);
    }

    onCollectionVisibilityChange() {
        this.currentVisibleCollection = this.list.filterResults();
        $(this.list.el).css('height', this.currentVisibleCollection.length * this.rowHeight);
        this.onScroll();
    }
}
