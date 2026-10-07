import { readAttr } from '../../core/read-attr.js';
import { moveKeepingFocus } from '../../core/keep-focus.js';
/**
 * Radio - Enhanced <input type="radio"> element
 * Adds visual enhancements, labels, radio groups
 * Written as a plain <input type="radio"> (it IS the behavior), or x-radio.
 * Attributes: label, variant, size -- declared in src/wb-models/radio.schema.json.
 */

// Styles live in src/styles/behaviors/input.css (loaded for radio by the
// behavior CSS manifest). They used to be injected from here, where the
// variant and size rules lost to input.css's input.x-radio (#1154).

export function radio(element, options = {}) {
  // Any element can carry an x-* behavior. <div x-radio variant="success">
  // used to warn and do nothing, so every attribute-form row on the behaviors
  // page was the same bare div (#1154). On a container host, build the real
  // radio inside it and enhance that, reading the host's options -- the same
  // approach range.js takes for <div x-range>.
  if (element.tagName !== 'INPUT') {
    let input = element.querySelector(':scope > input[type="radio"], :scope > .x-radio-wrapper > input[type="radio"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'radio';
      for (const attr of ['name', 'value', 'checked', 'disabled']) {
        if (element.hasAttribute(attr)) input.setAttribute(attr, element.getAttribute(attr));
      }
      element.textContent = '';
      element.appendChild(input);
    }
    const hostOptions = {};
    for (const key of ['label', 'variant', 'size']) {
      const value = element.getAttribute(key);
      if (value) hostOptions[key] = value;
    }
    return radio(input, { ...hostOptions, ...options });
  }
  if (element.type !== 'radio') {
    console.warn('[radio] An <input> host must be type="radio"');
    return () => {};
  }

  const config = {
    label: options.label || element.getAttribute('label') || readAttr(element, 'label') || '',
    variant: options.variant || element.getAttribute('variant') || readAttr(element, 'variant') || 'default',
    size: options.size || element.getAttribute('size') || readAttr(element, 'size') || 'md',
    ...options
  };

  element.classList.add('x-radio');

  // Wrap in label if label text provided
  let wrapper = null;
  if (config.label && element.parentElement?.tagName !== 'LABEL') {
    wrapper = document.createElement('label');
    wrapper.className = 'x-radio-wrapper';
    
    moveKeepingFocus(element, () => {   // #961
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    });

    const labelText = document.createElement('span');
    labelText.className = 'x-radio-label';
    labelText.textContent = config.label;
    wrapper.appendChild(labelText);
  } else if (element.parentElement?.tagName === 'LABEL') {
    element.parentElement.classList.add('x-radio-wrapper');
  }

  // Apply size variant
  if (config.size) {
    element.classList.add(`x-radio--${config.size}`);
  }

  // Apply visual variant. 'default' (the schema's default, #1154) is the
  // theme's primary colour, which .x-radio already has -- no class for it.
  if (config.variant && config.variant !== 'default') {
    element.classList.add(`x-radio--${config.variant}`);
  }

  return () => {
    element.classList.remove('x-radio', `x-radio--${config.variant}`, `x-radio--${config.size}`);
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}

export default { radio };
