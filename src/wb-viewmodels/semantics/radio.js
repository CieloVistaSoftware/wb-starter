/**
 * Radio - Enhanced <input type="radio"> element
 * Adds visual enhancements, labels, radio groups
 * Helper Attribute: [x-behavior="radio"]
 */

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    .wb-radio-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
      vertical-align: middle;
    }
    
    .wb-radio {
      accent-color: var(--primary, #6366f1);
      width: 1.125rem;
      height: 1.125rem;
      cursor: pointer;
      margin: 0;
      vertical-align: middle;
    }

    /* Variants */
    .wb-radio--success { accent-color: var(--success-color, #22c55e); }
    .wb-radio--warning { accent-color: var(--warning-color, #f59e0b); }
    .wb-radio--danger { accent-color: var(--danger-color, #ef4444); }
    .wb-radio--info { accent-color: var(--info-color, #3b82f6); }

    /* Sizes */
    .wb-radio--sm { width: 0.875rem; height: 0.875rem; }
    .wb-radio--lg { width: 1.5rem; height: 1.5rem; }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function radio(element, options = {}) {
  if (element.tagName !== 'INPUT' || element.type !== 'radio') {
    console.warn('[radio] Element must be an <input type="radio">');
    return () => {};
  }

  // Inject styles
  injectStyles();

  const config = {
    label: options.label || element.dataset.label || '',
    variant: options.variant || element.dataset.variant || '',
    size: options.size || element.dataset.size || 'md',
    ...options
  };

  element.classList.add('wb-radio');

  // Wrap in label if label text provided
  let wrapper = null;
  if (config.label && element.parentElement?.tagName !== 'LABEL') {
    wrapper = document.createElement('label');
    wrapper.className = 'wb-radio-wrapper';
    
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    const labelText = document.createElement('span');
    labelText.className = 'wb-radio-label';
    labelText.textContent = config.label;
    wrapper.appendChild(labelText);
  } else if (element.parentElement?.tagName === 'LABEL') {
    element.parentElement.classList.add('wb-radio-wrapper');
  }

  // Apply size variant
  if (config.size) {
    element.classList.add(`wb-radio--${config.size}`);
  }

  // Apply visual variant
  if (config.variant) {
    element.classList.add(`wb-radio--${config.variant}`);
  }

  element.classList.add('wb-ready');

  return () => {
    element.classList.remove('wb-radio', `wb-radio--${config.variant}`, `wb-radio--${config.size}`);
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}

export default { radio };
