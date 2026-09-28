/**
 * Textarea - Enhanced <textarea> element
 * Adds autosize, character count, max length indicator
 * Helper Attribute: [x-behavior="textarea"]
 *
 * ⚠️ <textarea> is DEPRECATED — prefer a bare <textarea> directly (see
 * Helper Attribute usage above); this behavior already enhances one fully,
 * no wrapper element ever needed. Retained for back-compat (self-builds
 * the real textarea now, see below); emits a one-time console warning.
 */
import { setRule, clearRules } from '../../core/dynamic-style.js';
import { readAttr, readFlag } from '../../core/read-attr.js';

let _textareaHostDeprecationWarned = false;

/** textarea.schema.json's `resize` enum. */
const RESIZE_VALUES = ['none', 'vertical', 'horizontal', 'both'];

/** Host attributes the enhancement below reads off the real <textarea>. */
const ENHANCE_ATTRS = ['variant', 'size', 'autosize', 'max-length', 'show-count', 'min-rows', 'max-rows', 'resize'];

/**
 * Copy the declared host attributes the schema $view does not bind onto the
 * real <textarea> inside a schema-built host. `rows` is bound by the $view
 * already, but only to the schema default when the lazy builder fills it, so
 * the author's value is re-applied here.
 *
 * @param {HTMLElement} host
 * @param {HTMLTextAreaElement} inner
 */
function reflectHostAttributes(host, inner) {
  const value = readAttr(host, 'value');
  // textContent is the textarea's default value -- the declarative spelling,
  // so it also survives a form reset.
  if (value && !inner.textContent) inner.textContent = value;
  const rows = parseInt(readAttr(host, 'rows'), 10);
  if (Number.isFinite(rows) && rows > 0) inner.rows = rows;
  if (readFlag(host, 'disabled')) inner.disabled = true;
  if (readFlag(host, 'readonly')) inner.readOnly = true;
  if (readFlag(host, 'required')) inner.required = true;
  const resize = readAttr(host, 'resize');
  if (RESIZE_VALUES.includes(resize)) inner.classList.add(`x-textarea--resize-${resize}`);
  // The $view binds {{name}}/{{placeholder}} even when the author wrote
  // neither, and then fills them from the schema's documentation defaults:
  // a form posted notes under the name "this is the name". Only an authored
  // value belongs on the field.
  for (const attr of ['name', 'placeholder']) {
    if (!host.hasAttribute(attr)) inner.removeAttribute(attr);
  }
  // The enhancement runs on the real field, so it has to see what the author
  // put on the host.
  for (const attr of ENHANCE_ATTRS) {
    if (host.hasAttribute(attr)) inner.setAttribute(attr, host.getAttribute(attr));
  }
}

/**
 * Real <textarea>s already enhanced. A self-built host child is enhanced by
 * the recursive call below AND by the runtime's own native dispatch on the
 * <textarea> it just saw appear -- running twice nested a second counter
 * wrapper and bound autosize/count listeners twice.
 */
const enhanced = new WeakSet();

