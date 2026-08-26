// Standalone help behavior extracted from enhancements.js
export function help(element, options = {}) {
  element.classList.add('x-help');
  element.setAttribute('role', 'note');
  return () => element.classList.remove('x-help');
}
