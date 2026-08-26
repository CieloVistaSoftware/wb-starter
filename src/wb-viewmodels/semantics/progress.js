/**
 * Progress - a labeled, variant-colored fill bar
 * Helper Attribute: [x-behavior="progress"]
 *
 * Authoring forms: <progress value="60">, <div x-progress value="60">,
 * <div x-progressbar value="60"> (src/core/tag-map.js).
 */

/**
 * #848: 4.0.0 removed the <wb-progress> component tag and
 * scripts/migrate-wb-tags.mjs rewrote every occurrence into a native
 * <progress> (src/core/tag-map.js:90 maps `progress` -> the `progress`
 * behavior, and the migration inverts that map to pick the host tag).
 *
 * That host cannot work. A native <progress> is a REPLACED element: its
 * light-DOM children are never slotted into the UA shadow root, so they sit
 * outside the flat tree entirely -- laid out at 0x0, and the cascade does not
 * even reach them (confirmed live: a .x-progress__bar placed inside a
 * <progress> computes to width 0, animationName "none", backgroundImage
 * "none", height "auto"). Every fill div, % label and stripe this behavior
 * renders was therefore invisible, and no stylesheet change could have fixed
 * it. Before 4.0.0 the renderer below was only ever reached by <wb-progress>,
 * which is why nothing noticed.
 *
 * So swap the host for a neutral <div> and carry the authored identity across.
 * The result is the same DOM <wb-progress> produced before 4.0.0 -- a host
 * with role="progressbar" + aria-valuenow/min/max -- which is exactly the
 * "complete, documented ARIA-widget reimplementation" that
 * tests/regression/semantic-element-fidelity.spec.ts records this component as
 * shipping in place of the native tag. Same pattern as semantics/details.js,
 * semantics/audio.js and form.js, all of which replace a host they cannot
 * render into.
 *
 * @param {Element} element
 * @returns {Element} the element to render into -- the original unless it was
 *   a native <progress>, in which case its <div> replacement.
 */
function hostFor(element) {
  if (element.tagName !== 'PROGRESS') return element;

  const host = document.createElement('div');
  // Every authored attribute, not a hand-picked list: id, class and style
  // carry the page's own layout decisions, and value/max/variant/size/
  // striped/animated/indeterminate/label/show-value/show-label are the
  // component's whole API. A list here would silently drop whatever
  // progress.schema.json adds next.
  for (const { name, value } of Array.from(element.attributes)) {
    host.setAttribute(name, value);
  }
  // Slot content is read below as the authored-value fallback; schema-builder
  // stashes it on _wbOriginalSlot before wiping innerHTML, so carry both.
  if (element._wbOriginalSlot) host._wbOriginalSlot = element._wbOriginalSlot;
  host.innerHTML = element.innerHTML;

  element.replaceWith(host);
  return host;
}

export function progress(element, options = {}) {
  const host = hostFor(element);

  const authoredValue = (host._wbOriginalSlot || host.textContent || '').trim();
  const size = options.size || host.getAttribute('size') || 'md';
  const variant = options.variant || host.getAttribute('variant') || 'primary';

  const state = {
    value: parseFloat(options.value ?? host.getAttribute('value') ?? authoredValue ?? 0),
    max: parseFloat(options.max ?? host.getAttribute('max') ?? 100),
    striped: options.striped ?? host.hasAttribute('striped'),
    // Schema declares animated/indeterminate/showValue (progress.schema.json);
    // all three are read here, on the only path that renders.
    animated: options.animated ?? (host.getAttribute('animated') !== 'false'),
    indeterminate: options.indeterminate ?? host.hasAttribute('indeterminate'),
    // The % label is built in by default (#280) -- no external .progress-label
    // span needed. `label="..."` overrides the text; `show-label="false"` hides
    // it. showValue appends the percentage alongside a CUSTOM label instead of
    // dropping it in favor of the label text.
    showLabel: options.showLabel ?? (host.getAttribute('show-label') !== 'false'),
    showValue: options.showValue ?? host.hasAttribute('show-value'),
    label: options.label ?? host.getAttribute('label'),
  };

  // #848: `x-progress`, not a bare `progress`. The 4.0.0 class rename turned
  // `wb-progress` into `progress` here rather than `x-progress`, so the BEM
  // block and its elements stopped sharing a prefix with the stylesheet --
  // .x-progress / .x-progress__bar / .x-progress__label in
  // src/styles/behaviors/progress.css matched nothing, and the fill rendered
  // at height 0 with no error anywhere.
  const BLOCK = 'x-progress';

  function render() {
    const pct = Math.max(0, Math.min(100, (state.value / state.max) * 100));
    const labelText = state.label
      ? (state.showValue ? `${state.label} ${Math.round(pct)}%` : state.label)
      : `${Math.round(pct)}%`;

    host.classList.add(BLOCK, `${BLOCK}--${size}`, `${BLOCK}--${variant}`);
    host.classList.toggle(`${BLOCK}--labeled`, !!state.showLabel);
    host.classList.toggle(`${BLOCK}--indeterminate`, !!state.indeterminate);
    // .x-progress--animated is a DESCENDANT selector in progress.css
    // (`.x-progress--animated .x-progress__bar { ... }`) -- it must live on the
    // host, same as the size/variant classes above, not on the bar div.
    host.classList.toggle(`${BLOCK}--animated`, !!state.animated && !state.indeterminate);

    host.setAttribute('role', 'progressbar');
    host.setAttribute('aria-valuenow', String(state.value));
    host.setAttribute('aria-valuemin', '0');
    host.setAttribute('aria-valuemax', String(state.max));

    host.innerHTML = '';

    const bar = document.createElement('div');
    bar.className = `${BLOCK}__bar` + (state.striped ? ` ${BLOCK}__bar--striped` : '');
    // Indeterminate leaves the width to the sweep keyframes (progress.css).
    bar.style.width = state.indeterminate ? '' : `${pct}%`;
    host.appendChild(bar);

    if (state.showLabel && !state.indeterminate) {
      const label = document.createElement('span');
      label.className = `${BLOCK}__label`;
      label.textContent = labelText;
      host.appendChild(label);
    }
  }

  render();

  // Imperative API. Previously only the native-<progress> branch defined this;
  // that branch is gone (its ::-webkit-progress-bar/-value selectors could
  // only ever match a host this behavior no longer keeps), so the documented
  // API lives on the renderer that survives.
  host.wbProgress = {
    setValue: (v) => {
      state.value = Math.max(0, Math.min(parseFloat(v), state.max));
      render();
    },
    getValue: () => state.value,
    setMax: (m) => {
      state.max = parseFloat(m);
      render();
    },
    getPercent: () => (state.value / state.max) * 100,
    setIndeterminate: (indeterminate) => {
      state.indeterminate = !!indeterminate;
      render();
    },
  };

  return () => {
    host.innerHTML = '';
    delete host.wbProgress;
    host.classList.remove(
      BLOCK,
      `${BLOCK}--${size}`,
      `${BLOCK}--${variant}`,
      `${BLOCK}--labeled`,
      `${BLOCK}--indeterminate`,
      `${BLOCK}--animated`
    );
  };
}

export default { progress };
