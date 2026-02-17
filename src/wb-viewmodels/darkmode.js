/**
 * Dark Mode Behavior
 * -----------------------------------------------------------------------------
 * Applies dark mode immediately when injected.
 * 
 * Custom Tag: <wb-darkmode>
 * -----------------------------------------------------------------------------
 */
export function darkmode(element, options = {}) {
  const config = {
    target: options.target || element.getAttribute('target') || 'html',
    theme: options.theme || element.getAttribute('theme') || 'dark',
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
  const originalTheme = targetEl.getAttribute('theme');

  // Apply dark theme immediately
  targetEl.setAttribute('theme', config.theme);
  element.classList.add('wb-darkmode');

  // If element is a button, make it toggle
  if (element.tagName === 'BUTTON') {
    element.onclick = () => {
      const current = targetEl.getAttribute('theme');
      const next = current === 'dark' ? 'light' : 'dark';
      targetEl.setAttribute('theme', next);
      
      element.dispatchEvent(new CustomEvent('wb:darkmode:toggle', {
        bubbles: true,
        detail: { theme: next }
      }));
    };
  }

  // Dispatch event
  element.dispatchEvent(new CustomEvent('wb:darkmode:applied', {
    bubbles: true,
    detail: { theme: config.theme }
  }));

  // Mark as ready
  // Cleanup - restore original theme
  return () => {
    element.classList.remove('wb-darkmode');
    if (originalTheme) {
      targetEl.setAttribute('theme', originalTheme);
    } else {
      delete targetEl.getAttribute('theme');
    }
  };
}

export default darkmode;
