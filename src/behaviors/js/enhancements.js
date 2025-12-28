/**
 * Form Enhancement Behaviors
 */

/**
 * Form - Enhanced form
 */
export function form(element, options = {}) {
  const config = {
    ajax: options.ajax ?? element.hasAttribute('data-ajax'),
    validate: options.validate ?? element.dataset.validate !== 'false',
    ...options
  };

  element.classList.add('wb-form');

  if (config.ajax) {
    element.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(element);
      
      element.dispatchEvent(new CustomEvent('wb:form:submit', { bubbles: true, detail: { formData } }));
      
      try {
        const response = await fetch(element.action, {
          method: element.method || 'POST',
          body: formData
        });
        const data = await response.json();
        element.dispatchEvent(new CustomEvent('wb:form:success', { bubbles: true, detail: { data } }));
      } catch (error) {
        element.dispatchEvent(new CustomEvent('wb:form:error', { bubbles: true, detail: { error } }));
      }
    };
  }

  element.wbForm = {
    getData: () => Object.fromEntries(new FormData(element)),
    reset: () => element.reset(),
    submit: () => element.requestSubmit()
  };

  return () => element.classList.remove('wb-form');
}

/**
 * Fieldset - Form field group
 */
export function fieldset(element, options = {}) {
  const config = {
    collapsible: options.collapsible ?? element.hasAttribute('data-collapsible'),
    collapsed: options.collapsed ?? element.hasAttribute('data-collapsed'),
    ...options
  };

  element.classList.add('wb-fieldset');

  const legend = element.querySelector('legend');
  if (legend && config.collapsible) {
    legend.classList.add('wb-fieldset__legend', 'wb-fieldset__legend--collapsible');
    
    if (config.collapsed) element.classList.add('wb-fieldset--collapsed');
    
    legend.onclick = () => {
      element.classList.toggle('wb-fieldset--collapsed');
    };
  }

  return () => element.classList.remove('wb-fieldset');
}

/**
 * Label - Form label
 */
export function label(element, options = {}) {
  const config = {
    required: options.required ?? element.hasAttribute('data-required'),
    optional: options.optional ?? element.hasAttribute('data-optional'),
    ...options
  };

  element.classList.add('wb-label');
  if (config.required) element.classList.add('wb-label--required');
  if (config.optional) element.classList.add('wb-label--optional');

  return () => element.classList.remove('wb-label');
}

/**
 * Help - Form help text
 */
export function help(element, options = {}) {
  element.classList.add('wb-help');
  element.setAttribute('role', 'note');
  return () => element.classList.remove('wb-help');
}

/**
 * Error - Form error message
 */
export function error(element, options = {}) {
  element.classList.add('wb-error');
  element.setAttribute('role', 'alert');
  return () => element.classList.remove('wb-error');
}

/**
 * InputGroup - Grouped inputs
 */
export function inputgroup(element, options = {}) {
  element.classList.add('wb-input-group');
  
  const prepend = element.querySelector('[data-prepend]');
  const append = element.querySelector('[data-append]');
  
  if (prepend) prepend.classList.add('wb-input-group__prepend');
  if (append) append.classList.add('wb-input-group__append');

  return () => element.classList.remove('wb-input-group');
}

/**
 * FormRow - Form row layout
 */
export function formrow(element, options = {}) {
  const config = {
    inline: options.inline ?? element.hasAttribute('data-inline'),
    ...options
  };

  element.classList.add('wb-form-row');
  if (config.inline) element.classList.add('wb-form-row--inline');

  return () => element.classList.remove('wb-form-row');
}

/**
 * Stepper - Number stepper
 */
export function stepper(element, options = {}) {
  const config = {
    min: parseFloat(options.min ?? element.dataset.min ?? '-Infinity'),
    max: parseFloat(options.max ?? element.dataset.max ?? 'Infinity'),
    step: parseFloat(options.step || element.dataset.step || '1'),
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

/**
 * Search - Search input
 */
export function search(element, options = {}) {
  const config = {
    expandable: options.expandable ?? element.hasAttribute('data-expandable'),
    instant: options.instant ?? element.hasAttribute('data-instant'),
    debounce: parseInt(options.debounce || element.dataset.debounce || '300'),
    ...options
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'wb-search';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  element.classList.add('wb-search__input');
  element.type = 'search';

  const icon = document.createElement('span');
  icon.className = 'wb-search__icon';
  icon.textContent = '🔍';
  wrapper.insertBefore(icon, element);

  let timeout;
  if (config.instant) {
    element.oninput = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        element.dispatchEvent(new CustomEvent('wb:search', { bubbles: true, detail: { query: element.value } }));
      }, config.debounce);
    };
  }

  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
  };
}

/**
 * Password - Password input with toggle at end of input, same height
 */
