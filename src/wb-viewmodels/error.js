// Standalone error behavior extracted from enhancements.js
export function error(element, options = {}) {
  element.classList.add('wb-error');
  element.setAttribute('role', 'alert');
  return () => element.classList.remove('wb-error');
}
