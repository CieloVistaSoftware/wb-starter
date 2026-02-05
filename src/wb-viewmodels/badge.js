/**
 * Badge behavior — pure decoration.
 * Adds CSS classes for variant, size, pill, dot, outline.
 * Attribute: [badge] or <wb-badge>
 */
export function cc() {}

// Self-load badge CSS once
{
  if (typeof document !== 'undefined' && !document.querySelector('link[data-wb-badge-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/behaviors/badge.css';
    link.setAttribute('data-wb-badge-css', 'true');
    document.head.appendChild(link);
  }
}

/**
 * Badge - Status badges (pure behavior — adds classes only)
 */
export function badge(element, options = {}) {
  const rawVariant = options.variant || element.dataset.variant || element.getAttribute('variant') || element.getAttribute('badge') || 'default';
  const sanitizedVariant = rawVariant.replace(/\s+/g, '-').toLowerCase();

  const variantMap = {
    gray: 'default', grey: 'default',
    danger: 'error', red: 'error',
    green: 'success', blue: 'info', yellow: 'warning',
    orange: 'orange', purple: 'purple', indigo: 'primary',
    pink: 'pink', teal: 'teal'
  };

  const config = {
    variant: variantMap[sanitizedVariant] || sanitizedVariant,
    size: options.size || element.dataset.size || element.getAttribute('size') || 'md',
    pill: options.pill ?? (element.hasAttribute('data-pill') || element.hasAttribute('pill')),
    dot: options.dot ?? (element.hasAttribute('data-dot') || element.hasAttribute('dot')),
    outline: options.outline ?? (element.hasAttribute('data-outline') || element.hasAttribute('outline')),
    removable: options.removable ?? (element.hasAttribute('data-removable') || element.hasAttribute('removable')),
    ...options
  };

  const validVariants = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info', 'pink', 'teal', 'orange', 'purple'];
  const variant = validVariants.includes(config.variant) ? config.variant : 'default';

  // Pure decoration — CSS classes only, no inline styles
  element.classList.add('wb-badge', `wb-badge--${variant}`, `wb-badge--${config.size}`);

  if (config.pill) element.classList.add('wb-badge--pill');
  if (config.dot) element.classList.add('wb-badge--dot');
  if (config.outline) element.classList.add('wb-badge--outline');

  if (config.dot) {
    element.textContent = '';
  }

  if (config.removable && !element.querySelector('.wb-badge__remove')) {
    const btn = document.createElement('button');
    btn.className = 'wb-badge__remove';
    btn.innerHTML = '×';
    btn.setAttribute('aria-label', 'Remove');
    btn.onclick = (e) => {
      e.stopPropagation();
      element.dispatchEvent(new CustomEvent('wb:badge:remove', { bubbles: true }));
      element.remove();
    };
    element.appendChild(btn);
  }

  element.dataset.wbReady = 'badge';
  return () => {
    element.classList.remove('wb-badge', `wb-badge--${variant}`, `wb-badge--${config.size}`, 'wb-badge--pill', 'wb-badge--dot', 'wb-badge--outline');
  };
}

export default badge;
