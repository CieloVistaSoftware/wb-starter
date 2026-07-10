/**
 * WBDemo Component
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-demo>
 * Must be registered BEFORE wb-card so innerHTML is still raw at
 * connectedCallback time.
 * -----------------------------------------------------------------------------
 */
import { demo } from './demo.js';

// A page like pages/behaviors.html can have 40+ <wb-demo> blocks; building
// every single one (syntax-highlighted source panel, line numbers, control
// positioning — each requiring real DOM writes and layout reads) on first
// paint blocks the main thread for the ones stacked far below the fold that
// nobody has scrolled to yet. Deferring the actual build to "about to
// scroll into view" cuts that work down to roughly what's visible.
// Confirmed live: ~490ms of main-thread blocking time out of a ~710ms page
// navigation on behaviors.html, entirely from eagerly building all 44
// blocks up front.
let lazyObserver = null;
function getLazyObserver() {
  if (!lazyObserver) {
    // .site is pinned to 100dvh with overflow:hidden — #siteBody
    // (.site__body, overflow-y:auto) is the actual scroll container, not
    // the browser viewport (site.css's own comment: "so .site__body is the
    // SINGLE scroll container"). IntersectionObserver's default root is the
    // viewport, which never itself scrolls here — content scrolling inside
    // #siteBody wouldn't change the (stationary) viewport's intersection
    // with anything, so every element would only ever get evaluated once,
    // right at page load, and never again. Falls back to the default
    // (viewport) root if #siteBody isn't present — e.g. a bare test harness
    // not using the SPA shell.
    const root = document.getElementById('siteBody') || null;
    lazyObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          lazyObserver.unobserve(el);
          el._cleanup = demo(el, {
            title: el.getAttribute('title'),
            tag: el.getAttribute('tag'),
            columns: el.getAttribute('columns'),
            contentClass: el.getAttribute('content-class')
          });
        }
      },
      // Start building slightly before it's actually on screen so scrolling
      // to it doesn't show a pop-in.
      { root, rootMargin: '400px' }
    );
  }
  return lazyObserver;
}

export class WBDemo extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    // Children haven't upgraded yet — innerHTML is raw. Must capture this
    // NOW, synchronously, regardless of when the actual build happens —
    // by the time this scrolls into view, children may have already
    // upgraded and mutated their own markup.
    this._rawSource = this.innerHTML;

    getLazyObserver().observe(this);
  }

  disconnectedCallback() {
    // Never scrolled into view before navigating away — stop watching it.
    if (lazyObserver) lazyObserver.unobserve(this);
    // _cleanup may hold the Promise from an async WB.inject() (truthy but not
    // callable) — only invoke it when it's actually a function, or every
    // navigation throws "this._cleanup is not a function". (#174)
    if (typeof this._cleanup === 'function') {
      this._cleanup();
    }
  }
}

if (!customElements.get('wb-demo')) {
  customElements.define('wb-demo', WBDemo);
}
