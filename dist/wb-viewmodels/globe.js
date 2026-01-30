/**
 * Globe Behavior
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-globe>
 * -----------------------------------------------------------------------------
 */
export function globe(element, options = {}) {
    element.classList.add('wb-globe');
    element.dataset.wbReady = 'globe';
    return () => element.classList.remove('wb-globe');
}
export default globe;
//# sourceMappingURL=globe.js.map