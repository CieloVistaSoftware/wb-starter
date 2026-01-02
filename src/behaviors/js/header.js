/**
 * Header Behavior
 * Generates a site/page header with logo, title, and optional elements
 * 
 * Usage:
 * <header data-wb="header" data-icon="📂" data-title="Project Index" data-badge="v1.0"></header>
 * <header data-wb="header" data-icon="🚀" data-title="My App" data-subtitle="Dashboard" data-sticky></header>
 */

// Auto-load CSS
const CSS_ID = 'wb-header-css';
if (!document.getElementById(CSS_ID)) {
  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = '/src/behaviors/css/header.css';
  document.head.appendChild(link);
}

export function header(element) {
  // Add base class
  element.classList.add('wb-header');
  
  // Get attributes
  const icon = element.dataset.icon || '';
  const title = element.dataset.title || '';
  const subtitle = element.dataset.subtitle || '';
  const badge = element.dataset.badge || '';
  const logoHref = element.dataset.logoHref || '';
  const sticky = element.hasAttribute('data-sticky');
  
  // Check for existing content (slot mode)
  const hasLeftSlot = element.querySelector('[slot="left"]');
  const hasRightSlot = element.querySelector('[slot="right"]');
  const hasCenterSlot = element.querySelector('[slot="center"]');
  
  // Build left section
  let leftContent = '';
  if (hasLeftSlot) {
    leftContent = hasLeftSlot.outerHTML;
  } else if (icon || title) {
    const logoInner = `
      ${icon ? `<span class="wb-header__icon">${icon}</span>` : ''}
      ${title ? `<span class="wb-header__title">${title}</span>` : ''}
      ${subtitle ? `<span class="wb-header__subtitle">${subtitle}</span>` : ''}
    `;
    
    leftContent = logoHref 
      ? `<a href="${logoHref}" class="wb-header__logo">${logoInner}</a>`
      : `<div class="wb-header__logo">${logoInner}</div>`;
  }
  
  // Build center section
  let centerContent = '';
  if (hasCenterSlot) {
    centerContent = `<div class="wb-header__center">${hasCenterSlot.outerHTML}</div>`;
  }
  
  // Build right section
  let rightContent = '';
  if (hasRightSlot) {
    rightContent = hasRightSlot.outerHTML;
  } else if (badge) {
    rightContent = `<span class="wb-tag-glass">${badge}</span>`;
  }
  
  // Render
  element.innerHTML = `
    <div class="wb-header__left">${leftContent}</div>
    ${centerContent}
    <div class="wb-header__right">${rightContent}</div>
  `;
  
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
        const right = element.querySelector('.wb-header__right');
        if (right) {
          right.innerHTML = `<span class="wb-tag-glass">${text}</span>`;
        }
      }
    }
  };
}
