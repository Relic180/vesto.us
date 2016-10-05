import View from './view.js'; // Class is not yet assigned to window object

export default class Page extends View {
    constructor(options = {}) {
        super(options);
        util.bindDispatcher(this);
    }

    gotoSubpage(subpage = this.defaultSubpage, instant = false) {
        if (subpage === 'default') {
            subpage = this.defaultSubpage;
        }

        let $subpages = this.$el.find('[data-subpage]'),
            $subpageShow = $subpages.filter(`[data-subpage="${subpage}"]`),
            $subpageHide = $subpageShow.siblings('[data-subpage]');

        this.trigger('returnToTop', instant);

        if (instant) {
            $subpageShow.removeClass('is-hidden');
            $subpageHide.addClass('is-hidden');
        } else {
            TweenMax.to($subpageHide.filter(':not(.is-hidden)').css({
                position: 'absolute',
                top: 0,
                right: 0,
                left: 0,
                zIndex: 5, // TODO: We should use a class to manage this z-index instead
                opacity: 1
            }), .4, {
                opacity: 0,
                onComplete: () => {
                    $subpageHide
                        .addClass('is-hidden')
                        .removeAttr('style');
                }
            });
            $subpageShow.removeClass('is-hidden');
        }

        if (this.onSubpageChanged) {
            this.onSubpageChanged(subpage);
        }
    }
}
