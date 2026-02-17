// Standalone help behavior extracted from enhancements.js
export function help(element, options = {}) {
  element.classList.add('wb-help');
  element.setAttribute('role', 'note');
  return () => element.classList.remove('wb-help');
}
