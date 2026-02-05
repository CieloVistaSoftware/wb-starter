/**
 * Vertical timeline component from items attribute.
 * - `<wb-timeline>` for displaying chronological events.
 */
export function cc() {}

export function timeline(element, options = {}) {
  element.classList.add('wb-timeline');

  // Parse items from attribute
  const itemsAttr = element.getAttribute('items') || '';
  const items = itemsAttr.split(',').map(item => item.trim()).filter(item => item);

  // Set items on element for template binding
  element.items = items;

  element.dataset.wbReady = 'timeline';
  return () => {
    element.classList.remove('wb-timeline');
  };
}

export default timeline;