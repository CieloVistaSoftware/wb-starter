/**
 * Search Component
 * Complete search input with icon, clear button, and debounced events
 */
export function search(element, options = {}) {
  const config = {
    placeholder: options.placeholder || element.getAttribute('placeholder') || 'Search...',
    value: options.value || element.getAttribute('value') || '',
    name: options.name || element.getAttribute('name') || '',
    debounce: parseInt(options.debounce || element.dataset.debounce || '300'),
    instant: options.instant ?? element.hasAttribute('instant'),
    disabled: options.disabled ?? element.hasAttribute('disabled'),
    size: options.size || element.getAttribute('size') || 'md',
    variant: options.variant || element.getAttribute('variant') || 'default',
    icon: options.icon || element.getAttribute('icon') || '🔍',
    clearable: options.clearable ?? element.getAttribute('clearable') !== 'false',
    loading: options.loading ?? element.hasAttribute('loading'),
    ...options
  };

  // Apply base classes
  element.classList.add('wb-search');

  if (config.size !== 'md') {
    element.classList.add(`wb-search--${config.size}`);
  }

  if (config.variant !== 'default') {
    element.classList.add(`wb-search--${config.variant}`);
  }

  if (config.disabled) {
    element.classList.add('wb-search--disabled');
  }

  if (config.loading) {
    element.classList.add('wb-search--loading');
  }

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-search__wrapper';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  // Create icon
  const icon = document.createElement('span');
  icon.className = 'wb-search__icon';
  icon.textContent = config.icon;
  wrapper.insertBefore(icon, element);

  // Configure input
  element.type = 'search';
  element.placeholder = config.placeholder;
  element.value = config.value;
  element.name = config.name;
  element.disabled = config.disabled;
  element.classList.add('wb-search__input');

  // Create clear button
  let clearBtn = null;
  if (config.clearable) {
    clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'wb-search__clear';
    clearBtn.textContent = '✕';
    clearBtn.title = 'Clear search';
    clearBtn.style.display = config.value ? 'block' : 'none';
    wrapper.appendChild(clearBtn);

    clearBtn.onclick = () => {
      element.value = '';
      element.focus();
      clearBtn.style.display = 'none';
      element.dispatchEvent(new CustomEvent('wb:search:clear', { bubbles: true }));
      element.dispatchEvent(new CustomEvent('wb:search', {
        bubbles: true,
        detail: { query: '', instant: true }
      }));
    };
  }

  // Create loading indicator
  let loadingSpan = null;
  if (config.loading) {
    loadingSpan = document.createElement('span');
    loadingSpan.className = 'wb-search__loading';
    loadingSpan.textContent = '⏳';
    wrapper.appendChild(loadingSpan);
  }

  // Debounced search handler
  let timeout;
  const triggerSearch = (instant = false) => {
    const query = element.value;
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }

    element.dispatchEvent(new CustomEvent('input', {
      bubbles: true,
      detail: { value: query }
    }));

    if (config.instant || instant) {
      element.dispatchEvent(new CustomEvent('wb:search', {
        bubbles: true,
        detail: { query, instant: true }
      }));
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        element.dispatchEvent(new CustomEvent('wb:search', {
          bubbles: true,
          detail: { query, instant: false }
        }));
      }, config.debounce);
    }
  };

  // Event listeners
  element.oninput = () => triggerSearch();
  element.onfocus = () => element.dispatchEvent(new CustomEvent('focus', { bubbles: true }));
  element.onblur = () => element.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
  
  // Keyboard navigation
  element.onkeydown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      element.dispatchEvent(new CustomEvent('wb:search:navigate', {
        bubbles: true,
        detail: { direction: 'down' }
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      element.dispatchEvent(new CustomEvent('wb:search:navigate', {
        bubbles: true,
        detail: { direction: 'up' }
      }));
    } else if (e.key === 'Enter') {
      element.dispatchEvent(new CustomEvent('wb:search:select', {
        bubbles: true,
        detail: { query: element.value }
      }));
    } else if (e.key === 'Escape') {
      element.dispatchEvent(new CustomEvent('wb:search:escape', {
        bubbles: true
      }));
    }
  };

  // Handle initial value
  if (config.value && clearBtn) {
    clearBtn.style.display = 'block';
  }

  // Public API
  return {
    getValue: () => element.value,
    setValue: (value) => {
      element.value = value;
      if (clearBtn) {
        clearBtn.style.display = value ? 'block' : 'none';
      }
      triggerSearch(true);
    },
    clear: () => {
      element.value = '';
      if (clearBtn) {
        clearBtn.style.display = 'none';
      }
      element.dispatchEvent(new CustomEvent('wb:search:clear', { bubbles: true }));
      element.dispatchEvent(new CustomEvent('wb:search', {
        bubbles: true,
        detail: { query: '', instant: true }
      }));
    },
    focus: () => element.focus(),
    blur: () => element.blur(),
    search: () => triggerSearch(true),
    setLoading: (loading) => {
      config.loading = loading;
      element.classList.toggle('wb-search--loading', loading);
      if (loadingSpan) {
        loadingSpan.style.display = loading ? 'block' : 'none';
      }
    },
    destroy: () => {
      clearTimeout(timeout);
      if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(element, wrapper);
        wrapper.remove();
      }
      element.classList.remove('wb-search', `wb-search--${config.size}`, `wb-search--${config.variant}`, 'wb-search--disabled', 'wb-search--loading');
      element.classList.remove('wb-search__input');
    }
  };
}

export default { search };