export function password(element, options = {}) {
  const config = {
    toggle: options.toggle ?? element.dataset.toggle !== 'false',
    strength: options.strength ?? element.hasAttribute('data-strength'),
    ...options
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'wb-password';
  wrapper.style.cssText = 'position:relative;display:flex;align-items:stretch;width:100%;';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  element.classList.add('wb-password__input');
  
  // Style input to have room for toggle button
  element.style.cssText = `
    flex:1;
    padding-right:2.5rem;
    border:1px solid var(--border-color,#374151);
    border-radius:6px;
    background:var(--bg-secondary,#1f2937);
    color:var(--text-primary,#f9fafb);
    font-size:0.875rem;
    height:2.5rem;
    padding-left:0.75rem;
    width:100%;
  `;

  if (config.toggle) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'wb-password__toggle';
    toggleBtn.style.cssText = `
      position:absolute;
      right:0;
      top:0;
      height:100%;
      width:2.5rem;
      border:none;
      background:transparent;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:1rem;
      opacity:0.6;
      transition:opacity 0.15s;
    `;
    toggleBtn.textContent = '👁️';
    toggleBtn.title = 'Show password';
    
    toggleBtn.onclick = () => {
      const isPassword = element.type === 'password';
      element.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
      toggleBtn.title = isPassword ? 'Hide password' : 'Show password';
    };
    
    toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.opacity = '1');
    toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.opacity = '0.6');
    
    wrapper.appendChild(toggleBtn);
  }

  if (config.strength) {
    const meter = document.createElement('div');
    meter.className = 'wb-password__strength';
    meter.style.cssText = `
      position:absolute;
      bottom:-4px;
      left:0;
      right:0;
      height:3px;
      background:var(--bg-tertiary,#374151);
      border-radius:2px;
      overflow:hidden;
    `;
    
    const bar = document.createElement('div');
    bar.style.cssText = `
      height:100%;
      width:0%;
      transition:width 0.3s, background 0.3s;
      border-radius:2px;
    `;
    meter.appendChild(bar);
    wrapper.appendChild(meter);
    
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e'];
    
    element.addEventListener('input', () => {
      const score = getPasswordStrength(element.value);
      bar.style.width = `${score * 25}%`;
      bar.style.background = colors[score - 1] || colors[0];
    });
  }

  element.dataset.wbReady = 'password';
  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
    element.classList.remove('wb-password__input');
    element.style.cssText = '';
  };
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

/**
 * Masked - Masked input for formatted data entry
 * Uses '9' as placeholder for digits, other chars are literals
 * Example: data-mask="(999) 999-9999" for phone numbers
 */
export function masked(element, options = {}) {
  const config = {
    mask: options.mask || element.dataset.mask || '',
    placeholder: options.placeholder || element.dataset.maskPlaceholder || '_',
    ...options
  };

  element.classList.add('wb-masked');

  if (!config.mask) return () => element.classList.remove('wb-masked');

  // Show mask as placeholder hint
  if (!element.placeholder) {
    element.placeholder = config.mask.replace(/9/g, config.placeholder);
  }

  const applyMask = () => {
    // Extract only digits from current value
    const digits = element.value.replace(/\D/g, '');
    let result = '';
    let digitIndex = 0;
    
    // Build masked value
    for (let i = 0; i < config.mask.length && digitIndex < digits.length; i++) {
      if (config.mask[i] === '9') {
        // This position accepts a digit
        result += digits[digitIndex++];
      } else {
        // This is a literal character - add it
        result += config.mask[i];
        // If user typed this literal, skip it in digits
        if (digits[digitIndex] === config.mask[i]) {
          digitIndex++;
        }
      }
    }
    
    element.value = result;
  };

  // Handle input - apply mask after each keystroke
  element.addEventListener('input', applyMask);
  
  // Handle keydown for better UX
  element.addEventListener('keydown', (e) => {
    // Allow navigation and control keys
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) {
      return;
    }
    
    // Only allow digits
    if (!/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  });

  // Handle paste
  element.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const pastedDigits = pastedText.replace(/\D/g, '');
    
    // Insert digits at cursor position
    const start = element.selectionStart;
    const currentDigits = element.value.replace(/\D/g, '');
    const beforeCursor = currentDigits.slice(0, getDigitIndex(element.value, start));
    const afterCursor = currentDigits.slice(getDigitIndex(element.value, start));
    
    element.value = beforeCursor + pastedDigits + afterCursor;
    applyMask();
  });

  // Helper to get digit index from cursor position
  function getDigitIndex(value, cursorPos) {
    let digitCount = 0;
    for (let i = 0; i < cursorPos && i < value.length; i++) {
      if (/\d/.test(value[i])) digitCount++;
    }
    return digitCount;
  }

  // Apply mask if there's an initial value
  if (element.value) applyMask();

  return () => {
    element.classList.remove('wb-masked');
  };
}

/**
 * Counter - Character counter
 */
export function counter(element, options = {}) {
  const config = {
    max: parseInt(options.max || element.dataset.max || element.maxLength || '0'),
    warning: parseInt(options.warning || element.dataset.warning || '0'),
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

/**
 * Floating Label - Floating label effect
 */
export function floatinglabel(element, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-floating-label';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  const label = document.createElement('label');
  label.className = 'wb-floating-label__label';
  label.textContent = element.placeholder || element.dataset.label || '';
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

export default { 
  form, fieldset, label, help, error, inputgroup, formrow, 
  stepper, search, password, masked, counter, floatinglabel 
};
