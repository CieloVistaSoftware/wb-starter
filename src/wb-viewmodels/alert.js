/**
 * Alert — alert messages.
 * Component: <wb-alert>
 * TODO: Migrate inline styles to alert.css
 */
export function cc() {}

/**
 * Alert - Alert messages with type, icon, title, dismiss
 */
export function alert(element, options = {}) {
  const config = {
    type: options.variant || element.dataset.type || 'info',
    message: options.message || element.dataset.message || '',
    title: options.title || element.dataset.title || '',
    dismissible: options.dismissible ?? element.hasAttribute('data-dismissible'),
    ...options
  };

  const colors = {
    info: { bg: '#3b82f6', border: '#1e40af', text: 'white', icon: 'ℹ️' },
    success: { bg: '#22c55e', border: '#166534', text: 'white', icon: '✓' },
    warning: { bg: '#f59e0b', border: '#92400e', text: 'white', icon: '⚠️' },
    error: { bg: '#ef4444', border: '#991b1b', text: 'white', icon: '✕' }
  };
  const c = colors[config.type] || colors.info;

  element.classList.add('wb-alert', `wb-alert--${config.type}`);
  element.setAttribute('role', 'alert');
  element.style.padding = '0.75rem 1rem';
  element.style.background = c.bg;
  element.style.borderLeft = `4px solid ${c.border}`;
  element.style.borderRadius = '4px';
  element.style.color = c.text;
  element.style.display = 'flex';
  element.style.alignItems = 'flex-start';
  element.style.gap = '0.5rem';

  const content = config.message || element.innerHTML || 'Alert message';
  const titleText = config.title || 'Alert Title';
  element.innerHTML = `
    <span class="wb-alert__icon" style="flex-shrink:0;">${c.icon}</span>
    <div class="wb-alert__content" style="flex:1;">
      <div class="wb-alert__title" style="font-weight:600;margin-bottom:0.25rem;">${titleText}</div>
      <p class="wb-alert__message" style="margin:0;">${content}</p>
    </div>
    ${config.dismissible ? `<button class="wb-alert__close" onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;opacity:0.7;font-size:1.25rem;line-height:1;">×</button>` : ''}
  `;

  element.dataset.wbReady = 'alert';
  return () => element.classList.remove('wb-alert');
}

export default alert;