export function textarea(element, options = {}) {
  if (enhanced.has(element)) return () => {};
  if (!element || typeof element.classList === 'undefined') {
    console.warn('[textarea] Invalid element provided');
    return () => {};
  }

  if (element.tagName.toLowerCase() === 'x-textarea' && !_textareaHostDeprecationWarned) {
    _textareaHostDeprecationWarned = true;
    console.warn('[x-textarea] is deprecated — use a bare <textarea> instead, it already gets this same enhancement with no wrapper element needed.');
  }

  // A container host (<div x-textarea>) with no real <textarea> child yet:
  // self-build a real, semantic <textarea>, the same way switch.js/
  // checkbox.js already do for their own hosts, instead of leaving the
  // host.classList/style writes below as no-ops on an element with no form
  // control inside it.
  //
  // This used to require tagName 'x-textarea' AND no window.WB.schema. 4.0.0
  // removed component tags (the authoring form is <div x-textarea>), so the
  // tag test never matched again; and wb.js -- the runtime that exposes
  // WB.schema -- no longer calls processSchema() at all (_detectSchemaName()
  // returns null for every element), so "schema will build it" was false
  // there too. Every host on a wb.js page rendered as an empty div with
  // nothing to type into (#362). wb-lazy still awaits its schema build
  // before dispatching, so there the child exists and this branch skips.
  if (element.tagName !== 'TEXTAREA' && !element.querySelector(':scope > textarea')) {
    const host = element;
    const built = document.createElement('textarea');
    const placeholder = host.getAttribute('placeholder');
    if (placeholder) built.placeholder = placeholder;
    const rows = host.getAttribute('rows');
    if (rows) built.rows = parseInt(rows, 10);
    const name = host.getAttribute('name');
    if (name) built.name = name;
    if (host.hasAttribute('disabled')) built.disabled = true;
    if (host.hasAttribute('required')) built.required = true;
    if (readFlag(host, 'readonly')) built.readOnly = true;
    if (host.textContent && host.textContent.trim()) built.value = host.textContent.trim();
    else if (host.getAttribute('value')) built.value = host.getAttribute('value');
    ENHANCE_ATTRS.forEach((attr) => {
      if (host.hasAttribute(attr)) built.setAttribute(attr, host.getAttribute(attr));
    });
    host.textContent = '';
    host.appendChild(built);
    return textarea(built, options);
  }

  // A schema-built host (<div x-textarea>): wb-lazy's buildSchemaIfNeeded
  // has already built the $view into it before this runs, but the $view only
  // binds placeholder/rows/name/variant. value/disabled/readonly/required/
  // resize are declared in textarea.schema.json and had nowhere to land, so
  // they were silently dropped. Reflect them onto the real <textarea> child,
  // then enhance THAT child.
  //
  // This used to fall through and enhance the host instead, on the belief
  // that host class/style writes were invisible. They were not: input.css's
  // `.x-textarea` rule gave the <div> its own border, padding and min-height
  // around the real field, while the field itself never got its variant
  // class, autosize, counter or maxLength -- the runtime does not dispatch
  // the native textarea behavior onto a schema-built child. (#362)
  if (element.tagName !== 'TEXTAREA') {
    const inner = element.querySelector(':scope > textarea');
    reflectHostAttributes(element, inner);
    return textarea(inner, options);
  }

  const variant = options.variant || element.getAttribute('variant') || 'default';
  if (variant !== 'default') element.classList.add(`x-textarea--${variant}`);

  const config = {
    autosize: options.autosize ?? element.hasAttribute('autosize'),
    maxLength: parseInt(options.maxLength || element.getAttribute('max-length') || '0'),
    showCount: options.showCount ?? element.hasAttribute('show-count'),
    minRows: parseInt(options.minRows || element.getAttribute('min-rows') || '2'),
    maxRows: parseInt(options.maxRows || element.getAttribute('max-rows') || '10'),
    size: options.size || element.getAttribute('size') || 'md',
    resize: options.resize || readAttr(element, 'resize', 'vertical'),
    ...options
  };

  element.classList.add('x-textarea');
  if (element.tagName === 'TEXTAREA') enhanced.add(element);

  // max-length used to be read only to colour the counter: typing past it
  // left the whole value in place and the counter just read "20/10". The
  // native maxLength property is what actually stops input (and paste), so
  // set it -- on the real <textarea>, which is `element` here.
  if (config.maxLength > 0 && element.tagName === 'TEXTAREA') element.maxLength = config.maxLength;
  
  // #671 -- John: "variants not being followed". This used to also set
  // borderRadius/border/background/color inline. Inline styles beat every
  // stylesheet rule regardless of specificity, so the behavior was overriding
  // its OWN variant classes: `x-textarea--error` was applied correctly and
  // input.css's `border-color: var(--danger-color)` could never win, making
  // every variant look identical to plain.
  //
  // input.css's `.x-input, .x-textarea` rule already sets all four to the
  // same theme tokens, so nothing is lost by dropping them here -- and the
  // hardcoded #374151/#1f2937/#f9fafb fallbacks go with them, which had no
  // business living outside themes.css.
  //
  // #779: what used to stay inline is gone too. `resize` is one of the four
  // .x-textarea--resize-* classes; the 2-row min-height is textarea.x-textarea
  // in input.css, and only a different min-rows travels, as a generated rule.
  // The per-size padding was already .x-textarea / .x-textarea--{size} with
  // identical values, so that write is simply deleted.
  const resizeMode = config.autosize ? 'none' : (RESIZE_VALUES.includes(config.resize) ? config.resize : 'vertical');
  RESIZE_VALUES.forEach((r) => element.classList.toggle(`x-textarea--resize-${r}`, r === resizeMode));
  if (config.minRows !== 2) setRule(element, 'min-height', { minHeight: `${config.minRows * 1.5}rem` });

  if (config.size !== 'md') {
    element.classList.add(`x-textarea--${config.size}`);
  }

  if (config.autosize) {
    element.classList.add('x-textarea--autosize');
    // The measured height is a runtime value: a generated rule, never
    // element.style (#779). Reset to auto first so scrollHeight reports the
    // content's own height rather than the height last applied.
    const resize = () => {
      setRule(element, 'autosize', { height: 'auto' });
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 24;
      const maxHeight = config.maxRows * lineHeight;
      const newHeight = Math.min(element.scrollHeight, maxHeight);
      setRule(element, 'autosize', {
        height: newHeight + 'px',
        overflowY: element.scrollHeight > maxHeight ? 'auto' : 'hidden',
      });
    };
    element.addEventListener('input', resize);
    resize();
  }

  let counter = null;
  if (config.showCount) {
    element.classList.add('x-textarea--has-counter');
    
    // Create wrapper to hold counter
    const counterWrapper = document.createElement('div');
    counterWrapper.className = 'x-textarea-wrapper';
    
    if (element.parentNode) {
      element.parentNode.insertBefore(counterWrapper, element);
    }
    counterWrapper.appendChild(element);

    counter = document.createElement('div');
    // Styled by .x-textarea__counter (and --over) in input.css (#779).
    counter.className = 'x-textarea__counter';

    const update = () => {
      const len = (element.value || '').length;
      counter.textContent = config.maxLength ? `${len}/${config.maxLength}` : `${len}`;
      
      counter.classList.toggle('x-textarea__counter--over', !!(config.maxLength && len > config.maxLength));
    };
    element.addEventListener('input', update);
    counterWrapper.appendChild(counter);
    update();
  }

  return () => {
    enhanced.delete(element);
    clearRules(element);
    element.classList.remove('x-textarea');
    if (config.size !== 'md') {
      element.classList.remove(`x-textarea--${config.size}`);
    }
    if (counter && counter.parentNode) {
      // Unwrap
      const cleanupWrapper = counter.parentNode;
      if (cleanupWrapper.parentNode) {
        cleanupWrapper.parentNode.insertBefore(element, cleanupWrapper);
        cleanupWrapper.remove();
      }
    }
  };
}

export default { textarea };
