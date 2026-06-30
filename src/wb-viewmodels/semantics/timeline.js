/**
 * Timeline - Vertical timeline
 * Helper Attribute: [x-behavior="timeline"]
 *
 * Builds the timeline from the `items` attribute (comma-separated). The CSS
 * (.wb-timeline-item) draws the connecting line and the dots via ::before, so
 * each entry is simply a div with its text. The schema only stamps a single
 * empty item that the stylesheet does not target, so we render here. (#220)
 */
export function timeline(element, options = {}) {
  element.classList.add('wb-timeline');

  const itemsAttr = element.getAttribute('items') || '';
  const items = itemsAttr.split(',').map((s) => s.trim()).filter(Boolean);
  element.items = items;

  if (items.length) {
    element.textContent = '';
    for (const text of items) {
      const item = document.createElement('div');
      item.className = 'wb-timeline-item';
      item.textContent = text;
      element.appendChild(item);
    }
  }

  return () => element.classList.remove('wb-timeline');
}

export default timeline;
