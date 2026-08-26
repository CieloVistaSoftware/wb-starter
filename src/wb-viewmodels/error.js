// Standalone error behavior extracted from enhancements.js
export function error(element, options = {}) {
  element.classList.add('x-error');
  element.setAttribute('role', 'alert');
  return () => element.classList.remove('x-error');
}
