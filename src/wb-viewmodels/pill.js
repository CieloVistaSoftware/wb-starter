/**
 * Pill behavior — badge with rounded corners (shortcut).
 * Delegates to badge behavior with pill: true.
 */
import { badge } from './badge.js';

export function cc() {}

/**
 * Pill - Badge shortcut with pill styling
 */
export function pill(element, options = {}) {
  return badge(element, { ...options, pill: true });
}

export default pill;
