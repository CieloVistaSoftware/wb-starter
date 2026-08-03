/**
 * Input - Enhanced <input> element
 * Adds clearable, prefix/suffix, validation variants
 * Helper Attribute: [x-behavior="input"]
 */
export function input(element, options = {}) {
  // #439: <wb-input> is declared as a schema-driven host in
  // input.schema.json's $view (label, wrapper, icon spans, clear button,
  // the real <input>) -- but that $view is only ever interpreted by
  // schema-builder.js's processElement()/WB.processSchema(), which the
  // EAGER runtime (wb.js, main SPA) calls generically for every wb-*
  // element. The LAZY runtime (wb-lazy.js, used by every standalone
  // demos/site/*.html page) never calls processSchema at all -- it only
  // dispatches tag-mapped behavior functions. #367's no-op here assumed
  // the schema "already does everything," true only under the eager
  // runtime. Under the lazy runtime this left <wb-input> completely
  // unbuilt: no real <input> child at all, just the host tag's raw
  // attribute-dump text content -- confirmed live, nothing to type into.
  // card.js/hero.js/etc. avoid this gap because they build their own DOM
  // by hand in JS rather than depending on $view interpretation at
  // runtime; mirror that here instead of the schema-builder path, whose
  // behavior under the lazy runtime is unverified.
  if (element.tagName === 'WB-INPUT') {
    if (element.querySelector('input')) return () => {}; // already built (eager runtime already ran)

    const label = element.getAttribute('label') || '';
    const placeholder = element.getAttribute('placeholder') || '';
    const value = element.getAttribute('value') || '';
    const name = element.getAttribute('name') || '';
    const inputType = element.getAttribute('input-type') || element.getAttribute('inputType') || 'text';
    const helper = element.getAttribute('helper') || '';
    const error = element.getAttribute('error') || '';
    const icon = element.getAttribute('icon') || '';
    const iconPosition = element.getAttribute('icon-position') || 'start';
    const clearable = element.hasAttribute('clearable');
    const disabled = element.hasAttribute('disabled');
    const readonly = element.hasAttribute('readonly');
    const required = element.hasAttribute('required');

    element.innerHTML = '';
    // NOT .wb-input on the host -- that class is input.css's styling for a
    // plain bare <input> (border/padding/background), meant for the real
    // <input> field below, not this wrapper tag. Adding it here gave the
    // host its own visible border too, stacking a second ring around the
    // real input's own border ("three rings" reported live).

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      if (required) {
        const req = document.createElement('span');
        req.textContent = '*';
        labelEl.appendChild(req);
      }
      element.appendChild(labelEl);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'wb-input__wrapper';
    wrapper.style.cssText = 'position:relative;display:flex;align-items:center;width:100%;';

    if (icon && iconPosition === 'start') {
      const iconEl = document.createElement('span');
      iconEl.textContent = icon;
      wrapper.appendChild(iconEl);
    }

    const realInput = document.createElement('input');
    realInput.type = inputType;
    if (placeholder) realInput.placeholder = placeholder;
    if (value) realInput.value = value;
    if (name) realInput.name = name;
    if (disabled) realInput.disabled = true;
    if (readonly) realInput.readOnly = true;
    if (required) realInput.required = true;
    realInput.classList.add('wb-input__field');
    // Border/radius/padding/background/color already come from input.css's
    // generic bare-<input> rule (line 28) -- setting them again here as
    // inline styles just stacked a second, redundant border on top of it
    // (and a THIRD from the host <wb-input> tag incorrectly also getting
    // the .wb-input class below, now removed). Only set what CSS can't:
    // flex sizing within the wrapper.
    Object.assign(realInput.style, {
      width: 'auto',
      flex: '1',
      minWidth: '0'
    });
    wrapper.appendChild(realInput);

    if (icon && iconPosition === 'end') {
      const iconEl = document.createElement('span');
      iconEl.textContent = icon;
      wrapper.appendChild(iconEl);
    }

    if (clearable) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.textContent = '✕';
      clearBtn.addEventListener('click', () => { realInput.value = ''; realInput.focus(); });
      wrapper.appendChild(clearBtn);
    }

    element.appendChild(wrapper);

    if (helper && !error) {
      const helperEl = document.createElement('span');
      helperEl.className = 'wb-input__helper';
      helperEl.textContent = helper;
      element.appendChild(helperEl);
    }
    if (error) {
      const errorEl = document.createElement('span');
      errorEl.className = 'wb-input__error';
      errorEl.textContent = error;
      element.appendChild(errorEl);
    }

    return () => { element.innerHTML = ''; };
  }

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
