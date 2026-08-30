/**
 * Dark Mode Behavior
 * -----------------------------------------------------------------------------
 * Applies dark mode immediately when injected.
 * 
 * Custom Tag: <div x-darkmode>
 * -----------------------------------------------------------------------------
 */
export function darkmode(element, options = {}) {
  const config = {
    target: options.target || element.getAttribute('target') || 'html',
    theme: options.theme || element.getAttribute('theme') || 'dark',
    ...options
  };

  // Get target element (default: html root; 'self' scopes to this element,
  // e.g. forcing one card to a theme regardless of the global setting)
  const targetEl = config.target === 'html'
    ? document.documentElement
    : config.target === 'self'
      ? element
      : document.querySelector(config.target);

  if (!targetEl) {
    console.warn('[WB] Darkmode: Target not found');
    return () => {};
  }

  // Store original theme
  const originalTheme = targetEl.getAttribute('data-theme');

  // Apply dark theme immediately
  targetEl.setAttribute('data-theme', config.theme);
  // #448: no classList.add('x-darkmode') -- no CSS selector anywhere
  // depends on the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-darkmode> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-darkmode> tag does not get a redundant class.
  if (element.tagName.toLowerCase() !== 'x-darkmode') element.classList.add('x-darkmode');

  // If element is a button, make it toggle
  if (element.tagName === 'BUTTON') {
    element.onclick = () => {
      const current = targetEl.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      targetEl.setAttribute('data-theme', next);
      
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
    element.classList.remove('x-darkmode');
    if (originalTheme) {
      targetEl.setAttribute('data-theme', originalTheme);
    } else {
      targetEl.removeAttribute('data-theme');
    }
  };
}

export default darkmode;
