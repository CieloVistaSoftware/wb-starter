/**
 * Scroll Progress Behavior
 * -----------------------------------------------------------------------------
 * Shows scroll progress on the element.
 * 
 * Helper Attribute: [x-scrollProgress]  (the class it adds is x-scroll-progress)
 * -----------------------------------------------------------------------------
 */
export function scrollProgress(element, options = {}) {
  element.classList.add('x-scroll-progress');
  return () => element.classList.remove('x-scroll-progress');
}
export default scrollProgress;
