/**
 * Notify behavior — click trigger that cycles through notification types.
 * Attribute: [x-notify]
 */
export function cc() {}

// Self-load notify CSS once
{
  if (typeof document !== 'undefined' && !document.querySelector('link[data-wb-notify-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/behaviors/notify.css';
    link.setAttribute('data-wb-notify-css', 'true');
    document.head.appendChild(link);
  }
}

/**
 * Notify - Click trigger that cycles info → success → warning → error
 */
export function notify(element, options = {}) {
  const types = ['info', 'success', 'warning', 'error'];
  let typeIndex = 0;

  const config = {
    message: options.message || element.dataset.notifyMessage || element.dataset.message || 'Notification',
    duration: parseInt(options.duration || element.dataset.duration || '3000'),
    ...options
  };

  const messages = {
    info: config.message || 'Information message',
    success: 'Success! Operation completed.',
    warning: 'Warning: Please review.',
    error: 'Error: Something went wrong.'
  };

  element.classList.add('wb-notify-trigger');

  element.onclick = () => {
    const currentType = types[typeIndex];
    typeIndex = (typeIndex + 1) % types.length;

    let container = document.querySelector('.wb-notify-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'wb-notify-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `wb-notify wb-notify--${currentType}`;

    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

    toast.innerHTML = `
      <span class="wb-notify__icon">${icons[currentType]}</span>
      <span class="wb-notify__message">${messages[currentType]}</span>
      <button class="wb-notify__close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.wb-notify__close').onclick = () => toast.remove();
    container.appendChild(toast);

    if (config.duration > 0) {
      setTimeout(() => {
        toast.classList.add('wb-notify--exiting');
        setTimeout(() => toast.remove(), 200);
      }, config.duration);
    }

    element.dispatchEvent(new CustomEvent('wb:notify:show', {
      bubbles: true,
      detail: { message: messages[currentType], type: currentType }
    }));
  };

  element.dataset.wbReady = 'notify';
  return () => element.classList.remove('wb-notify-trigger');
}

export default notify;
