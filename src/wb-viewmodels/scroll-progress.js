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
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-scroll-progress');
}
export default scrollProgress;
