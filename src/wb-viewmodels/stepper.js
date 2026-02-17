// Standalone stepper behavior extracted from enhancements.js
export function stepper(element, options = {}) {
  const config = {
    min: parseFloat(options.min ?? element.getAttribute('min') ?? '-Infinity'),
    max: parseFloat(options.max ?? element.getAttribute('max') ?? 'Infinity'),
    step: parseFloat(options.step || element.getAttribute('step') || '1'),
    ...options
  };
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-stepper';
  element.parentNode.insertBefore(wrapper, element);
  const decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.className = 'wb-stepper__btn wb-stepper__dec';
  decBtn.textContent = '−';
  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.className = 'wb-stepper__btn wb-stepper__inc';
  incBtn.textContent = '+';
  wrapper.appendChild(decBtn);
  wrapper.appendChild(element);
  wrapper.appendChild(incBtn);
  element.classList.add('wb-stepper__input');
  const updateValue = (delta) => {
    let value = parseFloat(element.value) || 0;
    value = Math.max(config.min, Math.min(config.max, value + delta));
    element.value = value;
    element.dispatchEvent(new Event('change'));
  };
  decBtn.onclick = () => updateValue(-config.step);
  incBtn.onclick = () => updateValue(config.step);
  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
  };
}
