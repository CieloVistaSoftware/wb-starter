/**
 * Slider Behavior
 * -----------------------------------------------------------------------------
 * A slider component for selecting a value from a range.
 * 
 * Custom Tag: <div x-slider>
 * -----------------------------------------------------------------------------
 */
export function slider(element, options = {}) {
  // #448: no classList.add('x-slider') -- no CSS selector anywhere depends
  // on the bare class; it just duplicated <div x-slider>'s own tag name.
  return () => {};
}
export default slider;
