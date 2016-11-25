const defaults = {
    itemBuffer: 15, // Rows to render beyond currently visible rows // TODO: Convert to pixel based?
    selectable: false,
    sortable: false,
    emptyListCaption: 'Nothing here...',
    reuseModelViews: false,
    detachedRendering: true
};

export default class Simple extends Class.View.Base {
    constructor(options = {}) {
        util.testForMissingOptions(['collection', 'modelView'], options);

        super(_.defaults(options, defaults));

        this.$el = (this.options.el instanceof $) ? this.options.el : $(this.options.el);
        this.$el.addClass('element-list-simple').attr('data-module', 'list');
        this.$list = $('<ul />');
        this.$list.appendTo(this.$el);
        this.modelView = options.modelView;
        this.rowHeight = this.modelView.rowHeight();

        atlas.newClass('Collection.View.Base', _.extend({}, options, {
            el: this.$list,
            modelView: this.modelView
        }), this)
            .done((newCollectionView) => {
                this.collectionView = newCollectionView;
                this.prevScrollPos = this.$el.scrollTop();
                this.rendered = false;
            });
    }

    render() {
        super.render();

        this.collectionView.render();
        this.$spacer = $('<li />');

        $(window).on('resize.simplelist', _.throttle(this.onResize,20).bind(this));
        this.$el.on('scroll.simplelist', _.throttle(this.onScroll, 20, {trailing: true}).bind(this));
        this.listenTo(this.collectionView, 'contentFiltered add remove reset', _.debounce(this.onCollectionVisibilityChange, 50).bind(this));
        this.onCollectionVisibilityChange();
        this.onResize();
        this.onScroll(null, true);

        this.atStart = true;
        this.nearStart = true;
        this.rendered = true;

        return this;
    }

    onResize() {
        this.viewportHeight = this.$el.height();
        this.maxVisible = Math.floor(this.viewportHeight / this.rowHeight);
    }

    onScroll(ev, silent) {
        let scrollTop = this.$el.scrollTop(),
            firstVisible, firstIndex,
            lastVisible, lastIndex;

        if (this.collectionView.filteredSet && this.collectionView.filteredSet.length <= this.maxVisible + this.options.itemBuffer) {
            this.setVisibleRows();
            this.trigger('shortList');
            return;
        }

        firstVisible = Math.floor(scrollTop / this.rowHeight);
        lastVisible = Math.floor((scrollTop + this.viewportHeight) / this.rowHeight);
        firstIndex = Math.max(firstVisible - this.options.itemBuffer, 0);
        lastIndex = Math.min(lastVisible + this.options.itemBuffer, this.collectionView.filteredSet.length);

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

        if (lastVisible === this.collectionView.filteredSet.length) {
            this.nearEnd = true;

            if (!this.atEnd) {
                this.atEnd = true;
                if (!silent) {
                    this.trigger('end:at');
                }
            }
        } else {
            this.atEnd = false;

            if (lastIndex === this.collectionView.filteredSet.length) {
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

    onDestroy() {
        $(window).off('.simplelist'); // TODO: Need to include cid or other identifier with these
        this.$el.off('.simplelist');
    }

    setVisibleRows(firstIndex = 0, lastIndex = (this.maxVisible + this.options.itemBuffer)) {
        if (this.collectionView.filteredSet) {
            this.currentVisibleCollection = this.collectionView.filteredSet.forEach((view, i) => {
                if (i < firstIndex || i > lastIndex) {
                    view.$el.addClass('is-hidden');
                } else {
                    view.$el.removeClass('is-hidden');
                }
            })
        }

        this.$spacer
            .prependTo(this.collectionView.el)
            .height(firstIndex * this.rowHeight);
    }

    onCollectionVisibilityChange() {
        if (this.rendered) {
            this.onScroll();
        }
    }
}
