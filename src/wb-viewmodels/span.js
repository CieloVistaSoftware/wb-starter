import { readAttr } from '../core/read-attr.js';
/**
 * Span/Badge Behavior
 * -----------------------------------------------------------------------------
 * Applies utility classes and variants to inline span elements.
 * Useful for traffic lights (window controls), badges, and status indicators.
 * 
 * Custom Tag: <div x-span>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <div x-span variant="red"></div>              <!-- Window control dot -->
 */
export function span(element, options = {}) {
  element.classList.add('x-span');
  const variant = options.variant || readAttr(element, 'variant');
  
  if (variant) {
    // Map simplified variants to full class names if needed
    // or just add x-span--variant
    element.classList.add(`x-span--${variant}`);
    
    // Specific support for window dots
    if (['red', 'yellow', 'green', 'dot'].includes(variant)) {
        element.classList.add('x-window-dot');
    }
    
    if (['red', 'yellow', 'green'].includes(variant)) {
        element.classList.add(`x-window-dot--${variant}`);
    }
  }
}
