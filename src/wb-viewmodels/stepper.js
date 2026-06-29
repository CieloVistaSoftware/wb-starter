// Standalone stepper behavior extracted from enhancements.js
//
// Supports two markup forms:
//   1. <input x-stepper min max step value>            → wraps the input with −/+ buttons
//   2. <div x-stepper data-value data-min data-max>     → builds [−][value][+] INSIDE the div
// The showcase uses form (2); the original code only handled form (1), so the
// div had no value display and reading `.value` off a <div> was always 0. (#178)
export function stepper(element, options = {}) {
  const isInput = element.tagName === 'INPUT';
  const num = (v, d) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
  };
  const config = {
    min: num(options.min ?? element.getAttribute('min') ?? element.dataset.min, -Infinity),
    max: num(options.max ?? element.getAttribute('max') ?? element.dataset.max, Infinity),
    step: num(options.step ?? element.getAttribute('step') ?? element.dataset.step, 1),
    value: num(
      options.value ?? element.getAttribute('value') ?? element.dataset.value ?? (isInput ? element.value : '0'),
      0
    ),
    ...options,
  };

  // Hover/explainer text (the control is otherwise just − N + with no affordance).
  const lo = Number.isFinite(config.min) ? config.min : '−∞';
  const hi = Number.isFinite(config.max) ? config.max : '∞';
  const hint = `Number stepper — click − or + to change the value (range ${lo}–${hi}, step ${config.step}).`;
  element.title = hint;
  element.setAttribute('aria-label', element.getAttribute('aria-label') || hint);

  const decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.className = 'wb-stepper__btn wb-stepper__dec';
  decBtn.textContent = '−';
  decBtn.title = `Decrease by ${config.step}`;
  decBtn.setAttribute('aria-label', 'Decrease');

  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.className = 'wb-stepper__btn wb-stepper__inc';
  incBtn.textContent = '+';
  incBtn.title = `Increase by ${config.step}`;
  incBtn.setAttribute('aria-label', 'Increase');

  let read, write, cleanup;

  if (isInput) {
    // Form (1): wrap the input between the two buttons.
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-stepper';
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(decBtn);
    wrapper.appendChild(element);
    wrapper.appendChild(incBtn);
    element.classList.add('wb-stepper__input');
    element.value = config.value;
    read = () => num(element.value, 0);
    write = (v) => { element.value = v; element.dispatchEvent(new Event('change')); };
    cleanup = () => { wrapper.parentNode.insertBefore(element, wrapper); wrapper.remove(); };
  } else {
    // Form (2): build [−][value][+] inside the container so the value is visible
    // and the buttons are discoverable as children of the [x-stepper] element.
    element.classList.add('wb-stepper');
    element.textContent = '';
    const valueEl = document.createElement('span');
    valueEl.className = 'wb-stepper__value';
    valueEl.textContent = String(config.value);
    element.appendChild(decBtn);
    element.appendChild(valueEl);
    element.appendChild(incBtn);
    read = () => num(valueEl.textContent, 0);
    write = (v) => { valueEl.textContent = String(v); };
    cleanup = () => { element.textContent = ''; element.classList.remove('wb-stepper'); };
  }

  const updateValue = (delta) => {
    const value = Math.max(config.min, Math.min(config.max, read() + delta));
    write(value);
    element.dispatchEvent(new CustomEvent('wb:stepper:change', { bubbles: true, detail: { value } }));
  };

  decBtn.onclick = () => updateValue(-config.step);
  incBtn.onclick = () => updateValue(config.step);

  return cleanup;
}
