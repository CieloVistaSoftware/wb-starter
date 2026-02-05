import { createToast } from '../feedback.js';

/**
 * Enhanced `<button>` element with variants, sizes, icons, and loading states.
 * - Semantic button behavior with `[x-behavior="button"]`.
 */
export function cc() {}

export function button(element, options = {}) {
  if (element.tagName !== 'BUTTON') {
    console.warn('[button] Element must be a <button>');
    return () => {};
  }

  const config = {
    variant: options.variant || element.dataset.variant || 'primary',
    size: options.size || element.dataset.size || 'md',
    icon: options.icon || element.dataset.icon || '',
    iconPosition: options.iconPosition || element.dataset.iconPosition || 'left',
    loading: options.loading ?? element.hasAttribute('data-loading'),
    disabled: options.disabled ?? element.hasAttribute('data-disabled'),
    ...options
  };

  element.classList.add('wb-button');

  // Apply variant
  element.classList.add(`wb-button--${config.variant}`);

  // Apply size
  if (config.size !== 'md') {
    element.classList.add(`wb-button--${config.size}`);
  }

  // Base styles
  Object.assign(element.style, {
    padding: config.size === 'xs' ? '0.125rem 0.5rem' : 
             config.size === 'sm' ? '0.25rem 0.75rem' : 
             config.size === 'lg' ? '0.75rem 1.5rem' : 
             config.size === 'xl' ? '1rem 2rem' : 
             '0.5rem 1rem',
    borderRadius: 'var(--radius-md, 6px)',
    border: 'none',
    cursor: config.disabled || config.loading ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    opacity: config.disabled ? '0.5' : '1'
  });

  // Variant colors
  const variants = {
    primary: { backgroundColor: 'var(--primary, #6366f1)', color: 'white' },
    secondary: { backgroundColor: 'var(--secondary, #64748b)', color: 'white' },
    success: { backgroundColor: 'var(--success, #22c55e)', color: 'white' },
    danger: { backgroundColor: 'var(--danger, #ef4444)', color: 'white' },
    warning: { backgroundColor: 'var(--warning, #f59e0b)', color: 'white' },
    ghost: { backgroundColor: 'transparent', color: 'var(--text-primary, #f9fafb)', border: '1px solid var(--border-color, #374151)' },
    link: { backgroundColor: 'transparent', color: 'var(--primary, #6366f1)', textDecoration: 'underline' },
    outline: { backgroundColor: 'transparent', color: 'var(--primary, #6366f1)', border: '1px solid var(--primary, #6366f1)' }
  };

  const variantStyle = variants[config.variant] || variants.primary;
  Object.assign(element.style, variantStyle);

  // Disabled state
  if (config.disabled) {
    element.disabled = true;
  }

  // Loading state
  let spinner = null;
  if (config.loading) {
    element.disabled = true;
    spinner = document.createElement('span');
    spinner.className = 'wb-button__spinner';
    spinner.textContent = '⏳';
    spinner.style.animation = 'spin 1s linear infinite';

    if (config.iconPosition === 'left') {
      element.insertBefore(spinner, element.firstChild);
    } else {
      element.appendChild(spinner);
    }
  }

  // Icon
  let iconEl = null;
  if (config.icon && !config.loading) {
    iconEl = document.createElement('span');
    iconEl.className = 'wb-button__icon';
    iconEl.textContent = config.icon;

    if (config.iconPosition === 'left') {
      element.insertBefore(iconEl, element.firstChild);
    } else {
      element.appendChild(iconEl);
    }
  }

  // Click handler for toast
  const clickHandler = (e) => {
    // Only show toast if it's not part of another interactive behavior that might handle clicks
    // But for the demo page, we want this feedback.
    const text = element.textContent.trim();
    if (text) {
      let toastType = config.variant;
      // Map variants to toast types
      if (toastType === 'outline' || toastType === 'link') toastType = 'primary';
      if (toastType === 'ghost') toastType = 'secondary';
      
      createToast(`Clicked: ${text}`, toastType);
    }
  };
  element.addEventListener('click', clickHandler);

  element.dataset.wbReady = 'button';

  return () => {
    element.removeEventListener('click', clickHandler);
    element.classList.remove('wb-button', `wb-button--${config.variant}`, `wb-button--${config.size}`);
    if (spinner) spinner.remove();
    if (iconEl) iconEl.remove();
  };
}

export default { button };

