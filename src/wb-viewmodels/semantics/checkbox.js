/**
 * Checkbox - Enhanced <input type="checkbox">
 *
 * CSS targets input[type="checkbox"] directly with appearance: none.
 * JS does NOTHING except set indeterminate state if requested.
 * No wrapper, no fake span, no classes.
 *
 * Usage:
 *   <label><input type="checkbox"> Unchecked</label>
 *   <label><input type="checkbox" checked> Checked</label>
 *   <label><input type="checkbox" disabled> Disabled</label>
 *   <label><input type="checkbox" variant="success"> Success</label>
 *
 * ⚠️ <wb-checkbox> is DEPRECATED — prefer a native <input type="checkbox">
 * directly (see usage above); this behavior already enhances a bare input
 * fully, no wrapper element ever needed. Retained for back-compat (self-
 * builds the real input now, see below); emits a one-time console warning.
 */
let _checkboxHostDeprecationWarned = false;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 1.125rem;
      height: 1.125rem;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 4px;
      background-color: var(--bg-primary, #ffffff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      cursor: pointer;
      vertical-align: middle;
      margin: 0 0.25rem 0 0;
    }

    input[type="checkbox"]:checked {
      background-color: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
      background-size: 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    input[type="checkbox"]:indeterminate {
      background-color: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='3' y='7' width='10' height='2' rx='1'/%3e%3c/svg%3e");
      background-size: 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    input[type="checkbox"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
      border-color: var(--primary, #6366f1);
      outline: none;
    }

    input[type="checkbox"]:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--bg-secondary, #f3f4f6);
    }

    /* Sizes via attribute */
    input[type="checkbox"][size="xs"] { width: 0.75rem; height: 0.75rem; }
    input[type="checkbox"][size="sm"] { width: 0.875rem; height: 0.875rem; }
    input[type="checkbox"][size="lg"] { width: 1.5rem; height: 1.5rem; }

    /* Variants via attribute */
    input[type="checkbox"][variant="success"]:checked,
    input[type="checkbox"][variant="success"]:indeterminate {
      background-color: var(--success-color, #22c55e);
      border-color: var(--success-color, #22c55e);
    }
    input[type="checkbox"][variant="success"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
    }

    input[type="checkbox"][variant="warning"]:checked,
    input[type="checkbox"][variant="warning"]:indeterminate {
      background-color: var(--warning-color, #f59e0b);
      border-color: var(--warning-color, #f59e0b);
    }
    input[type="checkbox"][variant="warning"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
    }

    input[type="checkbox"][variant="danger"]:checked,
    input[type="checkbox"][variant="danger"]:indeterminate {
      background-color: var(--danger-color, #ef4444);
      border-color: var(--danger-color, #ef4444);
    }
    input[type="checkbox"][variant="danger"]:focus-visible {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function checkbox(element, options = {}) {
  // <wb-checkbox> host with no real <input> yet (schema $view never ran --
  // e.g. on wb-lazy.js pages, which have no schema-processing support at
  // all): self-build a real, semantic <label><input type="checkbox">text</label>
  // and enhance THAT, the same way switch.js already does for <wb-switch>.
  // Deliberately does NOT replicate checkbox.schema.json's separate
  // .wb-checkbox__box/.wb-checkbox__check span visual -- this file's own
  // injectStyles() below already gives a fully custom-styled checkbox on a
  // bare input via appearance:none, with no extra DOM needed. Native
  // .indeterminate is a DOM property, not an HTML attribute, so it's the
  // only piece that genuinely can't be done without JS.
  // WB.schema is only exposed on wb.js (window.WB.schema = SchemaBuilder) --
  // absent entirely on wb-lazy.js. When it IS present, wb.js's own schema
  // processing already builds this correctly (confirmed working); racing it
  // with a synchronous self-build here clobbers whichever one finishes last
  // (confirmed live: reading host.textContent/attributes AFTER the other
  // path already cleared them). Only self-build when schema support
  // genuinely doesn't exist at all.
  if (element.tagName.toLowerCase() === 'wb-checkbox' && !_checkboxHostDeprecationWarned) {
    _checkboxHostDeprecationWarned = true;
    console.warn('[wb-checkbox] is deprecated — use a bare <input type="checkbox"> instead, it already gets this same custom styling with no wrapper element needed.');
  }

  if (element.tagName !== 'INPUT' && element.tagName.toLowerCase() === 'wb-checkbox' && !window.WB?.schema) {
    if (element.querySelector('input[type="checkbox"]')) return () => {};
    const host = element;
    const label = host.getAttribute('label') || '';
    host.textContent = '';
    const labelEl = document.createElement('label');
    labelEl.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;cursor:pointer;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    if (host.hasAttribute('checked')) input.checked = true;
    if (host.hasAttribute('disabled')) input.disabled = true;
    if (host.hasAttribute('required')) input.required = true;
    const name = host.getAttribute('name');
    if (name) input.name = name;
    const value = host.getAttribute('value');
    if (value) input.value = value;
    const variant = host.getAttribute('variant');
    if (variant && variant !== 'default') input.setAttribute('variant', variant);
    const size = host.getAttribute('size');
    if (size && size !== 'md') input.setAttribute('size', size);
    labelEl.appendChild(input);
    if (label) labelEl.appendChild(document.createTextNode(label));
    host.appendChild(labelEl);
    // Redundant when host IS <wb-checkbox> (#478) -- checkbox.css matches the
    // tag directly too now.
    if (host.tagName.toLowerCase() !== 'wb-checkbox') host.classList.add('wb-checkbox');
    return checkbox(input, options);
  }

  // Schema already built the real, hidden <input class="wb-checkbox__input">
  // (checkbox.schema.json's $view) when window.WB.schema ran -- but
  // schema-builder.js's generic $view builder only ever sets STATIC
  // part.attributes (checkbox.schema.json's input view only declares
  // `type: checkbox`) and its appliesClass mechanism only adds a class to
  // the HOST element for a boolean property (e.g. wb-checkbox--checked) --
  // neither actually sets the real input's checked/disabled/indeterminate
  // DOM properties. checkbox.css's visual state depends entirely on the
  // native `:checked` pseudo-class (`.wb-checkbox__input:checked ~
  // .wb-checkbox__box`), so a <wb-checkbox checked> or <wb-checkbox
  // disabled> always rendered as a plain unchecked, enabled box -- confirmed
  // live (forms.html's "Checked"/"Disabled" demos). switch.js already does
  // this same reflection for <wb-switch>'s schema-built input; checkbox.js
  // just never had the equivalent step. Runs before the schema-built input's
  // own `.wb-checkbox__input` early-return below, since it targets the HOST
  // (wb-checkbox), not that input.
  if (element.tagName.toLowerCase() === 'wb-checkbox' && window.WB?.schema) {
    const input = element.querySelector('input[type="checkbox"]');
    if (input) {
      if (element.hasAttribute('checked')) input.checked = true;
      if (element.hasAttribute('disabled')) input.disabled = true;
      if (element.hasAttribute('required')) input.required = true;
      if (element.hasAttribute('indeterminate')) input.indeterminate = true;
    }
  }

  if (element.tagName !== 'INPUT' || element.type !== 'checkbox') return () => {};

  // wb-switch's internal <input type="checkbox"> is a visually-hidden state
  // driver styled by switch.css (position:absolute, width:1px, opacity:0) --
  // it is not a rendered checkbox. The generic visual treatment here
  // (width:1.125rem, display:inline-flex, appearance:none) matches it too
  // via the same nativeMap dispatch (any input[type="checkbox"] gets both
  // behaviors, additively -- see wb.js's scan()), and ties switch.css's
  // `.wb-switch input` rule on specificity, winning on source order. (#361)
  if (element.classList.contains('wb-switch__input')) return () => {};

  // wb-checkbox's OWN internal <input type="checkbox"> is the same kind of
  // visually-hidden state driver -- checkbox.schema.json's $view builds a
  // separate .wb-checkbox__box/.wb-checkbox__check pair as the actual visual
  // (matching the $cssAPI's --wb-checkbox-size/--wb-checkbox-radius/etc.
  // variables, which target that visual, not a raw input). Giving the input
  // its own type="checkbox" (fixing #366's text-field-wrap bug) means this
  // function's normal injectStyles() path now also matches it -- would
  // render a second, fully-visible native checkbox next to the box/check
  // visual. Keep it hidden via CSS instead (checkbox.css).
  if (element.classList.contains('wb-checkbox__input')) return () => {};

  injectStyles();

  // Only JS action: set indeterminate if requested
  if (options.indeterminate ?? element.hasAttribute('indeterminate')) {
    element.indeterminate = true;
  }

  return () => {};
}

export default { checkbox };
