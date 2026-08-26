import { readAttr } from '../../core/read-attr.js';
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
    .x-radio-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
      vertical-align: middle;
    }
    
    .x-radio {
      accent-color: var(--primary, #6366f1);
      width: 1.125rem;
      height: 1.125rem;
      cursor: pointer;
      margin: 0;
      vertical-align: middle;
    }

    /* Variants */
    .x-radio--success { accent-color: var(--success-color, #22c55e); }
    .x-radio--warning { accent-color: var(--warning-color, #f59e0b); }
    .x-radio--danger { accent-color: var(--danger-color, #ef4444); }
    .x-radio--info { accent-color: var(--info-color, #3b82f6); }

    /* Sizes */
    .x-radio--sm { width: 0.875rem; height: 0.875rem; }
    .x-radio--lg { width: 1.5rem; height: 1.5rem; }
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
    label: options.label || element.getAttribute('label') || readAttr(element, 'label') || '',
    variant: options.variant || element.getAttribute('variant') || readAttr(element, 'variant') || '',
    size: options.size || element.getAttribute('size') || readAttr(element, 'size') || 'md',
    ...options
  };

  element.classList.add('x-radio');

  // Wrap in label if label text provided
  let wrapper = null;
  if (config.label && element.parentElement?.tagName !== 'LABEL') {
    wrapper = document.createElement('label');
    wrapper.className = 'x-radio-wrapper';
    
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    const labelText = document.createElement('span');
    labelText.className = 'x-radio-label';
    labelText.textContent = config.label;
    wrapper.appendChild(labelText);
  } else if (element.parentElement?.tagName === 'LABEL') {
    element.parentElement.classList.add('x-radio-wrapper');
  }

  // Apply size variant
  if (config.size) {
    element.classList.add(`x-radio--${config.size}`);
  }

  // Apply visual variant
  if (config.variant) {
    element.classList.add(`x-radio--${config.variant}`);
  }

  return () => {
    element.classList.remove('x-radio', `x-radio--${config.variant}`, `x-radio--${config.size}`);
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}

export default { radio };
