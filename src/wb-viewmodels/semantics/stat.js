import { authorText } from '../../core/author-content.js';
/**
 * Stat - Statistic display
 * Custom Tag: <div x-stat>
 * 
 * Usage:
 *   <div x-stat value="100+" label="Behaviors" variant="purple"></div>
 *   <div x-stat value="<1s" label="Build Time" variant="orange"></div>
 */
export function stat(element, options = {}) {
  // #417: <div x-stat label="Users">1,234</div> -- the text between the tags
  // is the value and wins over `value`. It used to be wiped whenever `label`
  // was set.
  const value = options.value || authorText(element) || element.getAttribute('value') || '';
  const label = options.label || element.getAttribute('label') || '';
  const variant = options.variant || element.getAttribute('variant') || '';

  element.classList.add('x-stat');
  if (variant) element.classList.add(`x-stat--${variant}`);

  // Only build inner structure if value/label provided and element is empty
  if ((value || label) && !element.querySelector('.x-stat__value')) {
    element.innerHTML = '';
    if (value) {
      const valEl = document.createElement('div');
      valEl.className = 'x-stat__value';
      valEl.textContent = value;
      element.appendChild(valEl);
    }
    if (label) {
      const lblEl = document.createElement('div');
      lblEl.className = 'x-stat__label';
      lblEl.textContent = label;
      element.appendChild(lblEl);
    }
  }

  return () => {
    element.classList.remove('x-stat');
    if (variant) element.classList.remove(`x-stat--${variant}`);
  };
}

export default stat;
