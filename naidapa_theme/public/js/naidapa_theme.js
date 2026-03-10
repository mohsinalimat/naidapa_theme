(function () {
    "use strict";

    frappe.provide("naidapa_theme");

    naidapa_theme.setup = function () {
        $('body').addClass('naidapa-theme-active');
        naidapa_theme.run_patches();
    };

    naidapa_theme.run_patches = function () {
        naidapa_theme.highlight_active_route();
        naidapa_theme.mutate_workspace_container();
        naidapa_theme.mutate_custom_elements();
        naidapa_theme.inject_navbar_toggle();
    };

    naidapa_theme.inject_navbar_toggle = function () {
        if ($('.header-toggle').length === 0) {
            const toggle_html = '<span class="header-toggle" style="margin-right: 15px; cursor: pointer; display: flex; align-items: center; font-size: 22px; color: var(--text-primary);"> <iconify-icon icon="line-md:menu-fold-left"></iconify-icon></span>';
            $('.navbar-brand').before(toggle_html);

            // Bind click event to toggle sidebar
            $('.header-toggle').on('click', function () {
                const $body = $('body');
                const $icon = $(this).find('iconify-icon');
                
                if ($body.hasClass('sidebar-menu-opened')) {
                    $body.removeClass('sidebar-menu-opened');
                    $icon.attr('icon', 'line-md:menu-fold-left');
                } else {
                    $body.addClass('sidebar-menu-opened');
                    $icon.attr('icon', 'line-md:menu-fold-right');
                }
            });
        }
    };

    naidapa_theme.mutate_custom_elements = function () {
        const changes = [
            { selector: '.old-style-class', add: 'new-style-class', remove: 'old-style-class' },
        ];

        changes.forEach(item => {
            let $el = $(item.selector);
            if (item.remove) $el.removeClass(item.remove);
            if (item.add) $el.addClass(item.add);
        });
    };

    naidapa_theme.highlight_active_route = function () {
        const current_route = window.location.pathname;
        $('.main-nav > li').removeClass('active');

        // Exact matching
        $(`.main-nav > li > a[href="${current_route}"]`).parent().addClass('active');

        // Fuzzy matching
        if (current_route && current_route !== "/app") {
            $('.main-nav > li > a').each(function () {
                let href = $(this).attr('href');
                if (href && current_route.startsWith(href) && href !== "/app") {
                    $(this).parent().addClass('active');
                }
            });
        }
    };

    //naidapa_theme.remove_native_elements = function () {
    //    $('.layout-side-section, .sidebar-toggle-btn').remove();
    //};

    naidapa_theme.mutate_workspace_container = function () {
        const selectors = [
            '#body > .content > .container',
            '#body > .content > .page-head > .container',
            '.page-body.container'
        ];

        selectors.forEach(selector => {
            $(selector).removeClass('container').addClass('container-fluid');
        });
    };

    const view_names = ["ListView", "FormView", "KanbanView", "ReportView", "GanttView", "Workspace"];
    view_names.forEach(name => {
        const Orig = frappe.views[name];
        if (!Orig) return;

        frappe.views[name] = class extends Orig {
            make() {
                super.make();
                naidapa_theme.run_patches();
            }
        };
    });

    const observer = new MutationObserver(() => {
        naidapa_theme.run_patches();
    });

    $(document).ready(() => {
        naidapa_theme.setup();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    $(document).on('app_ready page-change', function () {
        naidapa_theme.run_patches();
    });

})();