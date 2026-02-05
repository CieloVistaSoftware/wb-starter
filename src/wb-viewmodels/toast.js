/**
 * Toast behavior — click trigger for toast notifications.
 * Attribute: [toast-message] or [x-toast]
 */
export function cc() {}

// Self-load toast CSS once
{
  if (typeof document !== 'undefined' && !document.querySelector('link[data-wb-toast-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/behaviors/toast.css';
    link.setAttribute('data-wb-toast-css', 'true');
    document.head.appendChild(link);
  }
}

/**
 * Create a toast notification element and add it to the page.
 * Shared utility used by toast behavior and other callers.
 */
export function createToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.wb-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'wb-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `wb-toast wb-toast--${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'wb-toast__close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('wb-toast--exiting');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

/**
 * Toast - Click trigger behavior (pure behavior — adds listener only)
 */
export function toast(element, options = {}) {
  const config = {
    message: options.message || element.dataset.toastMessage || element.dataset.message || element.getAttribute('toast-message') || element.getAttribute('message') || 'Notification',
    type: options.type || element.dataset.type || 'info',
    duration: parseInt(options.duration || element.dataset.duration || '3000'),
    position: options.position || element.dataset.position || 'top-right',
    ...options
  };

  element.classList.add('wb-toast-trigger');

  const showToast = () => {
    createToast(config.message, config.type, config.duration);
    element.dispatchEvent(new CustomEvent('wb:toast:show', {
      bubbles: true,
      detail: { message: config.message, type: config.type }
    }));
  };

  element.addEventListener('click', showToast);
  element.dataset.wbReady = 'toast';
  return () => element.removeEventListener('click', showToast);
}

export default toast;
