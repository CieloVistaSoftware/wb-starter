/**
 * Resize Observer Utility
 * =======================
 * Debounced ResizeObserver wrapper for responsive behaviors.
 *
 * Usage:
 *   import { onResize, offResize, onResizeOnce } from './resize.js';
 *
 *   // Basic usage
 *   const cleanup = onResize(element, (entry) => {
 *     console.log('Size:', entry.contentRect.width, entry.contentRect.height);
 *   });
 *
 *   // Later: cleanup();
 *
 * @version 1.0.0
 */
// Track observers for cleanup
const observers = new WeakMap();
const callbacks = new WeakMap();
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
export function onResize(element, callback, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
        console.warn('[resize] Invalid element');
        return () => { };
    }
    // Check for ResizeObserver support
    if (!('ResizeObserver' in window)) {
        console.warn('[resize] ResizeObserver not supported, falling back to window resize');
        const handler = () => callback({
            target: element,
            contentRect: element.getBoundingClientRect(),
            borderBoxSize: [{ inlineSize: element.offsetWidth, blockSize: element.offsetHeight }],
            contentBoxSize: [{ inlineSize: element.clientWidth, blockSize: element.clientHeight }]
        });
        window.addEventListener('resize', handler);
        if (options.immediate !== false)
            handler();
        return () => window.removeEventListener('resize', handler);
    }
    const { debounce = 100, immediate = true, box = 'content-box' } = options;
    let timeout;
    let lastEntry = null;
    const debouncedCallback = (entries) => {
        const entry = entries[0];
        lastEntry = entry;
        if (debounce === 0) {
            callback(entry);
            return;
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            callback(entry);
        }, debounce);
    };
    // Create observer
    const observer = new ResizeObserver(debouncedCallback);
    observer.observe(element, { box });
    // Store for potential external cleanup
    observers.set(element, observer);
    callbacks.set(element, callback);
    // Immediate callback with current size
    if (immediate) {
        const rect = element.getBoundingClientRect();
        callback({
            target: element,
            contentRect: rect,
            borderBoxSize: [{ inlineSize: element.offsetWidth, blockSize: element.offsetHeight }],
            contentBoxSize: [{ inlineSize: element.clientWidth, blockSize: element.clientHeight }]
        });
    }
    // Return cleanup function
    return () => {
        clearTimeout(timeout);
        observer.disconnect();
        observers.delete(element);
        callbacks.delete(element);
    };
}
/**
 * Stop observing an element's resize
 * @param {HTMLElement} element - Element to stop observing
 */
export function offResize(element) {
    const observer = observers.get(element);
    if (observer) {
        observer.disconnect();
        observers.delete(element);
        callbacks.delete(element);
    }
}
/**
 * Observe resize once, then auto-cleanup
 * @param {HTMLElement} element - Element to observe
 * @param {Function} callback - Called once with ResizeObserverEntry
 * @param {Object} options - Same options as onResize
 * @returns {Function} Cleanup function (in case you need to cancel early)
 */
export function onResizeOnce(element, callback, options = {}) {
    const cleanup = onResize(element, (entry) => {
        callback(entry);
        cleanup();
    }, { ...options, immediate: false });
    return cleanup;
}
/**
 * Create a resize breakpoint observer
 * Calls callback when element crosses specified width thresholds
 *
 * @param {HTMLElement} element - Element to observe
 * @param {Object} breakpoints - Named breakpoints { sm: 640, md: 768, lg: 1024 }
 * @param {Function} callback - Called with { name, width, crossed: 'up'|'down' }
 * @returns {Function} Cleanup function
 */
export function onBreakpoint(element, breakpoints, callback) {
    let currentBreakpoint = null;
    const sortedBreakpoints = Object.entries(breakpoints)
        .sort((a, b) => a[1] - b[1]);
    const getBreakpoint = (width) => {
        for (let i = sortedBreakpoints.length - 1; i >= 0; i--) {
            if (width >= sortedBreakpoints[i][1]) {
                return sortedBreakpoints[i][0];
            }
        }
        return null;
    };
    return onResize(element, (entry) => {
        const width = entry.contentRect.width;
        const newBreakpoint = getBreakpoint(width);
        if (newBreakpoint !== currentBreakpoint) {
            const crossed = currentBreakpoint === null ? 'initial'
                : (breakpoints[newBreakpoint] || 0) > (breakpoints[currentBreakpoint] || 0) ? 'up' : 'down';
            callback({
                name: newBreakpoint,
                previous: currentBreakpoint,
                width,
                crossed
            });
            currentBreakpoint = newBreakpoint;
        }
    }, { debounce: 50 });
}
/**
 * Observe multiple elements with a single callback
 * More efficient than creating multiple observers
 *
 * @param {HTMLElement[]} elements - Elements to observe
 * @param {Function} callback - Called with ResizeObserverEntry for each resize
 * @param {Object} options - Same options as onResize (debounce applies per-element)
 * @returns {Function} Cleanup function
 */
export function onResizeMany(elements, callback, options = {}) {
    const cleanups = elements.map(el => onResize(el, callback, options));
    return () => cleanups.forEach(fn => fn());
}
/**
 * Get current element dimensions (sync)
 * @param {HTMLElement} element
 * @returns {{ width: number, height: number, aspectRatio: number }}
 */
export function getSize(element) {
    const rect = element.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height || 1
    };
}
export default { onResize, offResize, onResizeOnce, onBreakpoint, onResizeMany, getSize };
//# sourceMappingURL=resize.js.map