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

    // Premium Gradient Line Chart Injector
    naidapa_theme.mutate_charts = function () {
        // Inject the SVG linear gradient globally if it doesn't exist to ensure correct namespace rendering
        if ($('#naidapa-global-gradient').length === 0) {
            const svgHTML = `
                <svg id="naidapa-global-gradient" width="0" height="0" style="position:absolute; width:0; height:0;">
                    <defs>
                        <linearGradient id="naidapa-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#0d6b59" />
                            <stop offset="40%" stop-color="#10b981" />
                            <stop offset="65%" stop-color="#73c76b" />
                            <stop offset="85%" stop-color="#d4dda0" />
                            <stop offset="100%" stop-color="#fdf4d6" />
                        </linearGradient>
                    </defs>
                </svg>
            `;
            $('body').append(svgHTML);
        }

        // Vue components in Frappe Workspace bypass the frappe.Chart global constructor.
        // We force splines directly on rendered instances.
        $('.frappe-chart').each(function () {
            try {
                let container = $(this).get(0);
                let chart = $(container).data('chart') || (container.__vue__ && container.__vue__.chart);

                if (chart && !chart._naidapa_splined) {
                    chart._naidapa_splined = true;
                    if (chart.options && (chart.options.type === 'line' || chart.options.type === 'axis-mixed')) {
                        chart.options.lineOptions = chart.options.lineOptions || {};
                        chart.options.lineOptions.splines = 1;
                        chart.options.lineOptions.hideDots = 1;
                        chart.options.lineOptions.regionFill = 0;
                        chart.draw(); // Redraws with splines correctly!
                    }
                }
            } catch (e) { }
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
        naidapa_theme.mutate_charts(); // Try patching immediately
        observer.observe(document.body, { childList: true, subtree: true });
    });

    $(document).on('app_ready page-change', function () {
        naidapa_theme.run_patches();
        naidapa_theme.mutate_charts();
    });

})();