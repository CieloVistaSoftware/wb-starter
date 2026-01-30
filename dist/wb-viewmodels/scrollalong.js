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
    // Add base class for compliance
    element.classList.add('wb-scrollalong');
    // Apply Sticky Positioning
    // We assume the element is already sized correctly by CSS
    element.style.position = 'sticky';
    element.style.top = '0';
    element.style.alignSelf = 'flex-start';
}
//# sourceMappingURL=scrollalong.js.map