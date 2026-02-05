/**
 * Enhanced range slider with value display and labels.
 * - `[x-behavior="range"]` for `<input type="range">`.
 */
export function cc() {}

export function range(element, options = {}) {
  if (element.tagName !== 'INPUT' || element.type !== 'range') {
    console.warn('[range] Element must be an <input type="range">');
    return () => {};
  }

  const config = {
    showValue: options.showValue ?? element.hasAttribute('data-show-value'),
    showLabels: options.showLabels ?? element.hasAttribute('data-show-labels'),
    valuePrefix: options.valuePrefix || element.dataset.valuePrefix || '',
    valueSuffix: options.valueSuffix || element.dataset.valueSuffix || '',
    ...options
  };

  element.classList.add('wb-range');

  let wrapper = null;
  let valueDisplay = null;
  let minLabel = null;
  let maxLabel = null;

  // Wrap in container for value display and labels
  if (config.showValue || config.showLabels) {
    wrapper = document.createElement('div');
    wrapper.className = 'wb-range-wrapper';
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';

    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    // Value display
    if (config.showValue) {
      valueDisplay = document.createElement('output');
      valueDisplay.className = 'wb-range-value';
      valueDisplay.style.cssText = 'text-align:center;font-weight:500;color:var(--text-primary,#f9fafb);';
      valueDisplay.textContent = `${config.valuePrefix}${element.value}${config.valueSuffix}`;
      wrapper.insertBefore(valueDisplay, element);
    }

    // Min/Max labels
    if (config.showLabels) {
      const labelsContainer = document.createElement('div');
      labelsContainer.style.cssText = 'display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary,#9ca3af);';

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

  element.dataset.wbReady = 'range';

  return () => {
    element.classList.remove('wb-range');
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
