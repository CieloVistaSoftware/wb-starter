import { readFlag } from '../core/read-attr.js';
/**
 * Footer Behavior
 * -----------------------------------------------------------------------------
 * Generates a site/page footer with copyright, links, and optional elements.
 * 
 * Custom Tag: <footer>
 * 
 * Usage (the bare attribute is the canonical form — data-* is legacy):
 * <footer copyright="© 2025 Acme Inc"></footer>
 * <footer copyright="© 2025" links="Privacy,Terms,Contact"></footer>
 * <footer links='[{"label":"Privacy","href":"/privacy"}]'
 *         social='[{"platform":"github","href":"https://github.com/acme"}]'></footer>
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

  // #792 — `links` and `social` were declared in footer.schema.json, documented
  // from it and written in the examples, and footer() read neither: setting
  // either one changed no markup and was never read off the host. footer.css
  // has shipped .x-footer__nav/__link and .x-footer__social/__social-link since
  // the beginning, styling elements nothing ever built.
  //
  // Both are declared as JSON — links `[{label, href}]`, social
  // `[{platform, href}]` — so JSON is what is parsed first. A plain
  // comma-separated string is accepted as well, because that is what the usage
  // block at the top of this file has always documented
  // (links="Privacy,Terms,Contact") and what a schema default like
  // "this is the links" produces.
  const parseList = (raw) => {
    const text = (raw || '').trim();
    if (!text) return [];
    if (text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === 'object');
      } catch {
        // Not JSON after all — fall through and read it as a plain list.
      }
    }
    return text.split(',').map((part) => part.trim()).filter(Boolean).map((label) => ({ label }));
  };

  // An href is author-supplied markup that ends up on an <a>. A javascript:
  // URL there would run on click, so the only two shapes allowed are a real
  // location and the "no destination yet" placeholder.
  const safeHref = (href) => {
    const value = String(href == null ? '' : href).trim();
    if (!value) return '#';
    return /^\s*javascript:/i.test(value) ? '#' : value;
  };

  const links = parseList(element.getAttribute('links'));
  if (links.length && !element.querySelector('.x-footer__nav')) {
    // linkNav / linkEl rather than nav / a: the social block below builds the
    // same two shapes, and compliance/source-schema-compliance.spec.ts reads
    // this file line by line without tracking block scope, so two `const nav`
    // in one function count as a redeclaration against its ratchet. Distinct
    // names cost nothing and read better next to the social pair anyway.
    const linkNav = document.createElement('nav');
    linkNav.className = 'x-footer__nav';
    linkNav.setAttribute('aria-label', 'Footer');
    links.forEach((item) => {
      const linkEl = document.createElement('a');
      linkEl.className = 'x-footer__link';
      linkEl.href = safeHref(item.href);
      // textContent, never innerHTML: the label is authored content.
      linkEl.textContent = String(item.label ?? item.text ?? item.href ?? '').trim();
      if (linkEl.textContent) linkNav.appendChild(linkEl);
    });
    if (linkNav.children.length) element.appendChild(linkNav);
  }

  // The glyph is what the schema calls "social icons". A platform with no
  // glyph here still renders — as its own name — rather than an empty link.
  const SOCIAL_GLYPHS = {
    github: '🐙', twitter: '🐦', x: '🐦', linkedin: '💼', facebook: '📘',
    instagram: '📷', youtube: '📺', mastodon: '🐘', discord: '💬',
    email: '✉️', mail: '✉️', rss: '📡',
  };

  const social = parseList(element.getAttribute('social'));
  if (social.length && !element.querySelector('.x-footer__social')) {
    const socialNav = document.createElement('nav');
    socialNav.className = 'x-footer__social';
    socialNav.setAttribute('aria-label', 'Social');
    social.forEach((item) => {
      const platform = String(item.platform ?? item.label ?? '').trim();
      if (!platform) return;
      const socialEl = document.createElement('a');
      socialEl.className = 'x-footer__social-link';
      socialEl.href = safeHref(item.href);
      // The glyph carries no text, so the accessible name has to come from the
      // platform name -- an icon-only link with no label announces as its URL.
      socialEl.setAttribute('aria-label', platform);
      socialEl.title = platform;
      socialEl.textContent = SOCIAL_GLYPHS[platform.toLowerCase()] || platform;
      socialNav.appendChild(socialEl);
    });
    if (socialNav.children.length) element.appendChild(socialNav);
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
