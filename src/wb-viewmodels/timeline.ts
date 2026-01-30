/**
 * WB Timeline Behavior
 * -----------------------------------------------------------------------------
 * Timeline component from items attribute
 *
 * Custom Tag: <wb-timeline>
 * -----------------------------------------------------------------------------
 */
export function timeline(element: HTMLElement, options: Record<string, any> = {}) {
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