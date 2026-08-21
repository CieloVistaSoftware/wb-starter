import { readAttr } from '../core/read-attr.js';
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
  // #448: no classList.add('wb-scrollalong') -- no CSS selector anywhere
  // depends on the bare class; it just duplicated <wb-scrollalong>'s own
  // tag name.

  const offset = parseInt(
    options.offset ?? element.getAttribute('offset') ?? readAttr(element, 'offset') ?? '0',
    10
  );

  // Apply Sticky Positioning
  // We assume the element is already sized correctly by CSS
  element.style.position = 'sticky';
  element.style.top = `${Number.isFinite(offset) ? offset : 0}px`;
  element.style.alignSelf = 'flex-start';
}
