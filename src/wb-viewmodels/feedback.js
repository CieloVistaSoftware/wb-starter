/**
 * Feedback Behaviors
 * -----------------------------------------------------------------------------
 * User feedback components: toasts, badges, alerts, spinners,
 * progress indicators, skeletons, dividers, breadcrumbs, notifications.
 *
 * RULE: Zero inline styles. CSS targets tags and attributes directly.
 * JS only creates child elements, sets ARIA attributes, and wires events.
 * -----------------------------------------------------------------------------
 */

/**
 * createToast - Programmatic toast creation
 * CSS: src/styles/behaviors/toast.css
 */
export function createToast(message, variant = 'info', duration = 3000) {
  let container = document.querySelector('.wb-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'wb-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `wb-toast wb-toast--${variant}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-dismiss — no close button needed
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('wb-toast--exiting');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

/**
 * Toast Behavior - Click trigger for toast notifications
 * CSS: src/styles/behaviors/toast.css
 *
 * Uses toast-variant to avoid conflict with the element's own variant attribute.
 * Falls back to variant for backwards compat on non-wb-button elements.
 */
export function toast(element, options = {}) {
  if (element._wbToastInit) return () => {};
  element._wbToastInit = true;

  // #458: message/variant/duration are read INSIDE showToast (at click time),
  // not captured once here at bind time. A framework (React, etc.) that
  // re-renders and updates these attributes after the initial mount needs
  // each click to see the CURRENT attribute values -- the _wbToastInit guard
  // above means toast() itself never re-runs for this element, so any value
  // captured out here would stay frozen at whatever it was on first bind
  // forever (confirmed live: a React counter's message attribute changed on
  // every render, but every toast still showed the count from the very first
  // render). options.message/variant/duration (explicit programmatic
  // overrides) are still honored the same way on every click.
  const showToast = () => {
    const message = options.message || element.getAttribute('message') || element.getAttribute('toast-message') || 'Notification';
    const variant = options.variant || element.getAttribute('toast-variant') || element.getAttribute('variant') || 'info';
    const duration = parseInt(options.duration || element.getAttribute('duration') || '3000');
    createToast(message, variant, duration);
    element.dispatchEvent(new CustomEvent('wb:toast:show', {
      bubbles: true,
      detail: { message, variant }
    }));
  };

  element.addEventListener('click', showToast);
  return () => { element.removeEventListener('click', showToast); delete element._wbToastInit; };
}

/**
 * Badge - Status badges
 * CSS: src/styles/behaviors/badge.css
 * CSS targets wb-badge tag and attributes.
 */
export function badge(element, options = {}) {
  const variant = (options.variant || element.getAttribute('variant') || element.getAttribute('badge') || 'default')
    .replace(/\s+/g, '-').toLowerCase();
  const label = options.label ?? element.getAttribute('label');
  const icon = options.icon || element.getAttribute('icon') || '';
  const size = options.size || element.getAttribute('size');
  const pill = options.pill ?? element.hasAttribute('pill');
  const dot = options.dot ?? element.hasAttribute('dot');
  const outline = options.outline ?? element.hasAttribute('outline');
  const removable = options.removable ?? element.hasAttribute('removable');
  // glow → soft pulsing halo in the badge's own variant color, for drawing
  // attention to a "NEW"/"LIVE" badge. Composes with any variant/pill/outline.
  const glow = options.glow ?? element.hasAttribute('glow');

  // #448: skip the bare 'wb-badge' token on a literal <wb-badge> host --
  // badge.css already has a dedicated `wb-badge` tag rule for that case.
  // Still added for every OTHER host (the `badge="..."` semantic attribute
  // on a plain element, per semantic-attributes.js), since badge.css's
  // `.wb-badge` class rule still selects those.
  if (element.tagName.toLowerCase() !== 'wb-badge') element.classList.add('wb-badge');
  element.classList.add(`wb-badge--${variant}`);
  if (size && ['xs', 'sm', 'md', 'lg'].includes(size)) element.classList.add(`wb-badge--${size}`);
  if (pill) element.classList.add('wb-badge--pill');
  if (dot) element.classList.add('wb-badge--dot');
  if (outline) element.classList.add('wb-badge--outline');
  if (glow) element.classList.add('wb-badge--glow');

  if (dot) {
    element.textContent = ''; // a dot badge has no text
    // #415: dot + removable are NOT mutually exclusive -- dot = a small
    // colored indicator instead of a text label, removable = has a
    // close/remove affordance. When both are set, the whole-element 8px
    // circle-collapse (badge.css `.wb-badge--dot`) is scoped off via
    // `:not(.wb-badge--removable)` so there's room for the remove button
    // built below; render the dot itself as a small inline indicator here.
    if (removable && !element.querySelector('.wb-badge__dot')) {
      const dotEl = document.createElement('span');
      dotEl.className = 'wb-badge__dot';
      element.appendChild(dotEl);
    }
  } else {
    // Render the `label` attribute as the badge text — but only if the author
    // didn't already put content inside the tag (children win over label).
    if (label != null && label !== '' && !element.textContent.trim()) {
      element.textContent = label;
    }
    // icon → a small leading glyph/emoji before the label (e.g. "🟢 Live").
    // Inserted as a real element (not baked into the text node) so it can be
    // targeted independently by CSS.
    if (icon && !element.querySelector('.wb-badge__icon')) {
      const iconEl = document.createElement('span');
      iconEl.className = 'wb-badge__icon';
      iconEl.textContent = icon;
      element.insertBefore(iconEl, element.firstChild);
    }
  }

  // removable → append a × button that removes the badge. #415: this must
  // run regardless of `dot` -- a dot badge can (and should) still get a
  // working remove button; it was previously nested inside the `else`
  // above, so `dot` silently swallowed `removable` entirely (neither the
  // dot visual nor the remove button rendered together).
  if (removable && !element.querySelector('.wb-badge__remove')) {
    element.classList.add('wb-badge--removable');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wb-badge__remove';
    btn.setAttribute('aria-label', 'Remove');
    btn.textContent = '×';
    btn.addEventListener('click', (e) => { e.stopPropagation(); element.remove(); });
    element.appendChild(btn);
  }

  return () => {
    element.classList.remove('wb-badge', `wb-badge--${variant}`, 'wb-badge--pill', 'wb-badge--dot', 'wb-badge--outline', 'wb-badge--glow', 'wb-badge--removable');
  };
}

/**
 * Progress - Animated progress bars
 * CSS: src/styles/behaviors/progress.css
 * @deprecated Behavior routing moved to semantics/progress.js (2026-02-09).
 */
export function progress(element, options = {}) {
  const value = parseInt(options.value || element.getAttribute('value') || '0');
  const max = parseInt(options.max || element.getAttribute('max') || '100');
  const animated = options.animated ?? element.hasAttribute('animated');
  const striped = options.striped ?? element.hasAttribute('striped');

  const pct = Math.min(100, (value / max) * 100);

  element.setAttribute('role', 'progressbar');
  element.setAttribute('aria-valuenow', value);
  element.setAttribute('aria-valuemin', '0');
  element.setAttribute('aria-valuemax', max);
  if (striped) element.setAttribute('striped', '');

  element.innerHTML = '';
  const bar = document.createElement('div');
  // Width is the ONE exception — it's dynamic data, not styling
  bar.style.width = animated ? '0%' : `${pct}%`;
  element.appendChild(bar);

  if (animated) {
    setTimeout(() => { bar.style.width = `${pct}%`; }, 50);
  }

  element.wbProgress = {
    setValue: (v) => {
      const b = element.querySelector('div');
      if (b) b.style.width = `${(v / max) * 100}%`;
      element.setAttribute('aria-valuenow', v);
    },
    reanimate: () => {
      const b = element.querySelector('div');
      if (b) {
        b.style.width = '0%';
        setTimeout(() => { b.style.width = `${pct}%`; }, 50);
      }
    }
  };

  return () => { element.innerHTML = ''; };
}

/**
 * Spinner - Loading spinner
 * CSS: already in site.css — targets .wb-spinner div with sizes/colors/speeds.
 * CSS uses wb-spinner[size="lg"], wb-spinner[color="success"], wb-spinner[speed="fast"]
 */
export function spinner(element, options = {}) {
  if (element._wbSpinnerInit) return () => {};
  element._wbSpinnerInit = true;

  element.setAttribute('role', 'status');
  element.setAttribute('aria-label', 'Loading');
  element.innerHTML = '';

  // spinner.schema.json declares size default:"md" -- that default used to
  // apply via schema property processing for the <wb-spinner> tag form, but
  // x-spinner (or any non-schema dispatch path) never went through schema
  // at all, so the class never got added. .wb-spinner div (no size
  // modifier) has no width/height of its own -- the ring collapsed to
  // basically nothing. Confirmed live: <div x-spinner> rendered ~4x too
  // small vs <wb-spinner>. Default here so the behavior itself, not schema,
  // is the single source of truth for this default (#279).
  const size = options.size || element.getAttribute('size') || 'md';
  const variant = options.variant || options.color || element.getAttribute('variant') || element.getAttribute('color');
  const speed = options.speed || element.getAttribute('speed');
  // #448: no classList.add('wb-spinner') -- effects.css/site.css's
  // .wb-spinner selectors were converted to the `wb-spinner` TAG (no live
  // demo/page usage of x-spinner on a non-<wb-spinner> element was found,
  // so there's nothing else the bare class needs to keep matching).
  if (size) element.classList.add(`wb-spinner--${size}`);
  if (variant) element.classList.add(`wb-spinner--${variant}`);
  if (speed) element.classList.add(`wb-spinner--${speed}`);

  const ring = document.createElement('div');
  element.appendChild(ring);

  return () => {
    element.innerHTML = '';
    delete element._wbSpinnerInit;
  };
}

/**
 * Avatar - User avatars
 * CSS: src/styles/behaviors/avatar.css
 * CSS targets <wb-avatar> tag and attributes directly.
 * JS only creates child elements.
 */
export function avatar(element, options = {}) {
  const src = options.src || element.getAttribute('src') || '';
  const initials = options.initials || element.getAttribute('initials') || '';
  const name = options.name || element.getAttribute('name') || '';
  const status = options.status || element.getAttribute('status') || '';

  const displayInitials = initials || (name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?');

  element.innerHTML = '';

  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    element.appendChild(img);
  } else {
    element.textContent = displayInitials;
  }

  if (status) {
    const dot = document.createElement('span');
    dot.className = `wb-avatar__status--${status}`;
    element.appendChild(dot);
  }

  return () => {};
}

/**
 * Chip - Removable chips/tags
 * CSS: src/styles/behaviors/chip.css
 */
export function chip(element, options = {}) {
  const label = options.label ?? element.getAttribute('label') ?? '';
  const icon = options.icon || element.getAttribute('icon') || '';
  // Bare (dismissible) and data-prefixed (data-dismissible) attributes both
  // opt in -- consistent with cardBase()'s clickable/elevated dual-check
  // (card.js) elsewhere in this project; a caller shouldn't need to know
  // which convention a given behavior happens to check.
  const dismissible = options.dismissible ?? (element.hasAttribute('dismissible') || element.hasAttribute('data-dismissible'));
  const disabled = options.disabled ?? (element.hasAttribute('disabled') || element.hasAttribute('data-disabled'));
  const outlined = options.outlined ?? (element.hasAttribute('outlined') || element.hasAttribute('data-outlined'));
  const variant = options.variant || element.getAttribute('variant') || 'default';
  const size = options.size || element.getAttribute('size') || 'md';

  // #448 made this tag-only ("chip.css selects the wb-chip TAG directly
  // now") on the assumption chip() only ever runs on a real <wb-chip>. #521
  // adds a second authoring form -- <span x-chip> -- where the tag ISN'T
  // wb-chip, so chip.css's bare `wb-chip {}` selector can't reach it at
  // all without the class. Same guard buildStructure() already uses
  // (schema-builder.js) for the identical reason: skip only when the tag
  // itself already IS the base class, to avoid #478's redundant-class
  // violation on real <wb-chip> elements.
  if (element.tagName.toLowerCase() !== 'wb-chip') element.classList.add('wb-chip');
  element.classList.toggle(`wb-chip--${variant}`, variant !== 'default');
  element.classList.toggle(`wb-chip--${size}`, size !== 'md');
  element.classList.toggle('wb-chip--outlined', outlined);
  element.classList.toggle('wb-chip--disabled', disabled);
  if (disabled) element.setAttribute('aria-disabled', 'true');

  element.innerHTML = '';

  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'wb-chip__icon';
    iconEl.textContent = icon;
    element.appendChild(iconEl);
  }

  const labelEl = document.createElement('span');
  labelEl.className = 'wb-chip__label';
  labelEl.textContent = label;
  element.appendChild(labelEl);

  if (dismissible && !disabled) {
    const btn = document.createElement('wb-button');
    btn.className = 'wb-chip__remove';
    btn.textContent = '\u00d7';
    btn.setAttribute('aria-label', 'Remove');
    btn.addEventListener('click', () => {
      element.dispatchEvent(new CustomEvent('wb:chip:remove', { bubbles: true }));
      element.remove();
    });
    element.appendChild(btn);
  }

  return () => {
    element.classList.remove('wb-chip', `wb-chip--${variant}`, `wb-chip--${size}`, 'wb-chip--outlined', 'wb-chip--disabled');
    element.innerHTML = '';
  };
}

/**
 * Alert - Alert messages
 * CSS: src/styles/behaviors/alert.css
 */
export function alert(element, options = {}) {
  const variant = options.variant || element.getAttribute('variant') || 'info';
  const message = options.message || element.getAttribute('message') || '';
  const title = options.title || element.getAttribute('title') || '';
  const dismissible = options.dismissible ?? element.hasAttribute('dismissible');

  const icons = { info: '\u2139\ufe0f', success: '\u2713', warning: '\u26a0\ufe0f', error: '\u2715' };
  const icon = icons[variant] || icons.info;

  element.setAttribute('role', 'alert');
  element.setAttribute('variant', variant);
  // alert.css styles the `wb-alert` TAG (#448 converted the old bare
  // .wb-alert class selector to a tag selector) + .wb-alert--<variant> --
  // the variant attribute alone matches no selector, so every alert
  // rendered with zero styling regardless of variant (#375).
  element.classList.add(`wb-alert--${variant}`);

  const content = message || element.innerHTML || 'Alert message';
  const titleText = title || 'Alert';

  element.innerHTML = '';

  const iconEl = document.createElement('span');
  iconEl.className = 'wb-alert__icon';
  iconEl.textContent = icon;
  element.appendChild(iconEl);

  const contentEl = document.createElement('div');
  contentEl.className = 'wb-alert__content';
  const titleEl = document.createElement('div');
  titleEl.className = 'wb-alert__title';
  titleEl.textContent = titleText;
  const msgEl = document.createElement('div');
  msgEl.className = 'wb-alert__message';
  msgEl.textContent = content;
  contentEl.appendChild(titleEl);
  contentEl.appendChild(msgEl);
  element.appendChild(contentEl);

  if (dismissible) {
    const closeEl = document.createElement('wb-button');
    closeEl.className = 'wb-alert__close';
    closeEl.textContent = '\u00d7';
    closeEl.addEventListener('click', () => element.remove());
    element.appendChild(closeEl);
  }

  return () => {};
}

/**
 * Skeleton - Shimmering placeholder block.
 * CSS: src/styles/behaviors/skeleton.css
 *
 * Usage:
 *   <wb-skeleton></wb-skeleton>              \u2014 single line
 *   <wb-skeleton lines="3"></wb-skeleton>     \u2014 multiple lines
 */
export function skeleton(element) {
  const variant = element.getAttribute('variant') || 'text';
  const lines = parseInt(element.getAttribute('lines') || '1');
  const width = element.getAttribute('width');
  const height = element.getAttribute('height');

  // wb-skeleton is in schema-builder.js's SCHEMA_EXCLUDED_TAGS (self-
  // sufficient behavior, same as card/search) -- so schema-builder never
  // runs for it. skeleton.css selects the `wb-skeleton` TAG directly
  // (never a bare `.wb-skeleton` class), so only the variant modifier class
  // is needed here -- #448 removed the redundant base token, which just
  // duplicated the tag name and was never itself selected by any rule.
  element.classList.add(`wb-skeleton--${variant}`);

  element.setAttribute('variant', variant);
  if (width) element.style.width = width;
  if (height) element.style.height = height;

  if (variant === 'text' && lines > 1) {
    element.innerHTML = '';
    for (let i = 0; i < lines; i++) {
      element.appendChild(document.createElement('span'));
    }
  }

  return () => { element.innerHTML = ''; };
}

/**
 * Divider - Content dividers
 * CSS: src/styles/behaviors/divider.css (TODO: create if missing)
 */
export function divider(element, options = {}) {
  const text = options.text || element.getAttribute('text') || '';
  const vertical = options.vertical ?? element.hasAttribute('vertical');

  element.setAttribute('role', 'separator');
  if (vertical) element.setAttribute('vertical', '');

  if (text && !vertical) {
    element.innerHTML = '';
    const line1 = document.createElement('span');
    const label = document.createElement('span');
    label.textContent = text;
    const line2 = document.createElement('span');
    element.appendChild(line1);
    element.appendChild(label);
    element.appendChild(line2);
  }

  return () => {};
}

/**
 * Breadcrumb - Navigation breadcrumbs
 * CSS: src/styles/behaviors/breadcrumb.css
 */
export function breadcrumb(element, options = {}) {
  const items = (options.items || element.getAttribute('items') || '').split(',').filter(Boolean);
  const separator = options.separator || element.getAttribute('separator') || '/';

  element.classList.add('wb-breadcrumb');
  element.setAttribute('aria-label', 'Breadcrumb');

  if (items.length > 0) {
    element.innerHTML = '';
    items.forEach((item, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'wb-breadcrumb__separator';
        sep.textContent = separator;
        element.appendChild(sep);
      }
      const span = document.createElement('span');
      if (i === items.length - 1) span.setAttribute('aria-current', 'page');
      span.textContent = item.trim();
      element.appendChild(span);
    });
  }

  return () => {};
}

/**
 * Notify - Toast notification that cycles through types on each click
 * CSS: src/styles/behaviors/toast.css (shares toast styles)
 */
export function notify(element, options = {}) {
  const types = ['info', 'success', 'warning', 'error'];
  let typeIndex = 0;

  const message = options.message || element.getAttribute('message') || 'Notification';
  const duration = parseInt(options.duration || element.getAttribute('duration') || '3000');

  const messages = {
    info: message || 'Information message',
    success: 'Success! Operation completed.',
    warning: 'Warning: Please review.',
    error: 'Error: Something went wrong.'
  };

  element.addEventListener('click', () => {
    const currentType = types[typeIndex];
    typeIndex = (typeIndex + 1) % types.length;
    createToast(messages[currentType], currentType, duration);
    element.dispatchEvent(new CustomEvent('wb:notify:show', {
      bubbles: true,
      detail: { message: messages[currentType], variant: currentType }
    }));
  });

  return () => {};
}

/**
 * Pill - Badge with rounded corners (shortcut)
 */
export function pill(element, options = {}) {
  return badge(element, { ...options, pill: true });
}

export default { toast, createToast, badge, progress, spinner, avatar, chip, alert, skeleton, divider, breadcrumb, notify, pill };
