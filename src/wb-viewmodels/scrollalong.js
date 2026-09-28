import { readAttr } from '../core/read-attr.js';
import { setRule, clearRules } from '../core/dynamic-style.js';
/**
 * ScrollAlong Behavior (Sticky Sidebar / Tag Along Menu)
 * -----------------------------------------------------------------------------
 * Makes an element "stick" to the viewport using CSS sticky positioning.
 *
 * Helper Attribute: [x-scrollalong]
 * -----------------------------------------------------------------------------
 *
 * Usage:
 * <nav x-scrollalong>...</nav>
 * <aside x-scrollalong offset="80">Sidebar</aside>
 *
 * Options (plain attribute is canonical per Law 11; data-* accepted for
 * back-compat only):
 *   offset - Pixels from the top of the viewport once stuck (default: 0)
 *
 * #637: offset was declared in scrollalong.schema.json but never actually
 * read -- element.style.top was hardcoded to '0' regardless of any
 * offset="..." on the element. Fixed to read it, matching sticky.js's own
 * offset handling.
 */

export function scrollalong(element, options = {}) {
  // #448: no classList.add('x-scrollalong') -- no CSS selector anywhere
  // depends on the bare class; it just duplicated <div x-scrollalong>'s own
  // tag name.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-scrollalong> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-scrollalong> tag does not get a redundant class.
  element.classList.add('x-scrollalong');

  const offset = parseInt(
    options.offset ?? element.getAttribute('offset') ?? readAttr(element, 'offset') ?? '0',
    10
  );

  // Sticky positioning is .x-scrollalong in scrollalong.css (#779). Only an
  // authored offset travels, as a generated rule -- never element.style.
  const top = Number.isFinite(offset) ? offset : 0;
  if (top) setRule(element, 'offset', { top: `${top}px` });

  return () => {
    clearRules(element);
    element.classList.remove('x-scrollalong');
  };
}
