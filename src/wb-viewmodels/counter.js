// Standalone counter behavior extracted from enhancements.js
export function counter(element, options = {}) {
  const config = {
    max: parseInt(options.max || element.getAttribute('max') || element.maxLength || '0'),
    warning: parseInt(options.warning || element.getAttribute('warning') || '0'),
    ...options
  };
  const counter = document.createElement('span');
  counter.className = 'wb-counter';
  element.parentNode.insertBefore(counter, element.nextSibling);
  const update = () => {
    const val = element.value || '';
    const len = val.length;
    counter.textContent = config.max ? `${len}/${config.max}` : len;
    counter.classList.toggle('wb-counter--warning', config.warning && len >= config.warning);
    counter.classList.toggle('wb-counter--error', config.max && len >= config.max);
  };
  element.addEventListener('input', update);
  update();
  return () => counter.remove();
}
