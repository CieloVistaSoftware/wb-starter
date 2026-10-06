import { readAttr, hasAuthoredAttr } from '../../core/read-attr.js';
import { logError } from '../../core/error-logger.js';

/**
 * #793 -- John: "This should be a runtime error. No Icon". An iconPosition
 * with no icon has nothing to position, and rendering nothing said nothing.
 * Report it the established way: logError() plus an x-error marker a test or
 * a reader can see.
 */
function reportIconPositionWithoutIcon(element, icon) {
  if (icon || !hasAuthoredAttr(element, 'iconPosition')) return;
  element.setAttribute('x-error', 'icon-position-without-icon');
  logError(
    `[WB:input] <${element.tagName.toLowerCase()}> sets iconPosition but has no icon, so there is nothing to position.`,
    { element: element.outerHTML.slice(0, 200), attributes: ['iconPosition'] }
  );
}
/**
 * Input - Enhanced <input> element
 * Adds clearable, prefix/suffix, validation variants
 * Helper Attribute: [x-input]
 */
/**
 * Fields the container branch below built itself. The runtime ALSO dispatches
 * input() on every native <input> it sees, including the one this function
 * just appended, and the native branch then wrapped it a second time: a
 * nested x-input__wrapper inside the one already built, with its own padding
 * and flex styles stacked on the field.
 */
const builtFields = new WeakSet();

