/**
 * Span/Badge Behavior
 * -----------------------------------------------------------------------------
 * Applies utility classes and variants to inline span elements.
 * Useful for traffic lights (window controls), badges, and status indicators.
 * 
 * Custom Tag: <wb-span>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <wb-span variant="red"></wb-span>              <!-- Window control dot -->
 */
export function span(element: HTMLElement, options: Record<string, any> = {}) {
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
