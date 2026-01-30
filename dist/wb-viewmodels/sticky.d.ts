/**
 * Sticky Behavior
 * -----------------------------------------------------------------------------
 * Makes an element stick to the top of the viewport when scrolling past it
 *
 * Helper Attribute: [x-sticky]
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <nav x-sticky>...</nav>
 *   <header x-sticky data-offset="60" data-z-index="1000">...</header>
 *
 * Options:
 *   data-offset    - Pixels from top when stuck (default: 0)
 *   data-z-index   - Z-index when stuck (default: 100)
 *   data-threshold - Scroll position to trigger (default: element's top)
 *   data-class     - Class to add when stuck (default: "is-stuck")
 *   data-animate   - Add smooth transition (default: true)
 */
export declare function sticky(element: any, options?: any): () => void;
declare const _default: {
    sticky: typeof sticky;
};
export default _default;
//# sourceMappingURL=sticky.d.ts.map