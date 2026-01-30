/**
 * Globe Behavior
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-globe>
 * -----------------------------------------------------------------------------
 */
export function globe(element: HTMLElement, options: Record<string, any> = {}) {
  element.classList.add('wb-globe');
  element.dataset.wbReady = 'globe';
  return () => element.classList.remove('wb-globe');
}
export default globe;
