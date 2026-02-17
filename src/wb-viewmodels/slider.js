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
  return () => element.classList.remove('wb-slider');
}
export default slider;
