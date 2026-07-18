/**
 * Input - Enhanced <input> element
 * Adds clearable, prefix/suffix, validation variants
 * Helper Attribute: [x-behavior="input"]
 */
export function input(element, options = {}) {
  // <wb-input> is a schema-driven host whose $view already builds a full
  // structure declaratively -- label, wrapper div, icon spans, clear
  // button, and the real <input> (placeholder/value/name/type now bound
  // directly in input.schema.json's $view, same fix shape as #362). Unlike
  // switch.js/select.js/textarea.js, this function had no host-vs-child
  // guard at all: dispatched on the WB-INPUT host itself (elementMap
  // ['wb-input'] dispatches it there too, same as on the real child via
  // nativeMap['input']), it wrapped the ENTIRE already-built component in a
  // second bogus wrapper div, with wb-input__field class and raw-text-input
  // inline styles (width/flex/padding) applied straight onto the host tag.
  // The schema already does everything this function would otherwise do
  // for the host, so just no-op there. (#367)
  if (element.tagName === 'WB-INPUT') return () => {};

  // A DIFFERENT explicit x-{behavior} attribute (x-search, x-password,
  // x-autocomplete, ...) opts this element into its own richer, complete
  // wrapper -- input()'s generic wrap should never ALSO apply on top of it.
  // wb.js's getAutoInjectBehavior() already tries to skip this case, but
  // that check races against lazy behavior-module loading (the skip only
  // fires if the OTHER behavior happens to already be registered at scan
  // time) -- confirmed live: <input type="search" x-search> got wrapped by
  // BOTH search() (search.js) and input(), nesting wb-search__wrapper
  // around wb-input around another wb-search__wrapper ("concentric
  // rings"). Guard here too so it can't happen regardless of load order.
  const RICHER_INPUT_BEHAVIORS = ['search', 'password', 'autocomplete', 'datepicker', 'autosize', 'colorpicker'];
  if (RICHER_INPUT_BEHAVIORS.some(name => element.hasAttribute(`x-${name}`))) {
    return () => {};
  }
  if (element.closest('.wb-search__wrapper, .wb-password')) {
    return () => {};
  }

  // Types with their own native rendering/behavior (checkbox/radio via
  // tag-map.js's nativeMap, range/color/file/submit/button/reset/image via
  // the browser itself) must never get this generic text-field wrap.
  // wb.js's scan() applies every matching nativeMap entry additively rather
  // than "most specific selector wins" -- a bare <input type="checkbox">
  // matches BOTH 'input[type="checkbox"]' (checkbox()) AND the generic
  // 'input' selector (this function), so without this guard input() runs
  // second and clobbers the checkbox with .wb-input/.wb-input__field
  // text-field styling (padding, flex:1, border-radius) -- confirmed live: a
  // native checkbox rendered as a wide rounded pill, indistinguishable from
  // a text input, on the Behaviors page checkbox demo.
  const NON_TEXT_TYPES = ['checkbox', 'radio', 'range', 'color', 'file', 'submit', 'button', 'reset', 'image'];
  const inputType = (options.type || element.getAttribute('type') || '').toLowerCase();
  if (NON_TEXT_TYPES.includes(inputType)) {
    return () => {};
  }

  const config = {
    type: options.type || element.dataset.type || element.type || 'text',
    variant: options.variant || element.getAttribute('variant') || element.dataset.variant || '',
    size: options.size || element.dataset.size || 'md',
    clearable: options.clearable ?? element.hasAttribute('clearable'),
    prefix: options.prefix || element.getAttribute('prefix') || element.dataset.prefix || element.dataset.icon || '',
    suffix: options.suffix || element.getAttribute('suffix') || element.dataset.suffix || '',
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
  } else if (config.variant === 'warning') {
    element.style.borderColor = 'var(--warning-color, #f59e0b)';
    wrapper.classList.add('wb-input--warning');
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

  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
    element.classList.remove('wb-input__field');
  };
}

export default input;
