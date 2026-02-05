/**
 * Chip — removable chip/tag.
 * TODO: Migrate inline styles to chip.css
 */
export function cc() {}

/**
 * Chip - Removable chips/tags with variant styling
 */
export function chip(element, options = {}) {
  const config = {
    dismissible: options.dismissible ?? element.hasAttribute('data-dismissible'),
    variant: options.variant || element.dataset.variant || 'default',
    ...options
  };

  const colors = {
    default: { bg: 'var(--bg-tertiary, #374151)', text: 'var(--text-primary, #f9fafb)' },
    primary: { bg: 'var(--primary, #6366f1)', text: 'white' },
    success: { bg: 'var(--success, #22c55e)', text: 'white' },
    warning: { bg: 'var(--warning, #f59e0b)', text: 'white' },
    error: { bg: 'var(--error, #ef4444)', text: 'white' },
    info: { bg: 'var(--info, #3b82f6)', text: 'white' }
  };
  const c = colors[config.variant] || colors.default;

  element.classList.add('wb-chip');
  if (config.variant !== 'default') {
    element.classList.add(`wb-chip--${config.variant}`);
  }

  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.gap = '0.25rem';
  element.style.padding = '0.25rem 0.75rem';
  element.style.background = c.bg;
  element.style.color = c.text;
  element.style.borderRadius = '999px';
  element.style.fontSize = '0.875rem';
  element.style.fontWeight = '500';

  if (config.dismissible && !element.querySelector('.wb-chip__remove')) {
    const btn = document.createElement('button');
    btn.className = 'wb-chip__remove';
    btn.innerHTML = '×';
    btn.style.cssText = 'background:none;border:none;color:inherit;cursor:pointer;opacity:0.7;padding:0;margin-left:0.25rem;font-size:1.1rem;line-height:1;display:flex;align-items:center;';
    btn.onclick = () => {
      element.dispatchEvent(new CustomEvent('wb:chip:remove', { bubbles: true }));
      element.remove();
    };
    element.appendChild(btn);
  }

  element.dataset.wbReady = 'chip';
  return () => element.classList.remove('wb-chip');
}

export default chip;
