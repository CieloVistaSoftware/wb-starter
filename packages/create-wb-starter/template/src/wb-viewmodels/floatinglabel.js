// Standalone floatinglabel behavior extracted from enhancements.js
export function floatinglabel(element, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-floating-label';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  const label = document.createElement('label');
  label.className = 'wb-floating-label__label';
  label.textContent = element.placeholder || element.getAttribute('label') || '';
  wrapper.appendChild(label);
  element.placeholder = '';
  const checkValue = () => {
    wrapper.classList.toggle('wb-floating-label--active', element.value || document.activeElement === element);
  };
  element.addEventListener('focus', checkValue);
  element.addEventListener('blur', checkValue);
  element.addEventListener('input', checkValue);
  checkValue();
  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
  };
}
