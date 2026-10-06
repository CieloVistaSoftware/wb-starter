/**
 * Timeline - Vertical timeline
 * Helper Attribute: [x-timeline]
 *
 * Builds the timeline from the `items` attribute (comma-separated). The CSS
 * (.x-timeline-item) draws the connecting line and the dots via ::before, so
 * each entry is simply a div with its text. The schema only stamps a single
 * empty item that the stylesheet does not target, so we render here. (#220)
 */
export function timeline(element, options = {}) {
  // #448: skip the class on a literal <div x-timeline> host -- timeline.css
  // selects the `[x-timeline]` TAG directly for that case now. Still added
  // for every OTHER host (x-timeline on a <div>, e.g. demos/playground.html),
  // since timeline.css's `.x-timeline`/`.x-timeline::before` rules still
  // select those by class.
  element.classList.add('x-timeline');

  // What the author wrote inside, as HTML. The schema builder has usually
  // replaced it by now and kept the original in _wbOriginalContent; '' there
  // means the author wrote nothing, so the stamped placeholder in
  // innerHTML must not be read as authored markup.
  const authored = (element._wbOriginalContent ?? element.innerHTML ?? '').trim();
  const itemsAttr = element.getAttribute('items');

  // #1188: hand-written entries (an <article> with a real <time>, as
  // time.md shows) stay as written. Only an items attribute or plain
  // comma-separated text is rebuilt into .x-timeline-item divs.
  if (!itemsAttr && /<[a-z]/i.test(authored)) {
    if (element.innerHTML.trim() !== authored) element.innerHTML = authored;
    element.items = [];
    return () => element.classList.remove('x-timeline');
  }

  const items = (itemsAttr || authored).split(',').map((s) => s.trim()).filter(Boolean);
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
