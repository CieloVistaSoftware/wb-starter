/**
 * Input - Enhanced <input> element
 * Adds clearable, prefix/suffix, validation variants
 * Helper Attribute: [x-behavior="input"]
 */
export function input(element, options = {}) {
  const config = {
    type: options.type || element.dataset.type || element.type || 'text',
    variant: options.variant || element.dataset.variant || '',
    size: options.size || element.dataset.size || 'md',
    clearable: options.clearable ?? element.hasAttribute('data-clearable'),
    prefix: options.prefix || element.dataset.prefix || element.dataset.icon || '',
    suffix: options.suffix || element.dataset.suffix || '',
    ...options
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'wb-input';
  // Wrapper takes full width to mimic the input's behavior
  wrapper.style.cssText = 'position:relative;display:flex;align-items:center;width:100%;';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  element.classList.add('wb-input__field');
  
  // Default styles for compliance
  Object.assign(element.style, {
    width: 'auto', // Let flex handle width
    flex: '1',     // Take remaining space
    minWidth: '0', // Prevent overflow
    border: '1px solid var(--border-color, #374151)',
    borderRadius: '6px',
    background: 'var(--bg-primary, #1f2937)',
    color: 'var(--text-primary, #f9fafb)',
    outline: 'none'
  });

  // Apply size
  const paddings = {
    xs: '0.125rem 0.5rem',
    sm: '0.25rem 0.75rem',
    md: '0.5rem 0.75rem',
    lg: '0.75rem 1rem',
    xl: '1rem 1.25rem'
  };
  element.style.padding = paddings[config.size] || paddings.md;
  
  if (config.size !== 'md') {
    wrapper.classList.add(`wb-input--${config.size}`);
    element.classList.add(`wb-input--${config.size}`);
  }
  
  if (config.variant === 'success') {
    element.style.borderColor = 'var(--success-color, #22c55e)';
    wrapper.classList.add('wb-input--success');
  } else if (config.variant === 'error') {
    element.style.borderColor = 'var(--danger-color, #ef4444)';
    wrapper.classList.add('wb-input--error');
  }

  if (config.prefix) {
    const pre = document.createElement('span');
    pre.className = 'wb-input__prefix';
    pre.style.cssText = 'padding:0 0.5rem;color:var(--text-secondary,#9ca3af);';
    pre.textContent = config.prefix;
    wrapper.insertBefore(pre, element);
  }

  if (config.suffix) {
    const suf = document.createElement('span');
    suf.className = 'wb-input__suffix';
    suf.style.cssText = 'padding:0 0.5rem;color:var(--text-secondary,#9ca3af);';
    suf.textContent = config.suffix;
    wrapper.appendChild(suf);
  }

  if (config.clearable) {
    const clear = document.createElement('button');
    clear.className = 'wb-input__clear';
    clear.type = 'button';
    clear.textContent = '×';
    clear.style.cssText = 'background:none;border:none;cursor:pointer;padding:0 0.5rem;font-size:1.25rem;color:var(--text-secondary,#9ca3af);';
    clear.onclick = () => { 
      element.value = ''; 
      element.focus(); 
      element.dispatchEvent(new Event('input', { bubbles: true }));
    };
    wrapper.appendChild(clear);
  }

  element.dataset.wbReady = 'input';
  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
    element.classList.remove('wb-input__field');
  };
}

export default input;
