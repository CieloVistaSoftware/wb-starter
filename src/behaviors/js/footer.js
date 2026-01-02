/**
 * Footer Behavior
 * Generates a site/page footer with copyright, links, and optional elements
 * 
 * Usage:
 * <footer data-wb="footer" data-copyright="© 2025 Acme Inc"></footer>
 * <footer data-copyright="© 2025" data-links="Privacy,Terms,Contact"></footer>
 */

// Auto-load CSS
const CSS_ID = 'wb-footer-css';
if (!document.getElementById(CSS_ID)) {
  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = '/src/behaviors/css/footer.css';
  document.head.appendChild(link);
}

export function footer(element) {
  // Add base class
  element.classList.add('wb-footer');
  
  // Get attributes
  const copyright = element.dataset.copyright || '';
  const links = element.dataset.links || '';
  const linksHref = element.dataset.linksHref || ''; // comma-separated hrefs
  const brand = element.dataset.brand || '';
  const social = element.dataset.social || ''; // e.g., "github,twitter,linkedin"
  const socialHrefs = element.dataset.socialHrefs || '';
  const sticky = element.hasAttribute('data-sticky');
  
  // Check for existing content (slot mode)
  const hasLeftSlot = element.querySelector('[slot="left"]');
  const hasRightSlot = element.querySelector('[slot="right"]');
  const hasCenterSlot = element.querySelector('[slot="center"]');
  
  // Build left section
  let leftContent = '';
  if (hasLeftSlot) {
    leftContent = hasLeftSlot.outerHTML;
  } else if (copyright || brand) {
    leftContent = `
      ${brand ? `<span class="wb-footer__brand">${brand}</span>` : ''}
      ${copyright ? `<span class="wb-footer__copyright">${copyright}</span>` : ''}
    `;
  }
  
  // Build center section (links)
  let centerContent = '';
  if (hasCenterSlot) {
    centerContent = hasCenterSlot.outerHTML;
  } else if (links) {
    const linkNames = links.split(',').map(s => s.trim());
    const linkUrls = linksHref ? linksHref.split(',').map(s => s.trim()) : [];
    
    const linkElements = linkNames.map((name, i) => {
      const href = linkUrls[i] || `#${name.toLowerCase().replace(/\s+/g, '-')}`;
      return `<a href="${href}" class="wb-footer__link">${name}</a>`;
    }).join('');
    
    centerContent = `<nav class="wb-footer__nav">${linkElements}</nav>`;
  }
  
  // Build right section (social)
  let rightContent = '';
  if (hasRightSlot) {
    rightContent = hasRightSlot.outerHTML;
  } else if (social) {
    const socialNames = social.split(',').map(s => s.trim().toLowerCase());
    const socialUrls = socialHrefs ? socialHrefs.split(',').map(s => s.trim()) : [];
    
    const socialIcons = {
      github: '🐙',
      twitter: '🐦',
      linkedin: '💼',
      facebook: '📘',
      instagram: '📷',
      youtube: '📺',
      email: '📧',
      rss: '📡'
    };
    
    const socialElements = socialNames.map((name, i) => {
      const socialHref = socialUrls[i] || `#${name}`;
      const socialIcon = socialIcons[name] || '🔗';
      return `<a href="${socialHref}" class="wb-footer__social-link" title="${name}" target="_blank">${socialIcon}</a>`;
    }).join('');
    
    rightContent = `<div class="wb-footer__social">${socialElements}</div>`;
  }
  
  // Render
  element.innerHTML = `
    <div class="wb-footer__left">${leftContent}</div>
    <div class="wb-footer__center">${centerContent}</div>
    <div class="wb-footer__right">${rightContent}</div>
  `;
  
  // Apply sticky if requested
  if (sticky) {
    element.classList.add('wb-footer--sticky');
  }
  
  // API
  element.wbFooter = {
    setCopyright: (text) => {
      const copyrightEl = element.querySelector('.wb-footer__copyright');
      if (copyrightEl) copyrightEl.textContent = text;
    },
    setBrand: (text) => {
      const brandEl = element.querySelector('.wb-footer__brand');
      if (brandEl) brandEl.textContent = text;
    }
  };
}
