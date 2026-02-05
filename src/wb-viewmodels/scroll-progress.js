/**
 * Shows scroll progress indicator on the element.
 * - `[x-scroll-progress]` for page scroll visualization.
 */
export function cc() {}

export function scrollProgress(element, options = {}) {
  element.classList.add('wb-scroll-progress');
  element.dataset.wbReady = 'scroll-progress';
  return () => element.classList.remove('wb-scroll-progress');
}
export default scrollProgress;
