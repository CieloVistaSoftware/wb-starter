/**
 * Search Component
 * Complete search input with icon, clear button, and debounced events
 */
export function search(element, options = {}) {
  // Guard against re-wrapping an element that's already wrapped -- confirmed
  // live this ran twice on the same <input x-search>, nesting a second
  // wb-search__wrapper around the first (with input()'s wrapper sandwiched
  // between them, "concentric rings"). Whatever re-triggers it (a
  // MutationObserver seeing the wrapper insertion as a fresh node, most
  // likely), re-wrapping an already-wrapped element is never correct.
  if (element.closest('.wb-search__wrapper')) {
    return () => {};
  }

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
  // dispatchInputEvent exists so PROGRAMMATIC callers (setValue()/search(),
  // below) can notify listeners of a value change that didn't come from a
  // real keystroke -- element.value = x doesn't fire native 'input' on its
  // own. But element.oninput (real typing, below) already got a real
  // 'input' event to reach here; re-dispatching a SECOND 'input' from
  // inside its own oninput handler re-triggers that same handler forever
  // (confirmed live: crashed the tab with a stack overflow on the very
  // first keystroke in any x-search input).
  const triggerSearch = (instant = false, dispatchInputEvent = true) => {
    const query = element.value;
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }

    if (dispatchInputEvent) {
      element.dispatchEvent(new CustomEvent('input', {
        bubbles: true,
        detail: { value: query }
      }));
    }

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
  element.oninput = () => triggerSearch(false, false);
  // Native 'focus'/'blur' don't bubble, so this dispatched a bubbling
  // stand-in for listeners elsewhere in the app -- but dispatching that
  // SAME event type ('focus') on the element from inside its own onfocus
  // handler re-triggers onfocus again, which dispatches another 'focus',
  // forever: infinite recursion, crashed the tab with a stack overflow the
  // instant a real user clicked into any x-search input (confirmed live).
  // Namespaced custom events (wb:{behavior}:{action}, used throughout
  // card.js) can't collide with the native focus/blur dispatch path.
  element.onfocus = () => element.dispatchEvent(new CustomEvent('wb:search:focus', { bubbles: true }));
  element.onblur = () => element.dispatchEvent(new CustomEvent('wb:search:blur', { bubbles: true }));
  
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

/**
 * Search Field (container form)
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-search> — a CONTAINER, not an input itself. Finds (or
 * creates) a child <input>, applies search() to that input, and exposes the
 * imperative API on the container as `element.wbSearch` (mirrors the pattern
 * collapse() uses for `element.wbCollapse`) so external code can still call
 * `document.querySelector('wb-search').wbSearch.clear()` etc. — replaces the
 * `extends HTMLElement` class removed in #279, which did the same thing via
 * connectedCallback/instance methods.
 * -----------------------------------------------------------------------------
 */
export function searchField(element, options = {}) {
  // Defensive: if search() is ever pointed at a literal <input> directly,
  // just delegate — no container to build.
  if (element.tagName === 'INPUT') {
    return search(element, options);
  }

  let input = element.querySelector('input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'search';
    element.appendChild(input);
  }

  const api = search(input, {
    placeholder: element.getAttribute('placeholder') || 'Search...',
    value: element.getAttribute('value') || '',
    name: element.getAttribute('name') || '',
    debounce: parseInt(element.getAttribute('debounce') || '300'),
    instant: element.hasAttribute('instant'),
    disabled: element.hasAttribute('disabled'),
    size: element.getAttribute('size') || 'md',
    variant: element.getAttribute('variant') || 'default',
    icon: element.getAttribute('icon') || '🔍',
    clearable: element.getAttribute('clearable') !== 'false',
    loading: element.hasAttribute('loading'),
    ...element.dataset,
    ...options
  });

  element.wbSearch = {
    get value() { return api.getValue(); },
    set value(val) { api.setValue(val); },
    focus: api.focus,
    blur: api.blur,
    clear: api.clear,
    search: api.search,
    setLoading: api.setLoading
  };

  return () => {
    api.destroy();
    delete element.wbSearch;
  };
}

export default { search, searchField };