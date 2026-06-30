/**
 * Switch - Toggle switch component
 * Helper Attribute: [x-behavior="switch"]
 *
 * Wires the schema-built <wb-switch> host: its inner <input> becomes a real
 * checkbox, the host's checked/disabled/label/name/value are reflected onto it,
 * and clicking (or Space/Enter) toggles it. The CSS (switch.css) shows the ON
 * state via `.wb-switch__input:checked ~ .wb-switch__track`. Also supports the
 * legacy form where the element IS a bare <input type=checkbox>. (#197)
 */
export function switchInput(element, options = {}) {
  const host = element;
  const isBareCheckbox = host.tagName === 'INPUT' && host.type === 'checkbox';
  let input = isBareCheckbox ? host : host.querySelector('input');
  if (!input) return () => {};

  // The schema builds a typeless <input> (renders as text) — make it a checkbox.
  if (input.type !== 'checkbox') input.type = 'checkbox';
  input.classList.add('wb-switch__input');

  if (!isBareCheckbox) {
    // Reflect host attributes onto the real checkbox.
    if (host.hasAttribute('checked')) input.checked = true;
    if (host.hasAttribute('disabled')) {
      input.disabled = true;
      host.setAttribute('aria-disabled', 'true');
    }
    const name = host.getAttribute('name');
    if (name) input.name = name;
    const val = host.getAttribute('value');
    if (val) input.value = val;

    // The schema only builds a label span for certain labelPosition values, so
    // the label often never renders — ensure it is shown.
    const label = host.getAttribute('label');
    if (label && !host.querySelector('[class*="wb-switch__label"]')) {
      const span = document.createElement('span');
      span.className = 'wb-switch__label-end';
      span.textContent = label;
      host.appendChild(span);
    }

    host.setAttribute('role', 'switch');
    host.setAttribute('aria-checked', String(input.checked));
    if (!input.disabled && !host.hasAttribute('tabindex')) host.setAttribute('tabindex', '0');
  }

  const sync = () => {
    if (!isBareCheckbox) host.setAttribute('aria-checked', String(input.checked));
  };

  const toggle = () => {
    if (input.disabled) return;
    input.checked = !input.checked;
    sync();
    input.dispatchEvent(new Event('change', { bubbles: true }));
    host.dispatchEvent(new CustomEvent('wb:switch:change', { bubbles: true, detail: { checked: input.checked } }));
  };

  const onClick = (e) => {
    // A direct click on the (hidden) checkbox already toggled it natively.
    if (e.target === input) { sync(); return; }
    e.preventDefault();
    toggle();
  };
  const onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
  };

  host.addEventListener('click', onClick);
  if (!isBareCheckbox) host.addEventListener('keydown', onKey);
  input.addEventListener('change', sync);

  return () => {
    host.removeEventListener('click', onClick);
    host.removeEventListener('keydown', onKey);
    input.removeEventListener('change', sync);
  };
}

export default switchInput;
