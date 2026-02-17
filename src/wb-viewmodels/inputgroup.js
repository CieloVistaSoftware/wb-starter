// Standalone inputgroup behavior extracted from enhancements.js
export function inputgroup(element, options = {}) {
  element.classList.add('wb-input-group');
  const prepend = element.querySelector('[data-prepend]');
  const append = element.querySelector('[data-append]');
  if (prepend) prepend.classList.add('wb-input-group__prepend');
  if (append) append.classList.add('wb-input-group__append');
  return () => element.classList.remove('wb-input-group');
}
