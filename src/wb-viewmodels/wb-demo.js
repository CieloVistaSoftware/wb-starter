/**
 * WBDemo Component
 * -----------------------------------------------------------------------------
 * Custom Tag: <wb-demo>
 * Must be registered BEFORE wb-card so innerHTML is still raw at
 * connectedCallback time.
 * -----------------------------------------------------------------------------
 */
import { demo } from './demo.js';
import { ensureBehaviorCss } from '../core/style-loader.js';

// wb-demo is a real custom element, not a WB.inject()-dispatched behavior
// (see wb.js's own comment on why <wb-grid>/<wb-demo> stayed custom
// elements) — it never passes through the choke point that loads every
// other behavior's CSS just-in-time (#342), so it has to ask for its own.
// Fire-and-forget, not awaited: connectedCallback's synchronous timing is
// load-bearing (see the ordering comment on connectedSoFar/myIndex below) —
// making this async would break that guarantee for a same-session cache hit
// that's usually instant anyway.
ensureBehaviorCss('demo');

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

// A docs page typically has just 1-5 <wb-demo> blocks, and deep enough into
// the page's own prose that the FIRST one can already sit well past a normal
// viewport height + rootMargin (confirmed live: 1361px down on a cardhero
// doc page, past 900px viewport + 400px margin) — laziness buys nothing
// there (nobody's deferring 44 blocks) but breaks "the demo is just there,"
// which readers and tests both expect. Build the first few unconditionally;
// only defer beyond that, where a real many-block page (behaviors.html,
// components.html) actually benefits.
const EAGER_BUILD_COUNT = 5;

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

    // Custom elements upgrade in document order as the parser encounters
    // them, synchronously — by the time THIS connectedCallback runs, every
    // earlier <wb-demo> on the page is already connected and shows up here
    // (demo.js's own source-extraction logic relies on this same ordering
    // guarantee).
    const connectedSoFar = document.querySelectorAll('wb-demo');
    const myIndex = Array.prototype.indexOf.call(connectedSoFar, this);

    if (myIndex < EAGER_BUILD_COUNT) {
      this._cleanup = demo(this, {
        title: this.getAttribute('title'),
        tag: this.getAttribute('tag'),
        columns: this.getAttribute('columns'),
        contentClass: this.getAttribute('content-class')
      });
    } else {
      getLazyObserver().observe(this);
    }
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
