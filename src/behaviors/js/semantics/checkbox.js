/**
 * Checkbox - Enhanced <input type="checkbox"> element
 * Adds visual enhancements, labels, indeterminate state
 */

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    .wb-checkbox-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
      vertical-align: middle;
    }
    
    .wb-checkbox-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      margin: 0;
      pointer-events: none;
    }
    
    .wb-checkbox__box {
      width: 1.125rem;
      height: 1.125rem;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 4px;
      background-color: var(--bg-primary, #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      position: relative;
    }

    /* Checked State */
    .wb-checkbox-input:checked + .wb-checkbox__box {
      background-color: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
      background-size: 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* Indeterminate State */
    .wb-checkbox-input:indeterminate + .wb-checkbox__box {
      background-color: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='3' y='7' width='10' height='2' rx='1'/%3e%3c/svg%3e");
      background-size: 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* Focus State */
    .wb-checkbox-input:focus-visible + .wb-checkbox__box {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
      border-color: var(--primary, #6366f1);
    }

    /* Disabled State */
    .wb-checkbox-input:disabled + .wb-checkbox__box {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--bg-secondary, #f3f4f6);
    }
    .wb-checkbox-wrapper:has(:disabled) {
      cursor: not-allowed;
      opacity: 0.7;
    }

    /* Sizes */
    .wb-checkbox--sm + .wb-checkbox__box {
      width: 0.875rem;
      height: 0.875rem;
    }
    .wb-checkbox--lg + .wb-checkbox__box {
      width: 1.5rem;
      height: 1.5rem;
    }

    /* Variants */
    .wb-checkbox--success:checked + .wb-checkbox__box,
    .wb-checkbox--success:indeterminate + .wb-checkbox__box {
      background-color: var(--success-color, #22c55e);
      border-color: var(--success-color, #22c55e);
    }
    .wb-checkbox--success:focus-visible + .wb-checkbox__box {
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
    }

    .wb-checkbox--warning:checked + .wb-checkbox__box,
    .wb-checkbox--warning:indeterminate + .wb-checkbox__box {
      background-color: var(--warning-color, #f59e0b);
      border-color: var(--warning-color, #f59e0b);
    }
    .wb-checkbox--warning:focus-visible + .wb-checkbox__box {
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
    }

    .wb-checkbox--danger:checked + .wb-checkbox__box,
    .wb-checkbox--danger:indeterminate + .wb-checkbox__box {
      background-color: var(--danger-color, #ef4444);
      border-color: var(--danger-color, #ef4444);
    }
    .wb-checkbox--danger:focus-visible + .wb-checkbox__box {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function checkbox(element, options = {}) {
  if (element.tagName !== 'INPUT' || element.type !== 'checkbox') {
    console.warn('[checkbox] Element must be an <input type="checkbox">');
    return () => {};
  }

  // Inject styles
  injectStyles();

  const config = {
    label: options.label || element.dataset.label || '',
    variant: options.variant || element.dataset.variant || '',
    size: options.size || element.dataset.size || 'md',
    indeterminate: options.indeterminate ?? element.hasAttribute('data-indeterminate'),
    ...options
  };

  element.classList.add('wb-checkbox-input');

  // Set indeterminate state
  if (config.indeterminate) {
    element.indeterminate = true;
  }

  // Wrap in label for consistent structure
  let wrapper = element.parentElement;
  
  // Handle detached element or missing wrapper
  if (!wrapper || (wrapper.tagName !== 'LABEL' && !wrapper.classList.contains('wb-checkbox-wrapper'))) {
    const newWrapper = document.createElement('label');
    newWrapper.className = 'wb-checkbox-wrapper';
    
    if (wrapper) {
      wrapper.insertBefore(newWrapper, element);
    }
    newWrapper.appendChild(element);
    wrapper = newWrapper;
  } else {
    // Ensure class is present if it is a label
    wrapper.classList.add('wb-checkbox-wrapper');
  }

  // Visual checkbox box (custom style)
  let box = wrapper.querySelector('.wb-checkbox__box');
  if (!box) {
    box = document.createElement('span');
    box.className = 'wb-checkbox__box';
    // Insert after input
    if (element.nextSibling) {
      wrapper.insertBefore(box, element.nextSibling);
    } else {
      wrapper.appendChild(box);
    }
  }

  if (config.label) {
    let labelText = wrapper.querySelector('.wb-checkbox-label');
    if (!labelText) {
      labelText = document.createElement('span');
      labelText.className = 'wb-checkbox-label';
      wrapper.appendChild(labelText);
    }
    labelText.textContent = config.label;
  }

  // Apply size variant class to input (CSS handles the rest via sibling selector)
  if (config.size) {
    element.classList.add(`wb-checkbox--${config.size}`);
  }

  // Apply visual variant class to input
  if (config.variant) {
    element.classList.add(`wb-checkbox--${config.variant}`);
  }

  element.dataset.wbReady = 'checkbox';

  return () => {
    element.classList.remove('wb-checkbox-input', `wb-checkbox--${config.variant}`, `wb-checkbox--${config.size}`);
    if (wrapper && wrapper.parentNode) {
      // Unwrap logic if needed, or just leave it as it's cleaner
    }
  };
}

export default { checkbox };
