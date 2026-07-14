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
import { createToast } from '../feedback.js';

export function switchInput(element, options = {}) {
  const host = element;
  const isBareCheckbox = host.tagName === 'INPUT' && host.type === 'checkbox';
  let input = isBareCheckbox ? host : host.querySelector('input');

  // Neither a bare checkbox nor a schema-built <wb-switch> host (which
  // pre-builds input/track/thumb via switch.schema.json's $view) — e.g.
  // x-switch on a plain <div>. Self-build the same input+track+thumb
  // structure switch.schema.json builds, as direct siblings (switch.css's
  // `.wb-switch__input:checked ~ .wb-switch__track` needs them adjacent),
  // so x-switch renders identically to <wb-switch> regardless of dispatch
  // path. Mirrors tabs.js's "build from children if no pre-rendered
  // structure exists" pattern. (#279)
  if (!isBareCheckbox && !input) {
    input = document.createElement('input');
    input.type = 'checkbox';
    host.appendChild(input);

    const track = document.createElement('span');
    track.className = 'wb-switch__track';
    const thumb = document.createElement('span');
    thumb.className = 'wb-switch__thumb';
    track.appendChild(thumb);
    host.appendChild(track);
  }

  if (!input) return () => {};

  // Schema-built <wb-switch> gets this from its baseClass; the self-built
  // path above bypasses schema entirely, so add it explicitly here too —
  // makes `.wb-switch` a reliable selector regardless of dispatch path.
  host.classList.add('wb-switch');

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

  // Optional: <wb-switch theme-control> drives the page theme (data-theme).
  // ON = dark, OFF = light. Initial state reflects the current theme. (#210)
  let applyTheme = null;
  if (!isBareCheckbox && host.hasAttribute('theme-control')) {
    const root = document.documentElement;
    input.checked = (root.getAttribute('data-theme') || 'dark') !== 'light';
    sync();
    applyTheme = () => root.setAttribute('data-theme', input.checked ? 'dark' : 'light');
    input.addEventListener('change', applyTheme);
  }

  // Optional: <wb-switch notify-control> demonstrates what the switch
  // actually does — toggling it ON fires a real toast, OFF is silent.
  // A demo switch labeled "Notifications" that just flips visually with
  // no observable effect doesn't show what it does (docs/standards/
  // DEMOS-AND-DOCS-STANDARDS.md — demo switches must invoke their effect).
  let notifyOnChange = null;
  if (!isBareCheckbox && host.hasAttribute('notify-control')) {
    notifyOnChange = () => {
      if (input.checked) {
        createToast(host.getAttribute('label') ? `${host.getAttribute('label')} enabled` : 'Notifications enabled', 'success');
      }
    };
    input.addEventListener('change', notifyOnChange);
  }

  return () => {
    host.removeEventListener('click', onClick);
    host.removeEventListener('keydown', onKey);
    input.removeEventListener('change', sync);
    if (applyTheme) input.removeEventListener('change', applyTheme);
    if (notifyOnChange) input.removeEventListener('change', notifyOnChange);
  };
}

export default switchInput;
