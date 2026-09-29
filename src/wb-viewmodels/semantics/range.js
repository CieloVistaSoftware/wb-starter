/**
 * Range - Enhanced <input type="range"> element
 * Adds value display, min/max labels, step indicators
 * Helper Attribute: [x-behavior="range"]
 */
export function range(element, options = {}) {
  // Any element can carry an x-* behavior (the premise input.js builds on for
  // <div x-input>). <div x-range show-value> used to warn "must be an <input
  // type=range>" and do nothing, so every option row of the attribute form on
  // the behaviors page rendered the same bare div. On a container host, build
  // the real slider inside it and enhance that, reading the host's options.
  if (element.tagName !== 'INPUT') {
    let input = element.querySelector(':scope > input[type="range"], :scope > .x-range-wrapper > input[type="range"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'range';
      for (const attr of ['min', 'max', 'step', 'value', 'name', 'disabled']) {
        if (element.hasAttribute(attr)) input.setAttribute(attr, element.getAttribute(attr));
      }
      element.textContent = '';
      element.appendChild(input);
    }
    return range(input, {
      showValue: options.showValue ?? element.hasAttribute('show-value'),
      showLabels: options.showLabels ?? element.hasAttribute('show-labels'),
      valuePrefix: options.valuePrefix || element.getAttribute('value-prefix') || '',
      valueSuffix: options.valueSuffix || element.getAttribute('value-suffix') || '',
      ...options,
    });
  }
  if (element.type !== 'range') {
    console.warn('[range] An <input> host must be type="range"');
    return () => {};
  }

  // v3: plain attributes only — no legacy data-* fallback.
  const config = {
    showValue: options.showValue ?? element.hasAttribute('show-value'),
    showLabels: options.showLabels ?? element.hasAttribute('show-labels'),
    valuePrefix: options.valuePrefix || element.getAttribute('value-prefix') || '',
    valueSuffix: options.valueSuffix || element.getAttribute('value-suffix') || '',
    ...options
  };

  element.classList.add('x-range');

  let wrapper = null;
  let valueDisplay = null;
  let minLabel = null;
  let maxLabel = null;

  // Wrap in container for value display and labels
  if (config.showValue || config.showLabels) {
    wrapper = document.createElement('div');
    // Layout for the wrapper, value and labels is in input.css (#779: it was
    // written onto each element's style attribute).
    wrapper.className = 'x-range-wrapper';

    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    // Value display
    if (config.showValue) {
      valueDisplay = document.createElement('output');
      valueDisplay.className = 'x-range-value';
      valueDisplay.textContent = `${config.valuePrefix}${element.value}${config.valueSuffix}`;
      wrapper.insertBefore(valueDisplay, element);
    }

    // Min/Max labels
    if (config.showLabels) {
      const labelsContainer = document.createElement('div');
      labelsContainer.className = 'x-range-labels';

      minLabel = document.createElement('span');
      minLabel.textContent = element.min || '0';

      maxLabel = document.createElement('span');
      maxLabel.textContent = element.max || '100';

      labelsContainer.appendChild(minLabel);
      labelsContainer.appendChild(maxLabel);
      wrapper.appendChild(labelsContainer);
    }

    // Update value display on input
    const updateValue = () => {
      if (valueDisplay) {
        valueDisplay.textContent = `${config.valuePrefix}${element.value}${config.valueSuffix}`;
      }
    };

    element.addEventListener('input', updateValue);
    element._updateValue = updateValue;
  }

  return () => {
    element.classList.remove('x-range');
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
    if (element._updateValue) {
      element.removeEventListener('input', element._updateValue);
      delete element._updateValue;
    }
  };
}

export default { range };
