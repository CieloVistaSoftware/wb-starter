/**
 * Enhanced `<select>` element with searchable and clearable options.
 * - Styled dropdown with `[x-behavior="select"]`.
 */
export function cc() {}

export function select(element, options = {}) {
  const config = {
    searchable: options.searchable ?? element.hasAttribute('data-searchable'),
    clearable: options.clearable ?? element.hasAttribute('data-clearable'),
    multiple: options.multiple ?? element.hasAttribute('multiple'),
    variant: options.variant || element.dataset.variant || 'default',
    size: options.size || element.dataset.size || 'md',
    placeholder: options.placeholder || element.dataset.placeholder || 'Select...',
    ...options
  };

  element.classList.add('wb-select');
  
  // Apply variant
  if (config.variant !== 'default') {
    element.classList.add(`wb-select--${config.variant}`);
  }

  // Apply size
  if (config.size !== 'md') {
    element.classList.add(`wb-select--${config.size}`);
    
    // Adjust padding based on size
    const paddings = {
      xs: '0.125rem 0.5rem',
      sm: '0.25rem 0.5rem',
      md: '0.5rem 0.75rem',
      lg: '0.75rem 1rem',
      xl: '1rem 1.25rem'
    };
    element.style.padding = paddings[config.size] || paddings.md;
  }

  element.setAttribute('role', 'combobox');
  
  // Basic styling
  Object.assign(element.style, {
    borderRadius: '6px',
    border: '1px solid var(--border-color, #374151)',
    background: 'var(--bg-secondary, #1f2937)',
    color: 'var(--text-primary, #f9fafb)',
    cursor: 'pointer'
  });

  if (config.searchable) {
    element.classList.add('wb-select--searchable');
    // For full searchable functionality, consider using a custom dropdown
  }

  if (config.clearable) {
    // Wrap to add clear button
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-select-wrapper';
    wrapper.style.cssText = 'position:relative;display:inline-block;width:100%;';
    
    if (element.parentNode) {
      element.parentNode.insertBefore(wrapper, element);
    }
    wrapper.appendChild(element);
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'wb-select__clear';
    clearBtn.type = 'button';
    clearBtn.innerHTML = '×';
    clearBtn.style.cssText = 'position:absolute;right:2rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-secondary,#9ca3af);font-size:1.25rem;padding:0;line-height:1;';
    
    clearBtn.onclick = (e) => {
      e.stopPropagation();
      element.selectedIndex = -1;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    
    wrapper.appendChild(clearBtn);
    element.classList.add('wb-select--clearable');
  }

  // API
  element.wbSelect = {
    getValue: () => element.value,
    setValue: (v) => { element.value = v; },
    getSelectedOptions: () => Array.from(element.selectedOptions),
    clear: () => { element.selectedIndex = -1; }
  };

  element.dataset.wbReady = 'select';
  return () => element.classList.remove('wb-select', 'wb-select--searchable');
}

export default { select };
