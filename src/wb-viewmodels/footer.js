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
  element.classList.add('x-footer');
  
  // Get attributes
  // Bare `sticky` is the canonical form (schema property, Law 11); readFlag
  // alone only saw data-sticky, so the documented form did nothing (#903).
  const sticky = element.hasAttribute('sticky') || readFlag(element, 'sticky');
  
  // Apply sticky if requested
  if (sticky) {
    element.classList.add('x-footer--sticky');
  }
  
  // Render the declared attributes (#903). footer() read neither brand nor
  // copyright, while footer.css already ships .x-footer__brand/__copyright
  // rules and wbFooter.setBrand() queried elements nothing ever built.
  const brand = element.getAttribute('brand');
  const copyright = element.getAttribute('copyright');

  if ((brand || copyright) && !element.querySelector('.x-footer__copyright')) {
    if (brand) {
      const b = document.createElement('span');
      b.className = 'x-footer__brand';
      b.textContent = brand;
      element.prepend(b);
    }
    if (copyright) {
      const c = document.createElement('span');
      c.className = 'x-footer__copyright';
      // John, on <footer copyright="2026"> rendering a bare "2026":
      // "Add copy right symbol". A copyright notice without the symbol is not
      // a copyright notice. Authors who already write it -- the documented
      // examples use copyright="© 2025 Acme Inc" -- must not get "© © 2025",
      // so it is added only when absent.
      const hasSymbol = /©|\(c\)|&copy;/i.test(copyright);
      c.textContent = hasSymbol ? copyright : '© ' + copyright;
      element.appendChild(c);
    }
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
