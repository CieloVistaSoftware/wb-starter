/**
 * Observe element resize with debouncing
 * @param {HTMLElement} element - Element to observe
 * @param {Function} callback - Called with ResizeObserverEntry
 * @param {Object} options - Configuration options
 * @param {number} options.debounce - Debounce delay in ms (default: 100)
 * @param {boolean} options.immediate - Call immediately on attach (default: true)
 * @param {string} options.box - Box model to observe: 'content-box' | 'border-box' | 'device-pixel-content-box'
 * @returns {Function} Cleanup function
 */
export function onResize(element: HTMLElement, callback: Function, options?: {
    debounce: number;
    immediate: boolean;
    box: string;
}): Function;
/**
 * Stop observing an element's resize
 * @param {HTMLElement} element - Element to stop observing
 */
export function offResize(element: HTMLElement): void;
/**
 * Observe resize once, then auto-cleanup
 * @param {HTMLElement} element - Element to observe
 * @param {Function} callback - Called once with ResizeObserverEntry
 * @param {Object} options - Same options as onResize
 * @returns {Function} Cleanup function (in case you need to cancel early)
 */
export function onResizeOnce(element: HTMLElement, callback: Function, options?: any): Function;
/**
 * Create a resize breakpoint observer
 * Calls callback when element crosses specified width thresholds
 *
 * @param {HTMLElement} element - Element to observe
 * @param {Object} breakpoints - Named breakpoints { sm: 640, md: 768, lg: 1024 }
 * @param {Function} callback - Called with { name, width, crossed: 'up'|'down' }
 * @returns {Function} Cleanup function
 */
export function onBreakpoint(element: HTMLElement, breakpoints: any, callback: Function): Function;
/**
 * Observe multiple elements with a single callback
 * More efficient than creating multiple observers
 *
 * @param {HTMLElement[]} elements - Elements to observe
 * @param {Function} callback - Called with ResizeObserverEntry for each resize
 * @param {Object} options - Same options as onResize (debounce applies per-element)
 * @returns {Function} Cleanup function
 */
export function onResizeMany(elements: HTMLElement[], callback: Function, options?: any): Function;
/**
 * Get current element dimensions (sync)
 * @param {HTMLElement} element
 * @returns {{ width: number, height: number, aspectRatio: number }}
 */
export function getSize(element: HTMLElement): {
    width: number;
    height: number;
    aspectRatio: number;
};
declare namespace _default {
    export { onResize };
    export { offResize };
    export { onResizeOnce };
    export { onBreakpoint };
    export { onResizeMany };
    export { getSize };
}
export default _default;
//# sourceMappingURL=resize.d.ts.map