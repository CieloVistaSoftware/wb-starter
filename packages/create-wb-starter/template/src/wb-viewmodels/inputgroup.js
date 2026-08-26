// Standalone inputgroup behavior extracted from enhancements.js
export function inputgroup(element, options = {}) {
  element.classList.add('x-input-group');
  const prepend = element.querySelector('[data-prepend]');
  const append = element.querySelector('[data-append]');
  if (prepend) prepend.classList.add('x-input-group__prepend');
  if (append) append.classList.add('x-input-group__append');
  return () => element.classList.remove('x-input-group');
}
