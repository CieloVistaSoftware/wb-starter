import { readFlag } from '../core/read-attr.js';
/**
 * Header Behavior
 * -----------------------------------------------------------------------------
 * Generates a site/page header with logo, title, and optional elements.
 * 
 * Custom Tag: <header>
 * 
 * Usage (plain attributes -- see src/wb-models/header.schema.json):
 * <header icon="📂" title="Project Index" badge="v1.0"></header>
 * <header icon="🚀" title="My App" subtitle="Dashboard" sticky></header>
 * -----------------------------------------------------------------------------
 */

// behaviors/header.css is already loaded unconditionally on every page via
// site.css's own @import — this used to also inject a duplicate <link> for
// it here, fetching the same file a second time on every load (#312
// follow-up, confirmed via HAR: header.css was the only behavior CSS file
// fetched twice per page load).

export function header(element) {
  // #448: skip the class on a literal <header> host -- header.css
  // selects the `.x-header` TAG directly for that case now. Still added
  // for a native <header> host (autoInject; header.css's own comment
  // documents this exact collision), since header.css's `.x-header` rules
  // still select it by class.
  if (element.tagName.toLowerCase() !== 'x-header') element.classList.add('x-header');
  
  // Get attributes. Plain `sticky` is canonical (schema property, Law 11);
  // `data-sticky` accepted for back-compat only.
  const sticky = element.hasAttribute('sticky') || readFlag(element, 'sticky');
  
  // Apply sticky if requested
  if (sticky) {
    element.classList.add('x-header--sticky');
  }
  
  // API
  element.wbHeader = {
    setTitle: (text) => {
      const titleEl = element.querySelector('.x-header__title');
      if (titleEl) titleEl.textContent = text;
    },
    setIcon: (newIcon) => {
      const iconEl = element.querySelector('.x-header__icon');
      if (iconEl) iconEl.textContent = newIcon;
    },
    setBadge: (text) => {
      // #824: look for the badge the schema actually built first. This used
      // to query only .x-tag-glass -- a class from card.js's styling
      // vocabulary that nothing in the header path ever applied -- so the
      // lookup always missed and the else branch below APPENDED a second
      // badge instead of updating the first. Two calls, three badges.
      const badgeEl = element.querySelector('.x-header__badge')
        || element.querySelector('.x-header__right .x-tag-glass');
      if (badgeEl) {
        badgeEl.textContent = text;
      } else {
        // If badge element doesn't exist, we can't update it easily without breaking structure
        // But we can try to find the right container
        const right = element.querySelector('.x-header__right');
        if (right) {
           // Check if we already have a badge
           let badge = right.querySelector('.x-tag-glass');
           if (!badge) {
               badge = document.createElement('span');
               badge.className = 'x-tag-glass';
               right.prepend(badge);
           }
           badge.textContent = text;
        }
      }
    }
  };
}
