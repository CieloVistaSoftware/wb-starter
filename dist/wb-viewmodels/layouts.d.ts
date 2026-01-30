/**
 * Layout Behaviors - Extended
 * -----------------------------------------------------------------------------
 * Structural layout primitives for building responsive interfaces.
 * Includes Grid, Flex, Stack, Cluster, and Masonry layouts.
 *
 * Custom Tag: <wb-layout>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <div x-grid data-columns="3">...</div>
 *   <div data-justify="between">...</div>
 */
/**
 * Grid - CSS Grid layout
 * Custom Tag: <wb-grid>
 */
export declare function grid(element: any, options?: any): () => any;
/**
 * Flex - Flexbox layout
 * Custom Tag: <wb-flex> or <wb-row>
 */
export declare function flex(element: any, options?: any): () => any;
/**
 * Container - Full-featured layout container
 * Supports: Stack (column), Row (horizontal), Grid (columns > 1)
 * User controls: direction, columns, gap, align, justify, wrap, padding
 * Custom Tag: <wb-container>
 */
export declare function container(element: any, options?: any): () => void;
/**
 * Stack - Vertical stack layout
 * Custom Tag: <wb-stack> or <wb-column>
 */
export declare function stack(element: any, options?: any): () => any;
/**
 * Cluster - Horizontal cluster layout
 * Custom Tag: <wb-cluster>
 */
export declare function cluster(element: any, options?: any): () => any;
/**
 * Center - Center content
 * Custom Tag: <wb-center>
 */
export declare function center(element: any, options?: any): () => any;
/**
 * Sidebar Layout - Main content with sidebar
 * Custom Tag: <wb-sidebar>
 */
export declare function sidebarlayout(element: any, options?: any): () => any;
/**
 * Switcher - Responsive switch layout
 * Custom Tag: <wb-switcher>
 */
export declare function switcher(element: any, options?: any): () => any;
/**
 * Masonry - Masonry layout
 * Custom Tag: <wb-masonry>
 */
export declare function masonry(element: any, options?: any): () => any;
/**
 * Sticky - Sticky positioning
 * Custom Tag: <wb-sticky>
 */
export declare function sticky(element: any, options?: any): () => any;
/**
 * Fixed - Fixed positioning
 */
export declare function fixed(element: any, options?: any): () => any;
/**
 * Scrollable - Scrollable container
 */
export declare function scrollable(element: any, options?: any): () => any;
/**
 * Cover - Cover layout
 * Custom Tag: <wb-cover>
 */
export declare function cover(element: any, options?: any): () => any;
/**
 * Frame - Aspect ratio frame
 * Custom Tag: <wb-frame>
 */
export declare function frame(element: any, options?: any): () => any;
/**
 * Reel - Horizontal scroll reel
 * Custom Tag: <wb-reel>
 */
export declare function reel(element: any, options?: any): () => any;
/**
 * Imposter - Overlay imposter
 */
export declare function imposter(element: any, options?: any): () => any;
/**
 * Icon - Icon layout helper
 * Custom Tag: <wb-icon>
 */
export declare function icon(element: any, options?: any): () => any;
/**
 * Drawer Layout - Collapsible container that pulls to the edge
 * Custom Tag: <wb-drawer>
 */
export declare function drawerLayout(element: any, options?: any): () => void;
declare const _default: {
    grid: typeof grid;
    flex: typeof flex;
    container: typeof container;
    stack: typeof stack;
    cluster: typeof cluster;
    center: typeof center;
    sidebarlayout: typeof sidebarlayout;
    switcher: typeof switcher;
    masonry: typeof masonry;
    sticky: typeof sticky;
    fixed: typeof fixed;
    scrollable: typeof scrollable;
    cover: typeof cover;
    frame: typeof frame;
    reel: typeof reel;
    imposter: typeof imposter;
    icon: typeof icon;
    drawerLayout: typeof drawerLayout;
};
export default _default;
//# sourceMappingURL=layouts.d.ts.map