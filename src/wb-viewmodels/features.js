/**
 * Features Section Component
 * Tag: <wb-features>
 * Props:
 *  - title (data-title)    : main heading
 *  - subtitle (data-subtitle): subheading
 * Usage: <wb-features heading="Everything You Need" subtitle="..."> <wb-card>...</wb-card> </wb-features>
 */
export default function features(element, options = {}) {
  const title = options.title || element.dataset.title || element.getAttribute('data-title') || '';
  const subtitle = options.subtitle || element.dataset.subtitle || element.getAttribute('data-subtitle') || '';

  // Ensure base class
  element.classList.add('wb-features');
  // Keep existing page section classes if present, or add defaults
  if (!element.classList.contains('page__section')) element.classList.add('page__section');
  if (!element.classList.contains('bg-subtle')) element.classList.add('bg-subtle');

  // Build header if not already present
  let header = element.querySelector('.section-header');
  if (!header) {
    header = document.createElement('div');
    header.className = 'section-header';
    element.insertBefore(header, element.firstChild);
  }

  // Title
  let h2 = header.querySelector('.section-title');
  if (!h2) {
    h2 = document.createElement('h2');
    h2.className = 'section-title';
    header.appendChild(h2);
  }
  if (title) h2.textContent = title;

  // Subtitle
  let p = header.querySelector('.section-subtitle');
  if (!p) {
    p = document.createElement('p');
    p.className = 'section-subtitle';
    header.appendChild(p);
  }
  if (subtitle) p.textContent = subtitle;

  // Slot container for cards: prefer an existing grid or create one
  let grid = element.querySelector('.features-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.className = 'features-grid';
    // Move remaining children (after header) into grid
    const children = Array.from(element.children).filter(ch => ch !== header);
    children.forEach(ch => grid.appendChild(ch));
    element.appendChild(grid);
  }

  // Accessibility: ensure semantic role
  element.setAttribute('role', element.getAttribute('role') || 'region');
  if (title) element.setAttribute('aria-label', title);

  // Minimal public API
  element.wbFeatures = {
    setTitle: (t) => { h2.textContent = t; element.setAttribute('aria-label', t); },
    setSubtitle: (s) => { p.textContent = s; }
  };

  element.dataset.wbReady = (element.dataset.wbReady || '') + ' features';

  // Cleanup
  return () => {
    delete element.wbFeatures;
  };
}
