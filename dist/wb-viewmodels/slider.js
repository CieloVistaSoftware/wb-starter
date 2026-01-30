/**
 * Slider Behavior
 * -----------------------------------------------------------------------------
 * A slider component for selecting a value from a range.
 *
 * Custom Tag: <wb-slider>
 * -----------------------------------------------------------------------------
 */
export function slider(element, options = {}) {
    element.classList.add('wb-slider');
    element.dataset.wbReady = 'slider';
    return () => element.classList.remove('wb-slider');
}
export default slider;
//# sourceMappingURL=slider.js.map