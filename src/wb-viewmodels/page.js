/**
 * Page shell component providing header/main/footer structure.
 * - `<wb-page>` wrapper for consistent page layouts.
 */
export function cc() {}

// Lightweight wb-page custom element — provides default header/main/footer shell
function page(element, options = {}) {
  // No heavy JS required; ensure ARIA and title handling
  element.classList.add('wb-page');
  if (element.hasAttribute('title')) {
    try { document.title = element.getAttribute('title'); } catch (e) {}
  }
  if (element.hasAttribute('keep-header-at-top') || element.getAttribute('keepHeaderAtTop') === 'true') {
    element.setAttribute('keep-header-at-top', '');
  }

  // Migration: detect legacy slot usage and convert to direct child elements (non-destructive)
  const legacySlots = Array.from(element.querySelectorAll('[slot]'));
  if (legacySlots.length) {
    console.warn('[wb-page] legacy `slot` usage detected — slots are deprecated. Migrating content to direct child elements.');
    // header
    const headerSlot = legacySlots.find(e => e.getAttribute('slot') === 'header');
    if (headerSlot) {
      let headerEl = element.querySelector('header');
      if (!headerEl) {
        headerEl = document.createElement('header');
        headerEl.className = 'site__header';
        element.insertBefore(headerEl, element.firstChild);
      }
      while (headerSlot.firstChild) headerEl.appendChild(headerSlot.firstChild);
      headerSlot.remove();
    }
    // footer
    const footerSlot = legacySlots.find(e => e.getAttribute('slot') === 'footer');
    if (footerSlot) {
      let footerEl = element.querySelector('footer');
      if (!footerEl) {
        footerEl = document.createElement('footer');
        footerEl.className = 'site__footer';
        element.appendChild(footerEl);
      }
      while (footerSlot.firstChild) footerEl.appendChild(footerSlot.firstChild);
      footerSlot.remove();
    }
    // move any remaining slotted content into main
    const mainEl = element.querySelector('main') || (() => { const m = document.createElement('main'); m.className = 'site__main'; element.appendChild(m); return m; })();
    legacySlots.filter(s => !['header','footer'].includes(s.getAttribute('slot'))).forEach(s => {
      while (s.firstChild) mainEl.appendChild(s.firstChild);
      s.remove();
    });
  }

  // If native <slot> elements are present, warn and remove them (migrate their children)
  const nativeSlots = Array.from(element.querySelectorAll('slot'));
  if (nativeSlots.length) {
    console.warn('[wb-page] native <slot> elements detected — migrating their content and removing slots.');
    nativeSlots.forEach(s => {
      const parent = s.parentElement || element;
      while (s.firstChild) parent.insertBefore(s.firstChild, s);
      s.remove();
    });
  }

  // Enforce site default theme: if author did not set a theme on <html>, wb-page defaults to dark
  try {
    if (!document.documentElement.hasAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (err) {
    console.info('[wb-page] could not set default theme (storage or CSP may restrict)');
  }

  element.dataset.wbReady = (element.dataset.wbReady || '') + ' page';
}

// Register behavior name for lazy autoinject system
export const behaviorName = 'page';
export default page;