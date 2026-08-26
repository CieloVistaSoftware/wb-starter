/**
 * WB Timeline Behavior
 * -----------------------------------------------------------------------------
 * Timeline component from items attribute
 *
 * Custom Tag: <div x-timeline>
 * -----------------------------------------------------------------------------
 */
export function timeline(element, options = {}) {
  element.classList.add('x-timeline');

  // Parse items from attribute
  const itemsAttr = element.getAttribute('items') || '';
  const items = itemsAttr.split(',').map(item => item.trim()).filter(item => item);

  // Set items on element for template binding
  element.items = items;

  return () => {
    element.classList.remove('x-timeline');
  };
}

export default timeline;