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
    // One class per variant, styled by span.css -- the window dots included
    // (#1464: they used to need a second x-window-dot class from site.css).
    element.classList.add(`x-span--${variant}`);
  }
}
