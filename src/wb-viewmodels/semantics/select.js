import { logError } from '../../core/error-logger.js';
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

  // #681 -- John: "I didn't see any colors". This branch handled `clearable`
  // and an API object and nothing else, so a native <select variant="error">
  // came out with className === "" -- the CSS rule was correct and nothing
  // ever applied the class. variant/size are declared in select.schema.json
  // and were read only by buildWbSelect(), which a native <select> never
  // reaches. Same #669 family as audio showDisplay and table paginated.
  const nativeVariant = options.variant || element.getAttribute('variant') || 'default';
  const nativeSize = options.size || element.getAttribute('size') || 'md';
  const appliedClasses = [];
  if (nativeVariant !== 'default') appliedClasses.push(`wb-select--${nativeVariant}`);
  // `size` on a native <select> is ALSO a real HTML attribute meaning "how many
  // rows to show", and it is numeric. Only treat it as a style token when it is
  // not a number, so <select size="4"> keeps its native meaning.
  if (nativeSize !== 'md' && !/^\d+$/.test(String(nativeSize))) {
    appliedClasses.push(`wb-select--${nativeSize}`);
  }
  if (appliedClasses.length) element.classList.add(...appliedClasses);

  const clearable = options.clearable ?? element.hasAttribute('clearable');

  if (clearable && !element.parentElement?.classList.contains('wb-select-clearable')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-select-clearable';
    if (element.parentNode) {
      element.parentNode.insertBefore(wrapper, element);
    }
    wrapper.appendChild(element);

    // #758 -- John: "way too large". This was a <wb-button>, so the button
    // behavior styled it as a full button (wb-button--md is padding:1rem) and
    // the clear affordance rendered as a blue square larger than the select it
    // belonged to. There was also no CSS for .wb-select__clear anywhere, so
    // nothing reined it back in.
    //
    // A plain <button> -- the same choice input.js already makes for the same
    // job -- takes the compact .wb-select__clear rule added in input.css
    // instead of the full button treatment.
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'wb-select__clear';
    clearBtn.setAttribute('aria-label', 'Clear selection');
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
  // Real <option> children (the documented, HTML-native usage -- see this
  // file's own header comment and docs/components/forms/forms.readme.md)
  // take priority over the options="[...]" JSON attribute. Must be read
  // BEFORE `element.innerHTML = ''` below wipes them -- that line used to
  // run first, silently destroying any authored <option> children with
  // nothing ever reading them first, so every documented
  // <wb-select><option>...</option></wb-select> example rendered an empty
  // dropdown (confirmed live, #390).
  const childOptions = Array.from(element.querySelectorAll(':scope > option')).map((o) => ({
    value: o.getAttribute('value') ?? o.textContent.trim(),
    label: o.textContent.trim(),
  }));
  let optionList = childOptions;
  if (optionList.length === 0) {
    // #757: only JSON was accepted, and a parse failure was swallowed whole.
    // `options="main,develop,fix/706-dropdown"` -- the comma-separated form
    // the examples and docs use -- threw, was caught, and rendered an EMPTY
    // dropdown with nothing anywhere to explain why.
    //
    // Accept both spellings: a JSON array when it looks like one, otherwise a
    // comma-separated list. A value containing a comma can only be expressed
    // in the JSON form, which is what it is for.
    const raw = options.options ?? element.getAttribute('options') ?? '';
    if (Array.isArray(raw)) {
      optionList = raw;
    } else {
      const text = String(raw).trim();
      if (text.startsWith('[')) {
        try {
          optionList = JSON.parse(text);
        } catch (e) {
          // Report it: a malformed options= is an authoring mistake, and
          // silently rendering nothing is how it stayed invisible.
          logError(
            `[WB:select] options= is not valid JSON, so no options were rendered: ${e.message}`,
            { element: element.outerHTML.slice(0, 200), options: text.slice(0, 200) }
          );
          optionList = [];
        }
      } else if (text) {
        optionList = text
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => ({ value: s, label: s }));
      }
    }
  }
  const value = options.value || element.getAttribute('value') || '';
  const name = options.name || element.getAttribute('name') || '';
  const multiple = options.multiple ?? element.hasAttribute('multiple');
  const disabled = options.disabled ?? element.hasAttribute('disabled');
  const required = options.required ?? element.hasAttribute('required');
  const size = options.size || element.getAttribute('size') || 'md';
  const variant = options.variant || element.getAttribute('variant') || 'default';
  const clearable = options.clearable ?? element.hasAttribute('clearable');

  element.innerHTML = '';
  // #448: no bare 'wb-select' token -- input.css selects the `wb-select`
  // TAG directly now (this container is only ever the <wb-select> custom
  // tag itself; a native <select> takes the early-return branch above and
  // never reaches this function at all, so the class never mattered for it).
  if (size !== 'md') element.classList.add(`wb-select--${size}`);
  if (variant !== 'default') element.classList.add(`wb-select--${variant}`);
  // #497: the classes above only ever reached this HOST wrapper. The
  // actually-visible control is the real <select class="wb-select__field">
  // built below -- input.css's `.wb-select--*` size/variant rules are bare
  // class selectors (not scoped to the `wb-select` tag), so they never
  // matched anything on the host's *child*. Result: every size/variant
  // combination rendered the field with the same constant padding/
  // font-size/border-color (confirmed live -- "almost zero variation"
  // across ~23 pasted combos). Adding the identical classes to the field
  // itself lets the existing CSS rules match the element users actually
  // see, with zero CSS changes needed.
  const fieldClasses = [];
  if (size !== 'md') fieldClasses.push(`wb-select--${size}`);
  if (variant !== 'default') fieldClasses.push(`wb-select--${variant}`);

  let labelEl = null;
  if (label) {
    labelEl = document.createElement('label');
    labelEl.className = 'wb-select__label';
    labelEl.textContent = label;
    element.appendChild(labelEl);
  }

  const sel = document.createElement('select');
  sel.className = 'wb-select__field';
  if (fieldClasses.length) sel.classList.add(...fieldClasses);
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
    element.classList.remove(`wb-select--${size}`, `wb-select--${variant}`);
    delete element.wbSelect;
  };
}

export default { select };
