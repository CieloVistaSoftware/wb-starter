/**
 * Dark Mode Behavior
 * Applies dark mode immediately when injected.
 */
export function darkmode(element, options = {}) {
  const config = {
    target: options.target || element.dataset.target || 'html',
    theme: options.theme || element.dataset.theme || 'dark',
    ...options
  };

  // Get target element (default: html root)
  const targetEl = config.target === 'html' 
    ? document.documentElement 
    : document.querySelector(config.target);

  if (!targetEl) {
    console.warn('[WB] Darkmode: Target not found');
    return () => {};
  }

  // Store original theme
  const originalTheme = targetEl.dataset.theme;

  // Apply dark theme immediately
  targetEl.dataset.theme = config.theme;
  element.classList.add('wb-darkmode');

  // Dispatch event
  element.dispatchEvent(new CustomEvent('wb:darkmode:applied', {
    bubbles: true,
    detail: { theme: config.theme }
  }));

  // Mark as ready
  element.dataset.wbReady = (element.dataset.wbReady || '') + ' darkmode';

  // Cleanup - restore original theme
  return () => {
    element.classList.remove('wb-darkmode');
    if (originalTheme) {
      targetEl.dataset.theme = originalTheme;
    } else {
      delete targetEl.dataset.theme;
    }
  };
}

export default darkmode;
