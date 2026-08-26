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
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-slider> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-slider> tag does not get a redundant class.
  if (element.tagName.toLowerCase() !== 'x-slider') element.classList.add('x-slider');
  return () => {};
}
export default slider;
