/**
 * Switch - Toggle switch component
 * Helper Attribute: [x-behavior="switch"]
 *
 * Wires the schema-built <div x-switch> host: its inner <input> becomes a real
 * checkbox, the host's checked/disabled/label/name/value are reflected onto it,
 * and clicking (or Space/Enter) toggles it. The CSS (switch.css) shows the ON
 * state via `.x-switch__input:checked ~ .x-switch__track`. Also supports the
 * legacy form where the element IS a bare <input type=checkbox>. (#197)
 */
import { createToast } from '../feedback.js';

export function switchInput(element, options = {}) {
  const host = element;
  const isBareCheckbox = host.tagName === 'INPUT' && host.type === 'checkbox';
  let input = isBareCheckbox ? host : host.querySelector('input');

  // Neither a bare checkbox nor a schema-built <div x-switch> host (which
  // pre-builds input/track/thumb via switch.schema.json's $view) — e.g.
  // x-switch on a plain <div>. Self-build the same input+track+thumb
  // structure switch.schema.json builds, as direct siblings (switch.css's
  // `.x-switch__input:checked ~ .x-switch__track` needs them adjacent),
  // so x-switch renders identically to <div x-switch> regardless of dispatch
  // path. Mirrors tabs.js's "build from children if no pre-rendered
  // structure exists" pattern. (#279)
  if (!isBareCheckbox && !input) {
    input = document.createElement('input');
    input.type = 'checkbox';
    host.appendChild(input);

    const track = document.createElement('span');
    track.className = 'x-switch__track';
    const thumb = document.createElement('span');
    thumb.className = 'x-switch__thumb';
    track.appendChild(thumb);
    host.appendChild(track);
  }

  if (!input) return () => {};

  // Schema-built <div x-switch> gets this from its baseClass; the self-built
  // path above bypasses schema entirely, so add it explicitly here too —
  // makes `.x-switch` a reliable selector regardless of dispatch path.
  // #448: skip it specifically for a literal <div x-switch> HOST -- that just
  // duplicated the tag name, and switch.css now also selects the
  // `[x-switch]` TAG directly. Still added for the bare-<input>/self-built
  // x-switch-on-a-<div> cases above, which aren't the `[x-switch]` tag and
  // still need the class.
  if (host.tagName.toLowerCase() !== 'x-switch') host.classList.add('x-switch');

  // switch.schema.json declares size/variant with appliesClass:
  // "x-switch--{{value}}" -- but that's SCHEMA-BUILDER's mechanism, and
  // schema-builder.js never runs at all on a wb-lazy.js-only page (test
  // harness, standalone demos/*.html -- no schema pass, ever, regardless of
  // eager/lazy scan timing). The self-built fallback above only replicates
  // the DOM structure schema would have built, not the classes schema would
  // have applied -- so every switch silently lost its size/variant styling
  // on those pages (confirmed live: <div x-switch size="lg" variant="success">
  // built correctly as input+track+thumb but with class="[x-switch]" only,
  // no x-switch--lg/--success). Reading and applying them here directly
  // matches the pattern every other component in this file (card.js,
  // badge(), progress()) already uses, and is idempotent alongside
  // schema-builder's own class application on pages where it DOES run.
  if (!isBareCheckbox) {
    const size = host.getAttribute('size');
    if (size) host.classList.add(`x-switch--${size}`);
    const variant = host.getAttribute('variant');
    if (variant) host.classList.add(`x-switch--${variant}`);
  }

  // The schema builds a typeless <input> (renders as text) — make it a checkbox.
  if (input.type !== 'checkbox') input.type = 'checkbox';
  input.classList.add('x-switch__input');
  // role="switch" on the real checkbox is a standard ARIA attribute browsers
  // increasingly use to render native switch affordance directly (Safari
  // does this today) -- unconditional (bare-checkbox path included) so it
  // applies regardless of dispatch path, not just the schema/self-built host.
  input.setAttribute('role', 'switch');

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
    if (label && !host.querySelector('[class*="[x-switch]__label"]')) {
      const span = document.createElement('span');
      span.className = 'x-switch__label-end';
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

  // Optional: <div x-switch theme-control> drives the page theme (data-theme).
  // ON = dark, OFF = light. Initial state reflects the current theme. (#210)
  let applyTheme = null;
  if (!isBareCheckbox && host.hasAttribute('theme-control')) {
    const root = document.documentElement;
    input.checked = (root.getAttribute('data-theme') || 'dark') !== 'light';
    sync();
    applyTheme = () => root.setAttribute('data-theme', input.checked ? 'dark' : 'light');
    input.addEventListener('change', applyTheme);
  }

  // Optional: <div x-switch notify-control> demonstrates what the switch
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
