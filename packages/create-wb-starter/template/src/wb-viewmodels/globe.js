/**
 * Globe Behavior
 * -----------------------------------------------------------------------------
 * Custom Tag: <div x-globe>
 * -----------------------------------------------------------------------------
 */
export function globe(element, options = {}) {
  element.classList.add('x-globe');
  return () => element.classList.remove('x-globe');
}
export default globe;
