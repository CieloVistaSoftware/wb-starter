/**
 * Globe visualization component placeholder.
 * - `<wb-globe>` for decorative globe effects.
 */
export function cc() {}

export function globe(element, options = {}) {
  element.classList.add('wb-globe');
  element.dataset.wbReady = 'globe';
  return () => element.classList.remove('wb-globe');
}
export default globe;
