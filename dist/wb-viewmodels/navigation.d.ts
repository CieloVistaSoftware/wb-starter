/**
 * Navigation Behaviors
 * -----------------------------------------------------------------------------
 * Provides responsive navigation components including navbars, sidebars,
 * menus, breadcrumbs, and pagination steps.
 *
 * Custom Tag: <wb-navigation>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <wb-navbar  data-logo="MySite">...</nav>
 *   <aside data-items='[...]'>...</aside>
 * -----------------------------------------------------------------------------
 *
 * FIXED: v2.0
 * - Menu component: Proper flex layout with correct spacing
 * - Navbar component: Better responsive design
 * - Sidebar component: Fixed item layout and hover states
 */
/**
 * Navbar - Navigation bar from data attributes
 * Custom Tag: <wb-navbar>
 *
 * Attributes:
 * - data-brand: Brand name text
 * - data-brand-href: Brand link URL (optional, defaults to /)
 * - data-logo: Logo image URL (optional)
 * - data-logo-size: Logo size in pixels (optional, defaults to 32)
 * - data-items: Comma-separated nav items
 * - data-sticky: Makes navbar sticky on scroll
 */
export declare function navbar(element: any, options?: any): () => any;
/**
 * Sidebar - Vertical navigation from data-items
 * Custom Tag: <wb-sidebar>
 */
export declare function sidebar(element: any, options?: any): () => void;
/**
 * Menu - Clickable menu from data-items
 * Custom Tag: <wb-menu>
 * FIXED: Proper flex layout, correct spacing, better hover states
 */
export declare function menu(element: any, options?: any): () => any;
/**
 * Pagination - Page navigation from data-pages
 * Custom Tag: <wb-pagination>
 */
export declare function pagination(element: any, options?: any): () => any;
/**
 * Steps - Step indicator from data-items
 * Custom Tag: <wb-steps>
 */
export declare function steps(element: any, options?: any): () => any;
/**
 * Treeview - Hierarchical tree from JSON
 * Custom Tag: <wb-treeview>
 */
export declare function treeview(element: any, options?: any): () => any;
/**
 * BackToTop - Scroll to top button
 * Custom Tag: <wb-backtotop>
 */
export declare function backtotop(element: any, options?: any): () => void;
/**
 * Link - Clickable link that navigates to internal sections or external URLs
 * Custom Tag: <wb-link>
 * Validates URLs on click - turns red and logs error if invalid
 */
export declare function link(element: any, options?: any): () => any;
/**
 * Statusbar - Bottom status bar
 * Custom Tag: <wb-statusbar>
 */
export declare function statusbar(element: any, options?: any): () => void;
declare const _default: {
    navbar: typeof navbar;
    sidebar: typeof sidebar;
    menu: typeof menu;
    pagination: typeof pagination;
    steps: typeof steps;
    treeview: typeof treeview;
    backtotop: typeof backtotop;
    link: typeof link;
    statusbar: typeof statusbar;
};
export default _default;
//# sourceMappingURL=navigation.d.ts.map