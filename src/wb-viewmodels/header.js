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
  element.classList.add('x-header');
  
  // Get attributes. Plain `sticky` is canonical (schema property, Law 11);
  // `data-sticky` accepted for back-compat only.
  const sticky = element.hasAttribute('sticky') || readFlag(element, 'sticky');
  
  // Apply sticky if requested
  if (sticky) {
    element.classList.add('x-header--sticky');
  }
  
  // Render the declared attributes (#903).
  //
  // header() used to read none of them: icon/title/subtitle/badge were
  // declared in the schema, documented, and offered by IntelliSense while
  // this function only added a class. header.css already ships
  // .x-header__icon/__title/__subtitle rules, so the CSS was waiting for
  // structure that nothing built -- and wbHeader.setTitle() queried
  // .x-header__title, an element that never existed.
  const icon = element.getAttribute('icon');
  const title = element.getAttribute('title');
  const subtitle = element.getAttribute('subtitle');
  const badge = element.getAttribute('badge');

  if ((icon || title || subtitle || badge) && !element.querySelector('.x-header__left')) {
    const left = document.createElement('div');
    left.className = 'x-header__left';

    if (icon) {
      const i = document.createElement('span');
      i.className = 'x-header__icon';
      i.textContent = icon;
      left.appendChild(i);
    }
    if (title) {
      const t = document.createElement('span');
      t.className = 'x-header__title';
      t.textContent = title;
      left.appendChild(t);
    }
    if (subtitle) {
      const st = document.createElement('span');
      st.className = 'x-header__subtitle';
      st.textContent = subtitle;
      left.appendChild(st);
    }
    element.prepend(left);

    if (badge) {
      const right = document.createElement('div');
      right.className = 'x-header__right';
      const b = document.createElement('span');
      // .x-tag-glass is the badge vocabulary setBadge() already looks for.
      b.className = 'x-tag-glass x-header__badge';
      b.textContent = badge;
      right.appendChild(b);
      element.appendChild(right);
    }
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
