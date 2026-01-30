/**
 * Header Behavior
 * -----------------------------------------------------------------------------
 * Generates a site/page header with logo, title, and optional elements.
 * 
 * Custom Tag: <wb-header>
 * 
 * Usage:
 * <wb-header  data-icon="📂" data-title="Project Index" data-badge="v1.0"></header>
 * <wb-header  data-icon="🚀" data-title="My App" data-subtitle="Dashboard" data-sticky></header>
 * -----------------------------------------------------------------------------
 */

// Auto-load CSS
const CSS_ID = 'wb-header-css';
if (!document.getElementById(CSS_ID)) {
  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = '/src/styles/behaviors/header.css';
  document.head.appendChild(link);
}

export function header(element) {
  // Add base class
  element.classList.add('wb-header');
  
  // Get attributes
  const sticky = element.hasAttribute('data-sticky');
  
  // Apply sticky if requested
  if (sticky) {
    element.classList.add('wb-header--sticky');
  }
  
  // API
  element.wbHeader = {
    setTitle: (text) => {
      const titleEl = element.querySelector('.wb-header__title');
      if (titleEl) titleEl.textContent = text;
    },
    setIcon: (newIcon) => {
      const iconEl = element.querySelector('.wb-header__icon');
      if (iconEl) iconEl.textContent = newIcon;
    },
    setBadge: (text) => {
      const badgeEl = element.querySelector('.wb-header__right .wb-tag-glass');
      if (badgeEl) {
        badgeEl.textContent = text;
      } else {
        // If badge element doesn't exist, we can't update it easily without breaking structure
        // But we can try to find the right container
        const right = element.querySelector('.wb-header__right');
        if (right) {
           // Check if we already have a badge
           let badge = right.querySelector('.wb-tag-glass');
           if (!badge) {
               badge = document.createElement('span');
               badge.className = 'wb-tag-glass';
               right.prepend(badge);
           }
           badge.textContent = text;
        }
      }
    }
  };
}
