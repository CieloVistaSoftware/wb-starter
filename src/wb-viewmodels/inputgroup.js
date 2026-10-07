// Standalone inputgroup behavior extracted from enhancements.js
export function inputgroup(element, options = {}) {
  element.classList.add('x-inputgroup');
  const prepend = element.querySelector('[data-prepend]');
  const append = element.querySelector('[data-append]');
  if (prepend) prepend.classList.add('x-inputgroup__prepend');
  if (append) append.classList.add('x-inputgroup__append');
  return () => element.classList.remove('x-inputgroup');
}
