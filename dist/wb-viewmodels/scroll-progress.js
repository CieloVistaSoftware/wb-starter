/**
 * Scroll Progress Behavior
 * -----------------------------------------------------------------------------
 * Shows scroll progress on the element.
 *
 * Helper Attribute: [x-scroll-progress]
 * -----------------------------------------------------------------------------
 */
export function scrollProgress(element, options = {}) {
    element.classList.add('wb-scroll-progress');
    element.dataset.wbReady = 'scroll-progress';
    return () => element.classList.remove('wb-scroll-progress');
}
export default scrollProgress;
//# sourceMappingURL=scroll-progress.js.map