import { readFlag } from '../core/read-attr.js';
/**
 * Footer Behavior
 * -----------------------------------------------------------------------------
 * Generates a site/page footer with copyright, links, and optional elements.
 * 
 * Custom Tag: <footer>
 * 
 * Usage:
 * <footer  data-copyright="© 2025 Acme Inc"></footer>
 * <footer data-copyright="© 2025" data-links="Privacy,Terms,Contact"></footer>
 * -----------------------------------------------------------------------------
 */

// behaviors/footer.css is already loaded unconditionally on every page via
// site.css's own @import — this used to also inject a duplicate <link> for
// it here, fetching the same file a second time on every load (#312
// follow-up, confirmed via HAR: footer.css was the only other behavior CSS
// file fetched twice per page load, alongside header.css).

export function footer(element) {
  // #448: skip the class on a literal <footer> host -- footer.css
  // selects the `x-footer` TAG directly for that case now. Still added
  // for a native <footer> host (autoInject), since footer.css's
  // `.x-footer` rules still select it by class.
  if (element.tagName.toLowerCase() !== 'x-footer') element.classList.add('x-footer');
  
  // Get attributes
  const sticky = readFlag(element, 'sticky');
  
  // Apply sticky if requested
  if (sticky) {
    element.classList.add('x-footer--sticky');
  }
  
  // API
  element.wbFooter = {
    setCopyright: (text) => {
      const copyrightEl = element.querySelector('.x-footer__copyright');
      if (copyrightEl) copyrightEl.textContent = text;
    },
    setBrand: (text) => {
      const brandEl = element.querySelector('.x-footer__brand');
      if (brandEl) brandEl.textContent = text;
    }
  };
}
