/**
 * Footer Behavior
 * -----------------------------------------------------------------------------
 * Generates a site/page footer with copyright, links, and optional elements.
 * 
 * Custom Tag: <wb-footer>
 * 
 * Usage:
 * <wb-footer  data-copyright="© 2025 Acme Inc"></footer>
 * <footer data-copyright="© 2025" data-links="Privacy,Terms,Contact"></footer>
 * -----------------------------------------------------------------------------
 */

// behaviors/footer.css is already loaded unconditionally on every page via
// site.css's own @import — this used to also inject a duplicate <link> for
// it here, fetching the same file a second time on every load (#312
// follow-up, confirmed via HAR: footer.css was the only other behavior CSS
// file fetched twice per page load, alongside header.css).

export function footer(element) {
  // Add base class
  element.classList.add('wb-footer');
  
  // Get attributes
  const sticky = element.hasAttribute('data-sticky');
  
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
