import { readAttr } from '../core/read-attr.js';
/**
 * Status Behavior
 * -----------------------------------------------------------------------------
 * Colours inline text by status (primary, success, error, ...) or turns the
 * element into a window-control dot (red, yellow, green, dot).
 *
 * #1105: this was x-span, the one x- token named after an HTML element that
 * no native element maps to -- it read as "the span behavior" though it did a
 * status job. x-span still works: it is declared in BEHAVIOR_ALIASES
 * (src/core/attribute-aliases.js).
 *
 * Usage:
 *   <span x-status variant="red"></span>              <!-- Window control dot -->
 *   <span x-status variant="success">Passed</span>    <!-- Status-coloured text -->
 * -----------------------------------------------------------------------------
 */
export function status(element, options = {}) {
  element.classList.add('x-status');
  const variant = options.variant || readAttr(element, 'variant');

  if (variant) {
    // One class per variant, styled by status.css -- the window dots included
    // (#1464: they used to need a second x-window-dot class from site.css).
    element.classList.add(`x-status--${variant}`);
  }
}
