/**
 * Statusbar - Bottom status bar showing current page and info
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-statusbar>
 * 
 * Attributes:
 * - data-items: Comma-separated status items
 * - data-position: "bottom" | "top" | "fixed" (default: bottom)
 * - show-page / show-page: Show current page name (default: true)
 * - show-time / show-time: Show current time
 * - show-theme / show-theme: Show current theme
 * 
 * Usage:
 *   <wb-statusbar show-time show-theme></wb-statusbar>
 *   <wb-statusbar data-items="Ready,v3.0" show-page></wb-statusbar>
 * -----------------------------------------------------------------------------
 */

export function statusbar(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    position: options.position || element.dataset.position || 'bottom',
    showPage: options.showPage ?? element.hasAttribute('data-show-page') ?? element.hasAttribute('show-page') ?? element.getAttribute('show-page') !== 'false',
    showTime: options.showTime ?? element.hasAttribute('data-show-time') ?? element.hasAttribute('show-time'),
    showTheme: options.showTheme ?? element.hasAttribute('data-show-theme') ?? element.hasAttribute('show-theme'),
    ...options
  };

  element.classList.add('wb-statusbar');
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'space-between';
  element.style.padding = '0 1rem';
  element.style.height = '1.75rem';
  element.style.background = 'var(--bg-secondary, #1f2937)';
  element.style.borderTop = '1px solid var(--border-color, #374151)';
  element.style.fontSize = '0.75rem';
  element.style.color = 'var(--text-secondary, #9ca3af)';
  element.style.width = '100%';
  element.style.boxSizing = 'border-box';
  element.style.gap = '1rem';

  if (config.position === 'bottom' || config.position === 'fixed') {
    element.style.position = 'fixed';
    element.style.bottom = '0';
    element.style.left = '0';
    element.style.zIndex = '100';
  } else if (config.position === 'top') {
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '100';
    element.style.borderTop = 'none';
    element.style.borderBottom = '1px solid var(--border-color, #374151)';
  }

  // Helper to get current page
  const getCurrentPage = () => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'home';
    return page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ');
  };

  // Helper to format time
  const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Helper to get theme
  const getTheme = () => document.documentElement.dataset.theme || 'system';

  // Build status bar
  const render = () => {
    element.innerHTML = '';

    // Left section
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '0.75rem';
    left.style.flex = '1';

    if (config.showPage) {
      const pageEl = document.createElement('span');
      pageEl.className = 'wb-statusbar__page';
      pageEl.style.display = 'flex';
      pageEl.style.alignItems = 'center';
      pageEl.style.gap = '0.35rem';
      pageEl.style.padding = '0.15rem 0.5rem';
      pageEl.style.background = 'rgba(99, 102, 241, 0.15)';
      pageEl.style.color = 'var(--primary, #6366f1)';
      pageEl.style.borderRadius = '4px';
      pageEl.style.fontWeight = '500';
      pageEl.innerHTML = `<span>📄</span><span>${getCurrentPage()}</span>`;
      left.appendChild(pageEl);
    }

    // Add custom items to left
    config.items.forEach(item => {
      const span = document.createElement('span');
      span.textContent = item.trim();
      left.appendChild(span);
    });

    element.appendChild(left);

    // Center section - message area
    const center = document.createElement('div');
    center.className = 'wb-statusbar__message';
    center.style.flex = '0 0 auto';
    center.style.textAlign = 'center';
    center.style.fontWeight = '500';
    center.style.color = 'var(--text-primary, #e5e7eb)';
    center.style.transition = 'opacity 0.3s ease';
    center.style.opacity = '0';
    element.appendChild(center);

    // Right section
    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '0.75rem';
    right.style.flex = '1';
    right.style.justifyContent = 'flex-end';

    if (config.showTheme) {
      const themeEl = document.createElement('span');
      themeEl.className = 'wb-statusbar__theme';
      themeEl.style.display = 'flex';
      themeEl.style.alignItems = 'center';
      themeEl.style.gap = '0.35rem';
      themeEl.style.cursor = 'pointer';
      const theme = getTheme();
      themeEl.innerHTML = `<span>${theme === 'dark' ? '🌙' : '☀️'}</span><span>${theme}</span>`;
      themeEl.onclick = () => {
        const newTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = newTheme;
        render();
      };
      right.appendChild(themeEl);
    }

    if (config.showTime) {
      const timeEl = document.createElement('span');
      timeEl.className = 'wb-statusbar__time';
      timeEl.style.display = 'flex';
      timeEl.style.alignItems = 'center';
      timeEl.style.gap = '0.35rem';
      timeEl.style.fontVariantNumeric = 'tabular-nums';
      timeEl.innerHTML = `<span>🕐</span><span>${formatTime()}</span>`;
      right.appendChild(timeEl);
    }

    element.appendChild(right);
  };

  render();

  // Update time every minute if showing
  let timeInterval;
  if (config.showTime) {
    timeInterval = setInterval(() => {
      const timeEl = element.querySelector('.wb-statusbar__time span:last-child');
      if (timeEl) timeEl.textContent = formatTime();
    }, 60000);
  }

  // Listen for page changes
  const updatePage = () => {
    const pageEl = element.querySelector('.wb-statusbar__page span:last-child');
    if (pageEl) pageEl.textContent = getCurrentPage();
  };
  window.addEventListener('popstate', updatePage);

  // Watch for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.attributeName === 'data-theme') {
        const themeEl = element.querySelector('.wb-statusbar__theme');
        if (themeEl) {
          const theme = getTheme();
          themeEl.innerHTML = `<span>${theme === 'dark' ? '🌙' : '☀️'}</span><span>${theme}</span>`;
        }
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Event listener for status messages
  const handleStatusMessage = (e) => {
    const messageArea = element.querySelector('.wb-statusbar__message');
    if (!messageArea) return;
    
    const { message, type, duration = 3000 } = e.detail;
    messageArea.textContent = message;
    messageArea.style.opacity = '1';
    
    if (type === 'error') messageArea.style.color = 'var(--danger-color, #ef4444)';
    else if (type === 'success') messageArea.style.color = 'var(--success-color, #10b981)';
    else messageArea.style.color = 'var(--text-primary, #e5e7eb)';

    if (element._statusTimeout) clearTimeout(element._statusTimeout);
    
    element._statusTimeout = setTimeout(() => {
      messageArea.style.opacity = '0';
    }, duration);
  };

  document.addEventListener('wb:status:message', handleStatusMessage);

  element.dataset.wbReady = 'statusbar';
  return () => {
    element.classList.remove('wb-statusbar');
    document.removeEventListener('wb:status:message', handleStatusMessage);
    window.removeEventListener('popstate', updatePage);
    observer.disconnect();
    if (timeInterval) clearInterval(timeInterval);
  };
}

export default statusbar;
