/**
 * Stat - Statistic display
 * Custom Tag: <wb-stat>
 * 
 * Usage:
 *   <wb-stat value="100+" label="Behaviors" variant="purple"></wb-stat>
 *   <wb-stat value="<1s" label="Build Time" variant="orange"></wb-stat>
 */
export function stat(element, options = {}) {
  const value = options.value || element.getAttribute('value') || '';
  const label = options.label || element.getAttribute('label') || '';
  const variant = options.variant || element.getAttribute('variant') || '';

  element.classList.add('wb-stat');
  if (variant) element.classList.add(`wb-stat--${variant}`);

  // Only build inner structure if value/label provided and element is empty
  if ((value || label) && !element.querySelector('.wb-stat__value')) {
    element.innerHTML = '';
    if (value) {
      const valEl = document.createElement('div');
      valEl.className = 'wb-stat__value';
      valEl.textContent = value;
      element.appendChild(valEl);
    }
    if (label) {
      const lblEl = document.createElement('div');
      lblEl.className = 'wb-stat__label';
      lblEl.textContent = label;
      element.appendChild(lblEl);
    }
  }

  return () => {
    element.classList.remove('wb-stat');
    if (variant) element.classList.remove(`wb-stat--${variant}`);
  };
}

export default stat;
