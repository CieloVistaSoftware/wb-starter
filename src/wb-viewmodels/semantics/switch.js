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

  // #931: a bare <input type="checkbox" x-switch> used to be RECOGNISED here
  // and then excluded from the only branch that builds the switch UI, so the
  // most semantic host available rendered as a plain checkbox while
  // <div x-switch> worked. Law 0 inverted.
  //
  // It cannot be styled in place: switch.css hides the checkbox with
  // `[x-switch] input`, a DESCENDANT selector that cannot match when the host
  // IS the input, and `.x-switch`'s inline-flex lands on the <input> where it
  // does nothing. So give it the same structure the schema builds and wrap it.
  // Precedent: details.js wraps non-<details> hosts.
  //
  // `container` is the element that carries the switch's own classes and
  // label. For every other host it IS the host, so nothing else changes.
  let container = host;
  const existingWrap = isBareCheckbox && host.parentElement?.classList.contains('x-switch')
    ? host.parentElement
    : null;
  if (existingWrap) {
    // Already wrapped by a previous scan. Adopt that wrapper as the container
    // -- leaving `container` as the input made every later container lookup
    // search the wrong element, so the label guard below never found the span
    // it had already added and appended a second one on each re-scan.
    container = existingWrap;
  } else if (isBareCheckbox) {
    container = document.createElement('span');
    container.className = 'x-switch';
    host.replaceWith(container);
    container.appendChild(host);
    host.classList.add('x-switch__input');

    const track = document.createElement('span');
    track.className = 'x-switch__track';
    const thumb = document.createElement('span');
    thumb.className = 'x-switch__thumb';
    track.appendChild(thumb);
    container.appendChild(track);
    // `.x-switch__input:checked ~ .x-switch__track` is a general-sibling
    // selector, so the existing stylesheet drives this shape unchanged.
  }

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
  container.classList.add('x-switch');

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
  {
    // #931: no longer skipped for a bare checkbox -- it now has a container to
    // carry these, and size/variant are as meaningful there as anywhere.
    const size = host.getAttribute('size');
    if (size) container.classList.add(`x-switch--${size}`);
    const variant = host.getAttribute('variant');
    if (variant) container.classList.add(`x-switch--${variant}`);
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

    host.setAttribute('role', 'switch');
    host.setAttribute('aria-checked', String(input.checked));
    if (!input.disabled && !host.hasAttribute('tabindex')) host.setAttribute('tabindex', '0');
  }

  // The schema only builds a label span for certain labelPosition values, so
  // the label often never renders — ensure it is shown.
  //
  // #931: moved OUT of the `if (!isBareCheckbox)` block. That block mixes three
  // concerns, and only one of them is genuinely bare-specific: reflecting
  // host attributes ONTO the inner input is meaningless when the host IS the
  // input, but the label is not — it now has a container to live in.
  {
    const label = host.getAttribute('label');
    // #930: this read `[class*="[x-switch]__label"]` -- searching for a class
    // attribute CONTAINING the literal substring `[x-switch]__label`. No class
    // name has square brackets in it, so the guard never matched and the label
    // span was appended on every run (duplicate labels on any re-scan). It is
    // the signature of a bulk x-switch -> [x-switch] rewrite that hit a string
    // literal instead of a selector.
    if (label && !container.querySelector('[class*="x-switch__label"]')) {
      const span = document.createElement('span');
      span.className = 'x-switch__label-end';
      span.textContent = label;
      container.appendChild(span);
    }
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

  // #931: on the container, not the host. For a bare checkbox the clickable
  // affordance is the track, a SIBLING of the input, so a listener on the
  // input never saw it. onClick already handles `e.target === input` (a native
  // toggle) so this is safe for every host; for non-bare hosts container IS
  // host and nothing changes.
  container.addEventListener('click', onClick);
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
    container.removeEventListener('click', onClick);
    host.removeEventListener('keydown', onKey);
    input.removeEventListener('change', sync);
    if (applyTheme) input.removeEventListener('change', applyTheme);
    if (notifyOnChange) input.removeEventListener('change', notifyOnChange);
  };
}

export default switchInput;
