/**
 * Utility Behaviors - Extended
 * -----------------------------------------------------------------------------
 * Miscellaneous utilities for common interactions.
 * Includes lazy loading, printing, sharing, full screen, and clipboard operations.
 *
 * Usage:
 *   <div x-lazy data-src="img.jpg"></div>
 *   <button x-copy data-target="#code">Copy</button>
 * -----------------------------------------------------------------------------
 * Fixed implementations for all utilities
 */
/**
 * Lazy - Lazy loading for images
 * Defers image loading until element enters viewport
 * Helper Attribute: [x-lazy]
 */
export declare function lazy(element: any, options?: any): () => any;
/**
 * Print - Print button (VISIBLE)
 * Helper Attribute: [x-print]
 */
export declare function print(element: any, options?: any): () => any;
/**
 * Share - Share button (VISIBLE)
 * Helper Attribute: [x-share]
 */
export declare function share(element: any, options?: any): () => any;
/**
 * Fullscreen - Toggle fullscreen (VISIBLE)
 * Helper Attribute: [x-fullscreen]
 */
export declare function fullscreen(element: any, options?: any): () => void;
/**
 * Hotkey - Keyboard shortcut with visual feedback
 * Helper Attribute: [x-hotkey]
 */
export declare function hotkey(element: any, options?: any): () => void;
/**
 * Clipboard - Copy to clipboard (VISIBLE BUTTON)
 * Helper Attribute: [x-clipboard]
 */
export declare function clipboard(element: any, options?: any): () => any;
/**
 * Scroll - Scroll to element (VISIBLE)
 * Helper Attribute: [x-scroll]
 */
export declare function scroll(element: any, options?: any): () => any;
/**
 * Truncate - Text truncation
 * Helper Attribute: [x-truncate]
 */
export declare function truncate(element: any, options?: any): () => any;
/**
 * Highlight - Text highlight with VISIBLE yellow background
 * Helper Attribute: [x-highlight]
 */
export declare function highlight(element: any, options?: any): () => void;
/**
 * Helper Attribute: [x-external]
 * External - External link handler
 */
export declare function external(element: any, options?: any): () => any;
/**
 * Helper Attribute: [x-countdown]
 * Use: x-countdown data-seconds="60" OR data-date="2025-12-31"
 */
export declare function countdown(element: any, options?: any): () => any;
/**
 * Clock - Live clock with VARIANTS (digital, led, analog)
 * Helper Attribute: [x-clock]
 */
export declare function clock(element: any, options?: any): () => void;
/**
 * RelativeTime - Relative time display
 * Helper Attribute: [x-relativetime]
 */
export declare function relativetime(element: any, options?: any): () => void;
/**
 * Offline - Offline detection (VISIBLE)
 * Helper Attribute: [x-offline]
 */
export declare function offline(element: any, options?: any): () => void;
/**
 * Visible - Visibility toggle
 * Helper Attribute: [x-visible]
 */
export declare function visible(element: any, options?: any): () => void;
/**
 * Debug - Console error overlay
 * Shows console errors, warnings, and logs on screen
 * Helper Attribute: [x-debug]
 */
export declare function debug(element: any, options?: any): () => void;
declare const _default: {
    lazy: typeof lazy;
    print: typeof print;
    share: typeof share;
    fullscreen: typeof fullscreen;
    hotkey: typeof hotkey;
    clipboard: typeof clipboard;
    scroll: typeof scroll;
    truncate: typeof truncate;
    highlight: typeof highlight;
    external: typeof external;
    countdown: typeof countdown;
    clock: typeof clock;
    relativetime: typeof relativetime;
    offline: typeof offline;
    visible: typeof visible;
    debug: typeof debug;
};
export default _default;
//# sourceMappingURL=helpers.d.ts.map