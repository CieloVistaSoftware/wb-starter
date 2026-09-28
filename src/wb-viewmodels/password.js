import { readFlag } from '../core/read-attr.js';
// Standalone password behavior extracted from enhancements.js
export function password(element, options = {}) {
  const config = {
    toggle: options.toggle ?? element.getAttribute('toggle') !== 'false',
    strength: options.strength ?? readFlag(element, 'strength'),
    ...options
  };
  if (!element.parentNode) {
    console.warn('[x-password] Element not in DOM, skipping');
    return () => {};
  }
  // Native attribute Chrome/password managers actually rely on -- without
  // it, DevTools warns "Password field is not contained in a form" /
  // recommends autocomplete. Respects an explicit author value; defaults to
  // "new-password" for a signup-shaped name (name/id contains "new" or
  // "confirm"), "current-password" otherwise (the more common login case).
  if (!element.hasAttribute('autocomplete')) {
    const hint = `${element.name || ''} ${element.id || ''}`.toLowerCase();
    element.autocomplete = /new|confirm|signup|register/.test(hint) ? 'new-password' : 'current-password';
  }
  const wrapper = document.createElement('div');
  // #779: wrapper, field, toggle and strength meter are .x-password* rules
  // in password.css -- they were cssText blocks here.
  wrapper.className = 'x-password';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  element.classList.add('x-password__input');
  if (config.toggle) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'x-password__toggle';
    toggleBtn.textContent = '👁️';
    toggleBtn.title = 'Show password';
    toggleBtn.onclick = () => {
      const isPassword = element.type === 'password';
      element.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
      toggleBtn.title = isPassword ? 'Hide password' : 'Show password';
    };
    // Hover: `.x-password__toggle:hover` in password.css (#779).
    wrapper.appendChild(toggleBtn);
  }
  if (config.strength) {
    const meter = document.createElement('div');
    meter.className = 'x-password__strength';
    const bar = document.createElement('div');
    // Width and colour follow the 0-4 score: x-password__strength-bar--s{n}.
    bar.className = 'x-password__strength-bar x-password__strength-bar--s0';
    meter.appendChild(bar);
    wrapper.appendChild(meter);
    element.addEventListener('input', () => {
      const score = getPasswordStrength(element.value);
      bar.className = `x-password__strength-bar x-password__strength-bar--s${score}`;
    });
  }
  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
    element.classList.remove('x-password__input');
  };
}
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}