export function input(element, options = {}) {
  if (builtFields.has(element)) return () => {};
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
    // #954: must match only what THIS function builds. A bare
    // `querySelector('input')` also matched the schema builder's own $view
    // field (`input.schema.json` declares a wrapper + input, rendered as
    // `.x-input__wrapper > input.x-input__input`), so on the schema-driven
    // path input() concluded "already built" and returned before the branch
    // below -- the one that puts x-input--{variant}/{size} on the host and
    // required/disabled/readOnly on the real field. The result was a bare
    // field that silently ignored all five attributes, while the native
    // <input> host honoured them (#754).
    if (element.querySelector('input.x-input__field')) return () => {}; // already built by us (eager runtime already ran)

    const authoredValue = (element._wbOriginalSlot || element.textContent || '').trim();
    const label = element.getAttribute('label') || '';
    const placeholder = element.getAttribute('placeholder') || '';
    const value = element.getAttribute('value') || authoredValue;
    const name = element.getAttribute('name') || '';
    const inputType = element.getAttribute('input-type') || element.getAttribute('inputType') || 'text';
    const helper = element.getAttribute('helper') || '';
    const error = element.getAttribute('error') || '';
    const icon = readAttr(element, 'icon');
    // #793: readAttr, not getAttribute('icon-position'). The Behaviors page
    // writes the schema key, `iconPosition="end"`, which lands in the DOM as
    // `iconposition` and never matched the kebab spelling.
    const iconPosition = readAttr(element, 'iconPosition', 'start');
    reportIconPositionWithoutIcon(element, icon);
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
    // Layout: .x-input__wrapper in input.css (#779).
    wrapper.className = 'x-input__wrapper';

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
    builtFields.add(realInput);
    // Border/radius/padding/background/color already come from input.css's
    // generic bare-<input> rule (line 28) -- setting them again here as
    // inline styles just stacked a second, redundant border on top of it
    // (and a THIRD from the host <div x-input> tag incorrectly also getting
    // the .x-input class below, now removed). What remains is flex sizing
    // within the wrapper: `.x-input__wrapper > .x-input__field` (#779).
    wrapper.appendChild(realInput);

    if (icon && iconPosition === 'end') {
      const iconEl = document.createElement('span');
      iconEl.textContent = icon;
      wrapper.appendChild(iconEl);
    }

    if (clearable) {
      const clearBtn = document.createElement('button');
      // Same class the native-input path gives its clear button (below), so
      // one selector finds it on either host shape and input.css styles both.
      clearBtn.className = 'x-input__clear';
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
  // floatinglabel() owns its field's wrapper and positions its label against
  // it: a second x-input__wrapper around the field (in either authoring form,
  // on the field or on a container around it) moved the field out from under
  // the label. Checked by attribute too, since input() may run first.
  if (element.closest('[x-floatinglabel], .x-floating-label')) {
    return () => {};
  }
  // A PART another behavior built for itself -- table.js's x-table__search,
  // say -- is already that behavior's field, styled by its own CSS. Wrapping
  // it moved it out from beside the table, so table.js no longer found its
  // own search box as the table's previous sibling. A BEM element class of
  // another x- block is what says "this input belongs to that component".
  if ([...element.classList].some((c) => /^x-[a-z0-9-]+__/.test(c) && !c.startsWith('x-input__'))) {
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

  reportIconPositionWithoutIcon(element, readAttr(element, 'icon'));

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
    // #773: `icon` always became the PREFIX, so icon-position="end" -- which
    // the <div x-input> builder above honours -- did nothing on a native
    // <input>: the showcase's start and end rows rendered the same field.
    // An explicit prefix/suffix still wins over the icon.
    prefix: options.prefix || element.getAttribute('prefix') || element.dataset.prefix
      || (readAttr(element, 'iconPosition', 'start') === 'end' ? '' : readAttr(element, 'icon')) || '',
    suffix: options.suffix || element.getAttribute('suffix') || element.dataset.suffix
      || (readAttr(element, 'iconPosition', 'start') === 'end' ? readAttr(element, 'icon') : '') || '',
    ...options
  };

  // #1645: already wrapped -- a second pass over the same <input> (a rescan,
  // or the OTHER runtime: pages/behaviors.html runs inside the site shell's
  // wb.js and also imports wb-lazy.js, each with its own record of what it has
  // applied) wrapped the wrapper, so #behaviors-search sat inside two nested
  // .x-input__wrapper--native divs on most loads. The first pass owns it.
  if (element.parentElement?.classList.contains('x-input__wrapper--native')
      && element.classList.contains('x-input__field')) {
    return () => {};
  }

  const wrapper = document.createElement('div');
  // #485: NOT .x-input -- that class is input.css's border/padding/background
  // styling for the real text field itself. Putting it on this wrapper div
  // painted a second concentric border ring around the real <input>'s own
  // border ("two lines" on the Success/Error variant demos). Same bug, same
  // fix as the <div x-input> custom-tag branch above: the wrapper gets the
  // purely structural x-input__wrapper class (no CSS targets it visually)
  // and carries only layout; border/background stay exclusively on the real
  // input. #779: that layout is .x-input__wrapper in input.css, and
  // --native scopes the field padding/outline and clear-button chrome that
  // only this path ever applied.
  wrapper.className = 'x-input__wrapper x-input__wrapper--native';
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
  // The layout that remains (flex sizing inside the wrapper, no outline) and
  // the per-size padding are input.css rules scoped to
  // .x-input__wrapper--native (#779). An unrecognised size falls back to md's
  // padding there too, as the old paddings lookup did.
  
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

  // Border colour per state is .x-input--{variant} in input.css (#779).
  if (config.variant === 'success') {
    element.classList.add('x-input--success');
  } else if (config.variant === 'warning') {
    element.classList.add('x-input--warning');
  } else if (config.variant === 'error') {
    element.classList.add('x-input--error');
  }

  if (config.prefix) {
    const pre = document.createElement('span');
    pre.className = 'x-input__prefix';
    pre.textContent = config.prefix;
    wrapper.insertBefore(pre, element);
  }

  if (config.suffix) {
    const suf = document.createElement('span');
    suf.className = 'x-input__suffix';
    suf.textContent = config.suffix;
    wrapper.appendChild(suf);
  }

  if (config.clearable) {
    const clear = document.createElement('button');
    clear.className = 'x-input__clear';
    clear.type = 'button';
    clear.textContent = '×';
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
