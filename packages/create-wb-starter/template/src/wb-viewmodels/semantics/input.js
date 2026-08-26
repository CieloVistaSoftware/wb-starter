import { readAttr } from '../../core/read-attr.js';
import { logError } from '../../core/error-logger.js';
/**
 * Input - Enhanced <input> element
 * Adds clearable, prefix/suffix, validation variants
 * Helper Attribute: [x-behavior="input"]
 */
export function input(element, options = {}) {
  // #439: <div x-input> is declared as a schema-driven host in
  // input.schema.json's $view (label, wrapper, icon spans, clear button,
  // the real <input>) -- but that $view is only ever interpreted by
  // schema-builder.js's processElement()/WB.processSchema(), which the
  // EAGER runtime (wb.js, main SPA) calls generically for every wb-*
  // element. The LAZY runtime (wb-lazy.js, used by every standalone
  // demos/site/*.html page) never calls processSchema at all -- it only
  // dispatches tag-mapped behavior functions. #367's no-op here assumed
  // the schema "already does everything," true only under the eager
  // runtime. Under the lazy runtime this left <div x-input> completely
  // unbuilt: no real <input> child at all, just the host tag's raw
  // attribute-dump text content -- confirmed live, nothing to type into.
  // card.js/hero.js/etc. avoid this gap because they build their own DOM
  // by hand in JS rather than depending on $view interpretation at
  // runtime; mirror that here instead of the schema-builder path, whose
  // behavior under the lazy runtime is unverified.
  // #754: this used to require tagName === 'WB-INPUT', so the documented
  // authoring form
  //
  //   <div x-input label="Repository" placeholder="owner/name" input-type="text">
  //
  // produced NOTHING -- no label, no field, no error variant. It fell past
  // this block to the generic wrap below, which assumes the host already IS a
  // form control and has nothing to wrap on a <div>.
  //
  // The whole premise of an x-* behavior is that any element can carry it, so
  // build the field on any CONTAINER host. A host that is itself a form
  // control keeps the old path: there the element is the input, and wrapping
  // is the correct treatment rather than building a second one inside it.
  const FORM_CONTROLS = ['INPUT', 'SELECT', 'TEXTAREA'];
  const isContainerHost = !FORM_CONTROLS.includes(element.tagName);
  if (isContainerHost) {
    if (element.querySelector('input')) return () => {}; // already built (eager runtime already ran)

    const authoredValue = (element._wbOriginalSlot || element.textContent || '').trim();
    const label = element.getAttribute('label') || '';
    const placeholder = element.getAttribute('placeholder') || '';
    const value = element.getAttribute('value') || authoredValue;
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

    // #754: variant and size were declared in input.schema.json, documented,
    // and read NOWHERE on this path -- `<div x-input variant="error">` built a
    // field with no error styling at all. Map them to modifier classes, the
    // same mechanism button uses, so the CSS that already exists applies.
    const variant = element.getAttribute('variant') || '';
    const size = element.getAttribute('size') || '';
    element.classList.add('x-input');
    if (variant) element.classList.add(`x-input--${variant}`);
    if (size) element.classList.add(`x-input--${size}`);

    element.innerHTML = '';
    // NOT .x-input on the host -- that class is input.css's styling for a
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
    wrapper.className = 'x-input__wrapper';
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
    realInput.classList.add('x-input__field');
    // Border/radius/padding/background/color already come from input.css's
    // generic bare-<input> rule (line 28) -- setting them again here as
    // inline styles just stacked a second, redundant border on top of it
    // (and a THIRD from the host <div x-input> tag incorrectly also getting
    // the .x-input class below, now removed). Only set what CSS can't:
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
      helperEl.className = 'x-input__helper';
      helperEl.textContent = helper;
      element.appendChild(helperEl);
    }
    if (error) {
      const errorEl = document.createElement('span');
      errorEl.className = 'x-input__error';
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
  // BOTH search() (search.js) and input(), nesting x-search__wrapper
  // around x-input around another x-search__wrapper ("concentric
  // rings"). Guard here too so it can't happen regardless of load order.
  const RICHER_INPUT_BEHAVIORS = ['search', 'password', 'autocomplete', 'datepicker', 'autosize', 'colorpicker'];
  if (RICHER_INPUT_BEHAVIORS.some(name => element.hasAttribute(`x-${name}`))) {
    return () => {};
  }
  if (element.closest('.x-search__wrapper, .x-password')) {
    return () => {};
  }

  // Types with their own native rendering/behavior (checkbox/radio via
  // tag-map.js's nativeMap, range/color/file/submit/button/reset/image via
  // the browser itself) must never get this generic text-field wrap.
  // wb.js's scan() applies every matching nativeMap entry additively rather
  // than "most specific selector wins" -- a bare <input type="checkbox">
  // matches BOTH 'input[type="checkbox"]' (checkbox()) AND the generic
  // 'input' selector (this function), so without this guard input() runs
  // second and clobbers the checkbox with .x-input/.x-input__field
  // text-field styling (padding, flex:1, border-radius) -- confirmed live: a
  // native checkbox rendered as a wide rounded pill, indistinguishable from
  // a text input, on the Behaviors page checkbox demo.
  const NON_TEXT_TYPES = ['checkbox', 'radio', 'range', 'color', 'file', 'submit', 'button', 'reset', 'image'];
  const inputType = (options.type || element.getAttribute('type') || '').toLowerCase();
  if (NON_TEXT_TYPES.includes(inputType)) {
    return () => {};
  }

  // #754 -- John: "doesn't work but should at least show a runtime error."
  //
  // Everything above this point is a DELIBERATE hand-off: another behavior
  // owns the element, or the browser renders the type natively. Reaching here
  // with attributes that only the field builder can honour is different --
  // it means the author asked for a label/helper/error/input-type and this
  // path cannot produce any of them. Silently returning is what made
  // `<div x-input label="Repository">` look like a broken component instead
  // of an unsupported host, and cost a bug report to discover.
  // #777: a native <input> IS the field. It has nothing to build, so telling
  // the author it "cannot build a field" is wrong -- and `input-type` on one
  // is not ignored either, it maps to the element's own `type`. The warning
  // fired on valid markup and put a red entry in the error log.
  if (element.tagName === 'INPUT') {
    const wanted = readAttr(element, 'input-type');
    if (wanted && element.getAttribute('type') !== wanted) element.setAttribute('type', wanted);
  }

  const BUILDER_ONLY = ['label', 'helper', 'error', 'input-type', 'inputtype'];
  const asked = BUILDER_ONLY.filter((a) => element.hasAttribute(a));
  const isFormControl = ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
  if (asked.length && !isFormControl && !element.querySelector('input')) {
    logError(
      `[WB:input] <${element.tagName.toLowerCase()}> asked for ${asked.join(', ')} ` +
      `but this host cannot build a field, so ${asked.length === 1 ? 'it was' : 'they were'} ignored.`,
      { element: element.outerHTML.slice(0, 200), attributes: asked }
    );
  }

  const config = {
    type: options.type || readAttr(element, 'type') || element.type || 'text',
    variant: options.variant || element.getAttribute('variant') || readAttr(element, 'variant') || '',
    // #754: the plain `size` attribute -- the documented spelling, and the one
    // every example writes -- was never read here; only data-size was. Same
    // gap as #752.
    size: options.size || element.getAttribute('size') || readAttr(element, 'size') || 'md',
    clearable: options.clearable ?? element.hasAttribute('clearable'),
    prefix: options.prefix || element.getAttribute('prefix') || element.dataset.prefix || readAttr(element, 'icon') || '',
    suffix: options.suffix || element.getAttribute('suffix') || element.dataset.suffix || '',
    ...options
  };

  const wrapper = document.createElement('div');
  // #485: NOT .x-input -- that class is input.css's border/padding/background
  // styling for the real text field itself. Putting it on this wrapper div
  // painted a second concentric border ring around the real <input>'s own
  // border ("two lines" on the Success/Error variant demos). Same bug, same
  // fix as the <div x-input> custom-tag branch above: the wrapper gets the
  // purely structural x-input__wrapper class (no CSS targets it visually)
  // and carries only layout via inline styles; border/background stay
  // exclusively on the real input.
  wrapper.className = 'x-input__wrapper';
  // Wrapper takes full width to mimic the input's behavior
  wrapper.style.cssText = 'position:relative;display:flex;align-items:center;width:100%;';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  element.classList.add('x-input__field');
  
  // #671: border/borderRadius/background/color were set inline here too, with
  // the same consequence as textarea.js -- inline wins over every stylesheet
  // rule, so `x-input--error` and `x-input--success` were dead on arrival.
  // input.css already applies all four from theme tokens (both via `.x-input`
  // and via the bare-native `input:not(...)` rule that covers an unclassed
  // field), so removing them changes nothing visually except letting the
  // variant classes through.
  //
  // The three that remain are layout, tied to the flex wrapper created just
  // above -- they describe this element's role inside that wrapper, not its
  // appearance.
  Object.assign(element.style, {
    width: 'auto', // Let flex handle width
    flex: '1',     // Take remaining space
    minWidth: '0', // Prevent overflow
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
  
  // #485: size/variant modifier classes go on the real input, not the
  // wrapper -- .x-input--{size} adds padding/font-size and
  // .x-input--{variant} adds border-color, all of which belong to the
  // field itself. On the wrapper they padded/colored the structural div,
  // contributing to the doubled-up ring/spacing.
  // #754: this used to skip 'md', so `size="md"` left NO trace on the element
  // -- indistinguishable from the attribute being ignored, which is exactly
  // the failure being hunted here. State every size explicitly; the default
  // carrying its own class costs nothing and makes the rendered element say
  // what it is.
  if (config.size) {
    element.classList.add(`x-input--${config.size}`);
  }

  // #754: `variant="default"` is a declared enum value that landed nowhere,
  // so the schema's own default was silently unrepresented. Every variant now
  // carries its class; the specific ones below keep their border treatment.
  if (config.variant) {
    element.classList.add(`x-input--${config.variant}`);
  }

  if (config.variant === 'success') {
    element.style.borderColor = 'var(--success-color, #22c55e)';
    element.classList.add('x-input--success');
  } else if (config.variant === 'warning') {
    element.style.borderColor = 'var(--warning-color, #f59e0b)';
    element.classList.add('x-input--warning');
  } else if (config.variant === 'error') {
    element.style.borderColor = 'var(--danger-color, #ef4444)';
    element.classList.add('x-input--error');
  }

  if (config.prefix) {
    const pre = document.createElement('span');
    pre.className = 'x-input__prefix';
    pre.style.cssText = 'padding:0 0.5rem;color:var(--text-secondary,#9ca3af);';
    pre.textContent = config.prefix;
    wrapper.insertBefore(pre, element);
  }

  if (config.suffix) {
    const suf = document.createElement('span');
    suf.className = 'x-input__suffix';
    suf.style.cssText = 'padding:0 0.5rem;color:var(--text-secondary,#9ca3af);';
    suf.textContent = config.suffix;
    wrapper.appendChild(suf);
  }

  if (config.clearable) {
    const clear = document.createElement('button');
    clear.className = 'x-input__clear';
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
    element.classList.remove(
      'x-input__field',
      `x-input--${config.size}`,
      'x-input--success',
      'x-input--warning',
      'x-input--error'
    );
  };
}

export default input;
