/**
 * Select - Enhanced <select> element
 * CSS targets `select` tag directly — no classes, no inline styles.
 * JS only handles clearable wrapper if requested.
 *
 * Usage:
 *   <select>
 *     <option value>Choose...</option>
 *     <option value="1">Option 1</option>
 *   </select>
 *
 * <wb-select> is a SUPERSET of <select>, not a replacement for it: given a
 * non-<select> host (the <wb-select> custom tag), this builds a real
 * <select>/<option> tree from the host's attributes, then re-invokes itself
 * on that real element so every wb-component and a bare <select> share
 * IDENTICAL enhancement logic. This used to be schema-driven (select.schema.json's
 * $view built a fake dropdown out of <button>/<div>/<ul> -- no real <select>
 * anywhere in it, so keyboard nav/mobile picker/form submission/screen
 * reader semantics were all silently gone; the CSS-only enhancement below
 * never even ran, since its own tagName guard rejected the fake host).
 */
export function select(element, options = {}) {
  if (element.tagName !== 'SELECT') return buildWbSelect(element, options);

  const clearable = options.clearable ?? element.hasAttribute('clearable');

  if (clearable) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-select-clearable';
    if (element.parentNode) {
      element.parentNode.insertBefore(wrapper, element);
    }
    wrapper.appendChild(element);

    const clearBtn = document.createElement('wb-button');
    clearBtn.className = 'wb-select__clear';
    clearBtn.textContent = '\u00d7';
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      element.selectedIndex = -1;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });
    wrapper.appendChild(clearBtn);
  }

  element.wbSelect = {
    getValue: () => element.value,
    setValue: (v) => { element.value = v; },
    getSelectedOptions: () => Array.from(element.selectedOptions),
    clear: () => { element.selectedIndex = -1; }
  };

  return () => {};
}

/**
 * Builds a real <select> (+ <option>s) inside a non-<select> host element
 * (the <wb-select> custom tag), then re-invokes select() on that real
 * element so it gets the exact same clearable/API enhancement as a bare
 * <select> -- one code path, not a second implementation to drift from it.
 */
function buildWbSelect(element, options) {
  // Idempotent: a MutationObserver re-visit must not rebuild on top of
  // structure we already built.
  if (element.querySelector(':scope > select.wb-select__field')) return () => {};

  const label = options.label || element.getAttribute('label') || '';
  const placeholder = options.placeholder || element.getAttribute('placeholder') || 'Select...';
  let optionList = [];
  try {
    optionList = JSON.parse(options.options || element.getAttribute('options') || '[]');
  } catch (e) { /* malformed options= — render with none, not a thrown error */ }
  const value = options.value || element.getAttribute('value') || '';
  const name = options.name || element.getAttribute('name') || '';
  const multiple = options.multiple ?? element.hasAttribute('multiple');
  const disabled = options.disabled ?? element.hasAttribute('disabled');
  const required = options.required ?? element.hasAttribute('required');
  const size = options.size || element.getAttribute('size') || 'md';
  const variant = options.variant || element.getAttribute('variant') || 'default';
  const clearable = options.clearable ?? element.hasAttribute('clearable');

  element.innerHTML = '';
  element.classList.add('wb-select');
  if (size !== 'md') element.classList.add(`wb-select--${size}`);
  if (variant !== 'default') element.classList.add(`wb-select--${variant}`);

  let labelEl = null;
  if (label) {
    labelEl = document.createElement('label');
    labelEl.className = 'wb-select__label';
    labelEl.textContent = label;
    element.appendChild(labelEl);
  }

  const sel = document.createElement('select');
  sel.className = 'wb-select__field';
  if (name) sel.name = name;
  if (multiple) sel.multiple = true;
  if (disabled) sel.disabled = true;
  if (required) sel.required = true;

  if (placeholder && !multiple) {
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = placeholder;
    placeholderOpt.disabled = true;
    placeholderOpt.selected = !value;
    sel.appendChild(placeholderOpt);
  }

  optionList.forEach((opt) => {
    const optEl = document.createElement('option');
    optEl.value = opt.value;
    optEl.textContent = opt.label ?? opt.value;
    if (value && String(opt.value) === String(value)) optEl.selected = true;
    sel.appendChild(optEl);
  });

  if (labelEl) {
    const labelId = 'wb-select-label-' + Math.random().toString(36).slice(2, 9);
    labelEl.id = labelId;
    sel.setAttribute('aria-labelledby', labelId);
  }

  element.appendChild(sel);

  const cleanupField = select(sel, { clearable });
  element.wbSelect = sel.wbSelect;

  return () => {
    if (cleanupField) cleanupField();
    element.innerHTML = '';
    element.classList.remove('wb-select', `wb-select--${size}`, `wb-select--${variant}`);
    delete element.wbSelect;
  };
}

export default { select };
