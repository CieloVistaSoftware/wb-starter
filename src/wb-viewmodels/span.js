/**
 * Utility behaviors for inline spans: badges, dots, status indicators.
 * - `<wb-span>` with variant styling for window controls and badges.
 */
export function cc() {}

export function span(element, options = {}) {
  element.classList.add('wb-span');
  const variant = options.variant || element.dataset.variant;
  
  if (variant) {
    // Map simplified variants to full class names if needed
    // or just add wb-span--variant
    element.classList.add(`wb-span--${variant}`);
    
    // Specific support for window dots
    if (['red', 'yellow', 'green', 'dot'].includes(variant)) {
        element.classList.add('wb-window-dot');
    }
    
    if (['red', 'yellow', 'green'].includes(variant)) {
        element.classList.add(`wb-window-dot--${variant}`);
    }
  }
}
