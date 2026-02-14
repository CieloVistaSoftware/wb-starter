/**
 * Globe Behavior
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-globe>
 * -----------------------------------------------------------------------------
 */
export function globe(element, options = {}) {
  element.classList.add('wb-globe');
  element.classList.add('wb-ready');
  return () => element.classList.remove('wb-globe');
}
export default globe;
