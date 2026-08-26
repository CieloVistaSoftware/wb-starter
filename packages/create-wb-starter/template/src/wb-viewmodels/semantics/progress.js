import { readFlag, readAttr } from '../../core/read-attr.js';
/**
 * Progress - Enhanced <progress> element
 * Adds animations, colors, labels, indeterminate state
 * Helper Attribute: [x-behavior="progress"]
 */
export function progress(element, options = {}) {
  // Anything that ISN'T a literal native <progress> tag (custom <progress>,
  // or a plain <div x-progress>) can't paint a fill via
  // ::-webkit-progress-value -- there's no such pseudo-element on a
  // non-native element. Render an explicit fill child instead. (issue #127;
  // gate widened from tagName==='WB-PROGRESS' so x-progress on any element
  // gets the same rich rendering, not just the <progress> tag form — #279.)
  if (element.tagName !== 'PROGRESS') {
    const authoredValue = (element._wbOriginalSlot || element.textContent || '').trim();
    const value = parseFloat(options.value ?? element.getAttribute('value') ?? authoredValue ?? 0);
    const max = parseFloat(options.max ?? element.getAttribute('max') ?? 100);
    const variant = options.variant || element.getAttribute('variant') || 'primary';
    const size = options.size || element.getAttribute('size') || 'md';
    const striped = options.striped ?? element.hasAttribute('striped');
    // Schema declares animated/indeterminate (progress.schema.json) but this
    // branch never read either — only the native <progress>+x-progress path
    // below did, via .x-progress::-webkit-progress-value pseudo-elements
    // that don't exist on this custom tag at all. Result: <progress> —
    // the tag every demo/showcase actually uses — had zero animation
    // capability. CSS for both already existed on .x-progress__bar
    // (progress.css) and was simply unreachable.
    const animated = options.animated ?? (element.getAttribute('animated') !== 'false');
    const indeterminate = options.indeterminate ?? element.hasAttribute('indeterminate');
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    // The % label is built in by default (#280) — no external .progress-label
    // span needed. `label="…"` overrides the text; `show-label="false"` hides it.
    const showLabel = options.showLabel ?? (element.getAttribute('show-label') !== 'false');
    // showValue (schema default false) — declared but never read here either.
    // Distinct from the default percent fallback below: it appends the
    // percentage alongside a CUSTOM label instead of being silently dropped
    // in favor of the label text.
    const showValue = options.showValue ?? element.hasAttribute('show-value');
    const customLabel = options.label ?? element.getAttribute('label');
    const labelText = customLabel
      ? (showValue ? `${customLabel} ${Math.round(pct)}%` : customLabel)
      : `${Math.round(pct)}%`;

    // #448: skip the bare 'x-progress' token on a literal <progress>
    // host -- progress.css selects the `x-progress` TAG directly for that
    // case now. Still added for every OTHER host (x-progress/x-progressbar
    // on a plain <div>, per this file's own docs), since progress.css's
    // `.x-progress` rules still select those by class. The size/variant
    // modifier classes are never redundant either way and always apply.
    if (element.tagName.toLowerCase() !== 'x-progress') element.classList.add('x-progress');
    element.classList.add(`x-progress--${size}`, `x-progress--${variant}`);
    if (showLabel) element.classList.add('x-progress--labeled');
    if (indeterminate) element.classList.add('x-progress--indeterminate');
    // .x-progress--animated is a DESCENDANT selector in progress.css
    // (`.x-progress--animated .x-progress__bar { ... }`) — it must live on
    // the host, same as the size/variant classes above, not on the bar div.
    if (animated && !indeterminate) element.classList.add('x-progress--animated');
    element.setAttribute('role', 'progressbar');
    element.setAttribute('aria-valuenow', String(value));
    element.setAttribute('aria-valuemin', '0');
    element.setAttribute('aria-valuemax', String(max));

    element.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'x-progress__bar' + (striped ? ' x-progress__bar--striped' : '');
    bar.style.width = indeterminate ? '' : `${pct}%`;
    element.appendChild(bar);

    if (showLabel && !indeterminate) {
      const label = document.createElement('span');
      label.className = 'x-progress__label';
      label.textContent = labelText;
      element.appendChild(label);
    }

    return () => {
      element.innerHTML = '';
      element.classList.remove('x-progress', `x-progress--${size}`, `x-progress--${variant}`, 'x-progress--labeled', 'x-progress--indeterminate', 'x-progress--animated');
    };
  }

  const config = {
    value: parseFloat(options.value || element.value || readAttr(element, 'value') || 0),
    max: parseFloat(options.max || element.max || readAttr(element, 'max') || 100),
    showLabel: options.showLabel ?? readFlag(element, 'show-label'),
    animated: options.animated ?? readAttr(element, 'animated') !== 'false',
    variant: options.variant || readAttr(element, 'variant') || 'primary',
    size: options.size || readAttr(element, 'size') || 'md',
    indeterminate: options.indeterminate ?? readFlag(element, 'indeterminate'),
    ...options
  };

  element.classList.add('x-progress');
  element.classList.add(`x-progress--${config.size}`);
  element.classList.add(`x-progress--${config.variant}`);
  
  if (config.indeterminate) {
    element.removeAttribute('value');
    element.classList.add('x-progress--indeterminate');
  } else {
    element.value = config.value;
    element.max = config.max;
  }

  // Size mappings
  const sizes = { sm: '4px', md: '8px', lg: '12px', xl: '16px' };
  const height = sizes[config.size] || sizes.md;

  // Color mappings
  const colors = {
    primary: 'var(--primary, #6366f1)',
    success: 'var(--success, #22c55e)',
    warning: 'var(--warning, #f59e0b)',
    danger: 'var(--danger, #ef4444)',
    info: 'var(--info, #3b82f6)'
  };
  const color = colors[config.variant] || colors.primary;

  // Style the progress element
  Object.assign(element.style, {
    width: '100%',
    height: height,
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'var(--bg-tertiary, #374151)',
    appearance: 'none',
    border: 'none'
  });

  // Inject styles for webkit/moz
  injectProgressStyles();

  // Create wrapper for label
  let wrapper = element.parentNode;
  let label = null;
  
  if (config.showLabel) {
    if (!wrapper.classList.contains('x-progress__wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'x-progress__wrapper';
      Object.assign(wrapper.style, {
        position: 'relative',
        width: '100%'
      });
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    }
    
    label = document.createElement('span');
    label.className = 'x-progress__label';
    Object.assign(label.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--text-primary, #fff)',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
    });
    updateLabel();
    wrapper.appendChild(label);
  }

  function updateLabel() {
    if (label && !config.indeterminate) {
      const percent = Math.round((element.value / element.max) * 100);
      label.textContent = `${percent}%`;
    }
  }

  // Animation class
  if (config.animated && !config.indeterminate) {
    element.classList.add('x-progress--animated');
  }

  // API
  element.wbProgress = {
    setValue: (v) => {
      element.value = Math.max(0, Math.min(v, element.max));
      updateLabel();
    },
    getValue: () => element.value,
    setMax: (m) => {
      element.max = m;
      updateLabel();
    },
    getPercent: () => (element.value / element.max) * 100,
    setIndeterminate: (indeterminate) => {
      config.indeterminate = indeterminate;
      if (indeterminate) {
        element.removeAttribute('value');
        element.classList.add('x-progress--indeterminate');
      } else {
        element.value = config.value;
        element.classList.remove('x-progress--indeterminate');
      }
    }
  };

  return () => {
    element.classList.remove('x-progress', `x-progress--${config.size}`, `x-progress--${config.variant}`);
    if (label) label.remove();
  };
}

