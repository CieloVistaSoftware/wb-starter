/**
 * Slider Behavior
 * -----------------------------------------------------------------------------
 * A slider component for selecting a value from a range.
 * 
 * Custom Tag: <wb-slider>
 * -----------------------------------------------------------------------------
 */
export function slider(element, options = {}) {
  // #448: no classList.add('wb-slider') -- no CSS selector anywhere depends
  // on the bare class; it just duplicated <wb-slider>'s own tag name.
  return () => {};
}
export default slider;
