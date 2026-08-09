/**
 * ScrollAlong Behavior (Sticky Sidebar / Tag Along Menu)
 * -----------------------------------------------------------------------------
 * Makes an element "stick" to the viewport using CSS sticky positioning.
 * 
 * Helper Attribute: [x-scrollalong]
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 * <nav>...</nav>
 * <aside>Sidebar</aside>
 */

export function scrollalong(element) {
  // #448: no classList.add('wb-scrollalong') -- no CSS selector anywhere
  // depends on the bare class; it just duplicated <wb-scrollalong>'s own
  // tag name.

  // Apply Sticky Positioning
  // We assume the element is already sized correctly by CSS
  element.style.position = 'sticky';
  element.style.top = '0';
  element.style.alignSelf = 'flex-start';
}
