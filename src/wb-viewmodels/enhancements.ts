/**
 * Form Enhancement Behaviors
 * -----------------------------------------------------------------------------
 * Enhances standard HTML form elements with better UX and validation.
 * Includes inputs, password toggles, search, and form validation.
 * 
 * Helper Attribute: [x-enhancements]
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <form x-form data-ajax>...</form>
 *   <input x-password>
 */

/**
 * Form - Enhanced form
 * Helper Attribute: [x-form]
 */
export function form(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    ajax: options.ajax ?? element.hasAttribute('data-ajax'),
    validate: options.validate ?? element.dataset.validate !== 'false',
    ...options
  };

  element.classList.add('wb-form');

  const formEl = element as HTMLFormElement;

  if (config.ajax) {
    element.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(formEl);
      
      element.dispatchEvent(new CustomEvent('wb:form:submit', { bubbles: true, detail: { formData } }));
      
      try {
        const response = await fetch(formEl.action || '', {
          method: (formEl.method || 'POST'),
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
    getData: () => Object.fromEntries(new FormData(formEl)),
    reset: () => formEl.reset(),
    submit: () => formEl.requestSubmit()
  };

  return () => element.classList.remove('wb-form');
}

/**
 * Fieldset - Form field group
 */
export function fieldset(element: HTMLElement, options: Record<string, any> = {}) {
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
export function label(element: HTMLElement, options: Record<string, any> = {}) {
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
export function help(element: HTMLElement, options: Record<string, any> = {}) {
  element.classList.add('wb-help');
  element.setAttribute('role', 'note');
  return () => element.classList.remove('wb-help');
}

/**
 * Error - Form error message
 */
export function error(element: HTMLElement, options: Record<string, any> = {}) {
  element.classList.add('wb-error');
  element.setAttribute('role', 'alert');
  return () => element.classList.remove('wb-error');
}

/**
 * InputGroup - Grouped inputs
 */
export function inputgroup(element: HTMLElement, options: Record<string, any> = {}) {
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
export function formrow(element: HTMLElement, options: Record<string, any> = {}) {
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
export function stepper(element: HTMLElement, options: Record<string, any> = {}) {
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
    const inputEl = ((element as any).wbInput?.inputElement as HTMLInputElement) ?? (element as HTMLInputElement);
    let value = parseFloat(inputEl.value) || 0;
    value = Math.max(config.min, Math.min(config.max, value + delta));
    // Prefer the typed API when available so any callers observing the API see updates
    if ((element as any).wbInput?.setValue) {
      (element as any).wbInput.setValue(String(value), true);
    } else {
      inputEl.value = String(value);
      inputEl.dispatchEvent(new Event('change'));
    }
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
export function search(element: HTMLElement, options: Record<string, any> = {}) {
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

  let timeout: number | undefined;
  if (config.instant) {
    const inputEl = ((element as any).wbInput?.inputElement as HTMLInputElement) ?? (element as HTMLInputElement);
    inputEl.oninput = () => {
      if (typeof timeout !== 'undefined') clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        inputEl.dispatchEvent(new CustomEvent('wb:search', { bubbles: true, detail: { query: inputEl.value } }));
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
 * Helper Attribute: [x-password]
 */
export function password(element: HTMLElement, options: Record<string, any> = {}) {
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
export function masked(element: HTMLElement, options: Record<string, any> = {}) {
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
export function counter(element: HTMLElement, options: Record<string, any> = {}) {
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
    counter.textContent = config.max ? `${len}/${config.max}` : String(len);
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
export function floatinglabel(element: HTMLElement, options: Record<string, any> = {}) {
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
    wrapper.classList.toggle('wb-floating-label--active', !!((element as HTMLInputElement).value) || document.activeElement === element);
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

/**
 * OTP - One Time Password Input
 */
export function otp(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    length: parseInt(options.length || element.dataset.length || '6'),
    ...options
  };

  element.classList.add('wb-otp');
  element.innerHTML = '';
  element.style.display = 'flex';
  element.style.gap = '0.5rem';

  const inputs = [];
  for (let i = 0; i < config.length; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'wb-otp__input';
    input.style.cssText = 'width:2.5rem;height:3rem;text-align:center;font-size:1.25rem;border:1px solid var(--border-color,#374151);border-radius:6px;background:var(--bg-secondary,#1f2937);color:var(--text-primary,#f9fafb);';
    
    input.oninput = (e) => {
      const val = (e.target as HTMLInputElement).value.replace(/\D/g, '');
      (e.target as HTMLInputElement).value = val;
      if (val && i < config.length - 1) inputs[i + 1].focus();
      checkComplete();
    };

    input.onkeydown = (e) => {
      if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && i > 0) {
        inputs[i - 1].focus();
      }
    };

    input.onpaste = (e) => {
      e.preventDefault();
      const data = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      for (let j = 0; j < Math.min(data.length, config.length - i); j++) {
        inputs[i + j].value = data[j];
      }
      if (i + data.length < config.length) {
        inputs[i + data.length].focus();
      } else {
        inputs[config.length - 1].focus();
      }
      checkComplete();
    };

    inputs.push(input);
    element.appendChild(input);
  }

  function checkComplete() {
    const value = inputs.map(i => i.value).join('');
    if (value.length === config.length) {
      element.dispatchEvent(new CustomEvent('wb:otp:complete', { bubbles: true, detail: { value } }));
    }
  }

  return () => element.innerHTML = '';
}

/**
 * Color Picker - Enhanced color input
 */
export function colorpicker(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    value: options.value || element.value || '#000000',
    ...options
  };

  // If element is input, use it, otherwise create one
  let input = element;
  if (element.tagName !== 'INPUT') {
    input = document.createElement('input');
    input.type = 'color';
    element.appendChild(input);
  } else {
    input.type = 'color';
  }
  
  input.value = config.value;
  input.classList.add('wb-colorpicker');
  input.style.cssText = 'width:3rem;height:3rem;padding:0;border:none;border-radius:6px;cursor:pointer;background:none;';

  return () => {
    input.classList.remove('wb-colorpicker');
    if (element !== input) input.remove();
  };
}

/**
 * Tags - Tag input
 * Helper Attribute: [x-tags]
 */
export function tags(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    editable: options.editable ?? element.hasAttribute('data-editable'),
    placeholder: options.placeholder || 'Add tag...',
    ...options
  };

  element.classList.add('wb-tags');
  element.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.5rem;border:1px solid var(--border-color,#374151);border-radius:6px;background:var(--bg-secondary,#1f2937);min-height:2.5rem;';

  const renderTags = () => {
    // Keep input if exists
    const input = element.querySelector('input');
    element.innerHTML = '';
    
    config.items.forEach((item, i) => {
      const tag = document.createElement('span');
      tag.className = 'wb-tag';
      tag.style.cssText = 'display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.5rem;background:var(--primary,#6366f1);color:white;border-radius:4px;font-size:0.875rem;';
      tag.innerHTML = `<span>${item}</span>`;
      
      if (config.editable) {
        const remove = document.createElement('button');
        remove.textContent = '×';
        remove.style.cssText = 'background:none;border:none;color:white;cursor:pointer;padding:0;font-size:1rem;line-height:1;opacity:0.8;';
        remove.onclick = () => {
          config.items.splice(i, 1);
          renderTags();
        };
        tag.appendChild(remove);
      }
      element.appendChild(tag);
    });

    if (config.editable) {
      if (input) {
        element.appendChild(input);
        input.focus();
      } else {
        const newInput = document.createElement('input');
        newInput.placeholder = config.placeholder;
        newInput.style.cssText = 'border:none;background:transparent;color:var(--text-primary,#f9fafb);outline:none;flex:1;min-width:60px;font-size:0.875rem;';
        
        newInput.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = newInput.value.trim();
            if (val) {
              config.items.push(val);
              renderTags();
            }
          } else if (e.key === 'Backspace' && !newInput.value && config.items.length) {
            config.items.pop();
            renderTags();
          }
        };
        element.appendChild(newInput);
      }
    }
  };

  renderTags();

  return () => element.innerHTML = '';
}

/**
 * Autocomplete - Input with suggestions
 */
export function autocomplete(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(','),
    ...options
  };

  const listId = 'wb-autocomplete-' + Math.random().toString(36).substr(2, 9);
  element.setAttribute('list', listId);

  const datalist = document.createElement('datalist');
  datalist.id = listId;
  
  config.items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.trim();
    datalist.appendChild(option);
  });

  document.body.appendChild(datalist);

  return () => {
    element.removeAttribute('list');
    datalist.remove();
  };
}

/**
 * File - Enhanced file input
 * Helper Attribute: [x-file]
 */
export function file(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    multiple: options.multiple ?? element.hasAttribute('data-multiple'),
    accept: options.accept || element.dataset.accept || '',
    ...options
  };

  element.classList.add('wb-file');
  element.style.display = 'none'; // Hide original container if it's a div

  // Create hidden input
  const input = document.createElement('input');
  input.type = 'file';
  if (config.multiple) input.multiple = true;
  if (config.accept) input.accept = config.accept;
  input.style.display = 'none';
  element.appendChild(input);

  // Create UI
  const dropzone = document.createElement('div');
  dropzone.className = 'wb-file-dropzone';
  dropzone.style.cssText = 'border:2px dashed var(--border-color,#374151);border-radius:8px;padding:2rem;text-align:center;cursor:pointer;transition:all 0.2s;background:var(--bg-secondary,#1f2937);';
  dropzone.innerHTML = `
    <div style="font-size:2rem;margin-bottom:0.5rem;">📁</div>
    <div style="color:var(--text-primary,#f9fafb);font-weight:500;">Click or drag files here</div>
    <div style="color:var(--text-secondary,#9ca3af);font-size:0.875rem;margin-top:0.25rem;">${config.accept || 'Any file'}</div>
  `;

  dropzone.onclick = () => input.click();

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary,#6366f1)';
    dropzone.style.background = 'rgba(99,102,241,0.1)';
  };

  dropzone.ondragleave = () => {
    dropzone.style.borderColor = 'var(--border-color,#374151)';
    dropzone.style.background = 'var(--bg-secondary,#1f2937)';
  };

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color,#374151)';
    dropzone.style.background = 'var(--bg-secondary,#1f2937)';
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      updateLabel();
    }
  };

  input.onchange = updateLabel;

  function updateLabel() {
    if (input.files.length) {
      const names = Array.from(input.files).map(f => f.name).join(', ');
      
      // Show uploading state
      dropzone.innerHTML = `
        <div style="font-size:2rem;margin-bottom:0.5rem;">⏳</div>
        <div style="color:var(--text-primary,#f9fafb);font-weight:500;">Uploading...</div>
        <div class="wb-file-progress" style="width:100%;height:4px;background:var(--bg-tertiary,#374151);margin-top:1rem;border-radius:2px;overflow:hidden;">
          <div style="width:0%;height:100%;background:var(--primary,#6366f1);transition:width 1.5s ease-out;"></div>
        </div>
      `;
      
      // Simulate upload
      setTimeout(() => {
        const progressBar = dropzone.querySelector('.wb-file-progress div');
        if (progressBar) progressBar.style.width = '100%';
        
        setTimeout(() => {
          dropzone.innerHTML = `
            <div style="font-size:2rem;margin-bottom:0.5rem;color:var(--success,#22c55e);">✅</div>
            <div style="color:var(--text-primary,#f9fafb);font-weight:500;">${input.files.length} file(s) uploaded</div>
            <div style="color:var(--text-secondary,#9ca3af);font-size:0.875rem;margin-top:0.25rem;word-break:break-all;">
              Location: <span style="color:var(--primary,#6366f1);cursor:pointer;">/uploads/${names}</span>
            </div>
          `;
        }, 1500);
      }, 100);
    }
  }

  element.parentNode.insertBefore(dropzone, element);
  // We keep element in DOM but hidden to hold state/events if needed, or just use dropzone as replacement
  element.style.display = 'none';

  return () => {
    dropzone.remove();
    element.style.display = '';
  };
}

export default { 
  form, fieldset, label, help, error, inputgroup, formrow, 
  stepper, search, password, masked, counter, floatinglabel,
  otp, colorpicker, tags, autocomplete, file
};