function injectProgressStyles() {
  if (document.getElementById('x-progress-css')) return;
  
  const style = document.createElement('style');
  style.id = 'x-progress-css';
  style.textContent = `
    .x-progress::-webkit-progress-bar {
      background: transparent;
      border-radius: inherit;
    }
    .x-progress::-webkit-progress-value {
      background: var(--primary, #6366f1);
      border-radius: inherit;
      transition: width 0.3s ease;
    }
    .x-progress::-moz-progress-bar {
      background: var(--primary, #6366f1);
      border-radius: inherit;
    }
    .x-progress--primary::-webkit-progress-value { background: var(--primary, #6366f1); }
    .x-progress--success::-webkit-progress-value { background: var(--success, #22c55e); }
    .x-progress--warning::-webkit-progress-value { background: var(--warning, #f59e0b); }
    .x-progress--danger::-webkit-progress-value { background: var(--danger, #ef4444); }
    .x-progress--info::-webkit-progress-value { background: var(--info, #3b82f6); }
    
    .x-progress--indeterminate::-webkit-progress-value {
      background: linear-gradient(90deg, transparent, var(--primary, #6366f1), transparent);
      animation: x-progress-indeterminate 1.5s ease-in-out infinite;
    }
    
    @keyframes x-progress-stripes {
      from { background-position: 1rem 0; }
      to { background-position: 0 0; }
    }
    
    @keyframes x-progress-indeterminate {
      0% { margin-left: -100%; width: 100%; }
      50% { margin-left: 0%; width: 100%; }
      100% { margin-left: 100%; width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

export default { progress };
