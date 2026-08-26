/**
 * Timeline - Vertical timeline
 * Helper Attribute: [x-behavior="timeline"]
 *
 * Builds the timeline from the `items` attribute (comma-separated). The CSS
 * (.x-timeline-item) draws the connecting line and the dots via ::before, so
 * each entry is simply a div with its text. The schema only stamps a single
 * empty item that the stylesheet does not target, so we render here. (#220)
 */
export function timeline(element, options = {}) {
  // #448: skip the class on a literal <div x-timeline> host -- timeline.css
  // selects the `x-timeline` TAG directly for that case now. Still added
  // for every OTHER host (x-timeline on a <div>, e.g. demos/playground.html),
  // since timeline.css's `.x-timeline`/`.x-timeline::before` rules still
  // select those by class.
  if (element.tagName.toLowerCase() !== 'x-timeline') element.classList.add('x-timeline');

  const authoredItems = (element._wbOriginalSlot || element.textContent || '').trim();
  const itemsAttr = element.getAttribute('items') || authoredItems;
  const items = itemsAttr.split(',').map((s) => s.trim()).filter(Boolean);
  element.items = items;

  if (items.length) {
    element.textContent = '';
    for (const text of items) {
      const item = document.createElement('div');
      item.className = 'x-timeline-item';
      item.textContent = text;
      element.appendChild(item);
    }
  }

  return () => element.classList.remove('x-timeline');
}

export default timeline;
