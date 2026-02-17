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
  const message = options.message || element.getAttribute('message') || 'Notification';
  const variant = options.variant || element.getAttribute('toast-variant') || element.getAttribute('variant') || 'info';
  const duration = parseInt(options.duration || element.getAttribute('duration') || '3000');

  const showToast = () => {
    createToast(message, variant, duration);
    element.dispatchEvent(new CustomEvent('wb:toast:show', {
      bubbles: true,
      detail: { message, variant }
    }));
  };

  element.addEventListener('click', showToast);
  return () => element.removeEventListener('click', showToast);
}

/**
 * Badge - Status badges
 * CSS: src/styles/behaviors/badge.css
 * CSS targets wb-badge tag and attributes.
 */
export function badge(element, options = {}) {
  const variant = (options.variant || element.getAttribute('variant') || element.getAttribute('badge') || 'default')
    .replace(/\s+/g, '-').toLowerCase();
  const pill = options.pill ?? element.hasAttribute('pill');
  const dot = options.dot ?? element.hasAttribute('dot');
  const outline = options.outline ?? element.hasAttribute('outline');

  if (dot) element.textContent = '';

  // Badge is a custom element — no classes needed if CSS targets wb-badge[variant="x"]
  // But badge can also be applied via [badge] attribute on any element, so we need classes
  element.classList.add('wb-badge', `wb-badge--${variant}`);
  if (pill) element.classList.add('wb-badge--pill');
  if (dot) element.classList.add('wb-badge--dot');
  if (outline) element.classList.add('wb-badge--outline');

  return () => {
    element.classList.remove('wb-badge', `wb-badge--${variant}`, 'wb-badge--pill', 'wb-badge--dot', 'wb-badge--outline');
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
  const dismissible = options.dismissible ?? element.hasAttribute('dismissible');
  const variant = options.variant || element.getAttribute('variant') || 'default';

  element.classList.add('wb-chip');
  if (variant !== 'default') {
    element.classList.add(`wb-chip--${variant}`);
  }

  if (dismissible && !element.querySelector('.wb-chip__remove')) {
    const btn = document.createElement('wb-button');
    btn.className = 'wb-chip__remove';
    btn.textContent = '\u00d7';
    btn.addEventListener('click', () => {
      element.dispatchEvent(new CustomEvent('wb:chip:remove', { bubbles: true }));
      element.remove();
    });
    element.appendChild(btn);
  }

  return () => element.classList.remove('wb-chip', `wb-chip--${variant}`);
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
  const msgEl = document.createElement('p');
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
  const lines = parseInt(element.getAttribute('lines') || '1');

  if (lines > 1) {
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
