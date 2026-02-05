/**
 * Spinner — loading indicator.
 * Component: <wb-spinner>
 * TODO: Migrate inline styles to spinner.css
 */
export function cc() {}

/**
 * Spinner - Loading spinner with staggered start support and speed control
 */
export function spinner(element, options = {}) {
  // Guard against re-initialization
  if (element.dataset.wbReady?.includes('spinner') || element._wbSpinnerInit) {
    return () => {};
  }

  element._wbSpinnerInit = true;
  element.dataset.wbReady = 'spinner';

  const config = {
    size: options.size || element.dataset.size || 'md',
    color: options.color || element.dataset.color || 'primary',
    delay: options.delay || element.dataset.delay || '0',
    speed: options.speed || element.dataset.speed || 'medium',
    ...options
  };

  const sizes = { xs: '12px', sm: '16px', md: '24px', lg: '32px', xl: '48px' };
  const size = sizes[config.size] || config.size || sizes.md;

  const speeds = { slow: '2s', medium: '1.2s', fast: '0.6s' };
  const spinSpeed = speeds[config.speed] || config.speed || speeds.medium;

  const colors = {
    primary: '#6366f1', secondary: '#64748b', success: '#22c55e',
    warning: '#f59e0b', error: '#ef4444', info: '#3b82f6'
  };
  const spinnerColor = config.color.startsWith('#') ? config.color : (colors[config.color] || colors.primary);

  element.innerHTML = '';

  element.classList.add('wb-spinner');
  element.setAttribute('role', 'status');
  element.setAttribute('aria-label', 'Loading');
  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';

  const ring = document.createElement('div');
  ring.className = 'wb-spinner__ring';
  ring.style.width = size;
  ring.style.height = size;
  ring.style.border = '3px solid var(--bg-tertiary, #374151)';
  ring.style.borderTopColor = spinnerColor;
  ring.style.borderRadius = '50%';
  ring.style.animation = `wb-spin ${spinSpeed} linear infinite`;

  const delayStr = String(config.delay);
  if (delayStr !== '0' && delayStr !== '0s') {
    ring.style.animationDelay = delayStr.includes('s') ? delayStr : `${delayStr}s`;
  }

  element.appendChild(ring);

  return () => {
    element.classList.remove('wb-spinner');
    element.innerHTML = '';
    delete element._wbSpinnerInit;
  };
}

export default spinner;
