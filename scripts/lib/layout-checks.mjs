/**
 * layout-checks.mjs -- the in-page measurements behind two layout gates,
 * shared so that every caller applies the same rule (#1832).
 *
 *   overlapViolations       tests/compliance/no-element-overlap.spec.ts (§22, #274)
 *   panelPaddingViolations  tests/compliance/demo-layout-standards.spec.ts
 *                           ("no text within 1rem of a content-panel edge", §13)
 *
 * Both specs pass these functions to page.evaluate(), and so does
 * packages/site-migrate, which runs the same checks against the page it
 * proposes. They used to live inline in the specs; a second copy in the CLI
 * would have drifted from the gate it claims to mirror.
 *
 * Each function must stay self-contained: Playwright sends its source text to
 * the page, so it may not reference anything outside its own body.
 */

/** Minimum overlap width AND height (px) that counts as a real collision. */
export const MIN_OVERLAP_DIM = 3;
/** 1rem: DEMOS-AND-DOCS-STANDARDS.md §13's documented minimum text inset. */
export const MIN_TEXT_EDGE_PX = 16;
/** A box smaller than this is a UI atom, not a content panel. */
export const MIN_PANEL_WIDTH = 120;
export const MIN_PANEL_HEIGHT = 32;

/**
 * Every pair of painted elements that visually overlap without being meant
 * to, as one line each. The rationale for each exclusion is beside it.
 * @param {number} minOverlapDim
 * @returns {string[]}
 */
export function overlapViolations(minOverlapDim) {
  const problems = [];

  // Known overlay/decoration classes that render via position:absolute
  // (not fixed/sticky), so the position check alone won't exclude
  // them. Grepped from src/wb-viewmodels/tooltip.js, overlay.js and
  // src/styles/behaviors/{dropdown,modal,popover,toast,dialog,
  // drawer}.css + x-signature.css.
  //
  // #540: x-card__overlay (src/styles/behaviors/hero.css,
  // x-cardhero's "legibility scrim") wasn't in this list even though
  // it's the exact same pattern -- a position:absolute, z-index:0
  // decorative layer that ALWAYS renders behind its sibling
  // .x-card__hero-content (z-index:1, set two rules below it in
  // hero.css). Confirmed live on demos/charity-food.html: the scrim's
  // full-card box geometrically overlaps the hero title/subtitle
  // bounding boxes, but the text renders cleanly on top per the
  // z-index stacking -- not a visual defect, just a gap in this
  // list's original grep (which covered tooltip/popover/modal/dialog/
  // toast/drawer but never card.css/hero.css's own scrim).
  //
  // #540: x-demo__card-doc-link (src/styles/behaviors/demo.css #388,
  // src/wb-viewmodels/demo.js's attachCardDocLink) is demo.js's own
  // per-card "📖" docs badge, attached to the top-right corner of
  // EVERY x-card* element inside a <div x-demo> grid site-wide --
  // demo.css's own comment calls it out explicitly: "Sits at the
  // card's own top-right corner, slightly overlapping the border, so
  // it's clearly a separate 'meta/docs' affordance." Confirmed live
  // on demos/site/cards.html: dozens of these badges geometrically
  // overlap their card's header/image by design (position:absolute,
  // top:-0.5rem, right:-0.5rem, z-index:5) -- this single class
  // explains the bulk of this codebase's demo-page failures under
  // §22, since nearly every demos/**/*.html and pages/**/*.html file
  // renders at least one <div x-demo> grid of x-card* examples.
  const OVERLAY_CLASS_RE = new RegExp(
    [
      'x-tooltip', 'x-tooltip__arrow', 'x-tooltip__content', 'x-tooltip-glass',
      'x-popover', 'x-popover--trigger',
      'x-dropdown-menu',
      'x-modal', 'x-modal-content', 'x-modal-glass-overlay', 'x-modal-glass-content',
      '.x-dialog', 'x-dialog--trigger',
      'x-toast', 'x-toast__container',
      'x-lightbox',
      'x-drawer__panel', 'x-drawer__backdrop',
      'x-offcanvas',
      'x-sheet',
      'x-notes__backdrop', 'x-notes__drawer',
      'site__nav-backdrop',
      'x-demo__card-doc-link',
      // #556: the native <input> that drives a <div x-switch>'s :checked
      // state (switch.css's own comment: "visually-hidden native
      // checkbox (state driver)") -- position:absolute, opacity:0,
      // deliberately sized/positioned to sit exactly under the visible
      // .x-switch__thumb/.x-switch__track it controls, same
      // "invisible input behind a styled visual" pattern countless
      // custom checkbox/switch/radio components use. Confirmed live on
      // demos/site/forms.html: isVisible()'s opacity===0 check misses
      // this element for its `disabled` demo instance specifically
      // (Chromium's own disabled-control rendering reports a non-zero
      // effective opacity there, no author CSS involved), so it still
      // reached the candidate set and got flagged as "overlapping"
      // its own thumb -- the same element pair, on the SAME component,
      // that opacity:0 already correctly excludes for every OTHER
      // (non-disabled) switch on the page.
      'x-switch__input',
      // #556: x-stagelight's "beam" variant (stagelight.js) is a
      // decorative lighting-effect demo -- position:absolute,
      // height:100vh (deliberately spans the full viewport height,
      // "Long beam" per its own comment), pointer-events:none
      // (explicitly click-through), mix-blend-mode:screen (a blend
      // mode that exists specifically to LAYER light over content
      // without fully obscuring it). Confirmed live on
      // demos/site/effects.html: the beam swings/rotates across
      // whatever content happens to sit below its demo card,
      // including that same card's own <pre>/<code> "here's the
      // markup" sample -- by design, same category as this list's
      // tooltip/popover/modal/toast entries, just a lighting effect
      // instead of a UI overlay.
      'x-stagelight__beam',
    ].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
    // x-card__overlay needs an exact-token match (word-boundary
    // anchored to whitespace/string edges), not a plain substring
    // like every entry above -- unanchored, it would ALSO swallow
    // the unrelated x-card__overlay-content/-title/-subtitle classes
    // from cardoverlay() (card.js's separate image-caption component,
    // src/wb-viewmodels/card.js ~L2130-2168), whose text is real
    // visible content sitting on an image, not a decorative layer
    // behind other content -- those must stay checked.
    + '|(?:^|\\s)x-card__overlay(?:\\s|$)'
  );

  function isVisible(el, cs) {
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    if (el.closest('[aria-hidden="true"]')) return false;
    // checkVisibility() is the authoritative "is this actually painted"
    // API -- getComputedStyle()/getBoundingClientRect() alone say
    // display:block with a real, non-zero rect for content inside a
    // CLOSED <details>, even though Chromium never paints it (verified
    // live: checkVisibility() correctly returns false there while
    // computed display still reads "block"). Without this check, every
    // closed <details>'s body content was flagged as "overlapping"
    // whatever sits after the accordion in the page -- the single
    // biggest source of false positives found while building this test.
    if (typeof el.checkVisibility === 'function') {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) {
        return false;
      }
    }
    return true;
  }

  // #540: CSS `position` is never inherited -- a plain, unstyled text
  // <div> nested inside a position:fixed toast/panel (e.g. the site's
  // own #x-error-display error-log viewer, src/core/error-log*.js)
  // computes as position:static on ITSELF, even though its fixed
  // ancestor pins the whole panel to a screen corner regardless of
  // document flow. The plain `cs.position === 'fixed'` check below
  // only ever looked at the candidate element's own computed style,
  // never its ancestor chain, so every such descendant slipped through
  // as a normal candidate and got flagged as "overlapping" whatever
  // page content happened to sit under that screen corner. Confirmed
  // live on demos/site/cards.html: a deliberately-broken cardhero demo
  // (background="hero.jpg", 404) throws into the global error handler
  // by design (#534), and its error text -- correctly pinned in a
  // fixed corner toast -- was reported as overlapping half the page.
  // data-allow-overlap already walked the ancestor chain via
  // closest() two lines below; fixed/sticky needed the same treatment.
  function hasFixedOrStickyAncestor(el) {
    let node = el.parentElement;
    while (node) {
      if (getComputedStyle(node).position === 'fixed' || getComputedStyle(node).position === 'sticky') return true;
      node = node.parentElement;
    }
    return false;
  }

  // #556: a CSS multi-column ancestor (`column-count`/`columns`, e.g.
  // demos/schema-first-architecture.html's academic-paper-style
  // `.paper-body { column-count: 2 }`) fragments a paragraph's paint
  // across two disjoint boxes -- one per column -- but
  // getBoundingClientRect() (and the Range-based text rect above) only
  // ever reports the smallest SINGLE rect containing every fragment,
  // which spans horizontally across BOTH columns including the gap
  // between them. That inflated union box can numerically "overlap"
  // an unrelated paragraph sitting in the other column at a similar
  // vertical position, even though nothing is actually painted in the
  // gap -- confirmed live: two <p> tags with no shared ancestor
  // closer than <body> and no other positioning involved were flagged
  // purely because of this column fragmentation. Properly comparing
  // per-fragment rects (getClientRects()) is a bigger lift than this
  // fix warrants for what's currently a single one-off demo page, so
  // (same tradeoff as the fixed/sticky-ancestor carve-out above) any
  // content inside a real multi-column flow is excluded from
  // detection entirely rather than risk this same false positive
  // reappearing wherever multi-column text is used next.
  function hasMultiColumnAncestor(el) {
    let node = el;
    while (node) {
      const ncs = getComputedStyle(node);
      if (ncs.columnCount !== 'auto' || (ncs.columnWidth !== 'auto' && ncs.columnWidth !== '0px')) return true;
      node = node.parentElement;
    }
    return false;
  }

  function isLayeringException(el, cs) {
    if (cs.position === 'fixed' || cs.position === 'sticky') return true;
    if (hasFixedOrStickyAncestor(el)) return true;
    if (OVERLAY_CLASS_RE.test(el.className || '')) return true;
    if (el.hasAttribute('data-allow-overlap')) return true;
    if (el.closest('[data-allow-overlap]')) return true;
    if (hasMultiColumnAncestor(el)) return true;
    return false;
  }

  /** @typedef {{hasBg: boolean, hasBorder: boolean, hasShadow: boolean, isReplaced: boolean, hasOwnText: boolean}} Paint */

  function getPaint(el, cs) {
    const bg = cs.backgroundColor;
    const hasBg = !!bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)';
    const hasBgImage = !!cs.backgroundImage && cs.backgroundImage !== 'none';
    const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some(
      (side) => parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none'
    );
    const hasShadow = !!cs.boxShadow && cs.boxShadow !== 'none';
    const tag = el.tagName.toLowerCase();
    const isReplaced = ['img', 'svg', 'canvas', 'video', 'iframe', 'picture'].includes(tag);
    const hasOwnText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
    );
    return { hasBg: hasBg || hasBgImage, hasBorder, hasShadow, isReplaced, hasOwnText };
  }

  // For a text-only element (no background/border/shadow/replaced
  // media of its own), use the tight bounding box of its own actual
  // text runs instead of its full block box — a block can be much
  // wider/taller than the glyphs it actually paints (wrapped text,
  // line-height, text-align).
  function getPaintRect(el, paint) {
    if (paint.hasOwnText && !paint.hasBg && !paint.hasBorder && !paint.hasShadow && !paint.isReplaced) {
      const textNodes = Array.from(el.childNodes).filter(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
      );
      if (textNodes.length) {
        const range = document.createRange();
        range.setStart(textNodes[0], 0);
        const last = textNodes[textNodes.length - 1];
        range.setEnd(last, (last.textContent || '').length);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return rect;
      }
    }
    return el.getBoundingClientRect();
  }

  /** @typedef {{left: number, right: number, top: number, bottom: number, width: number, height: number}} Rect */

  // Clip a rect against every `overflow: hidden`/`clip`/`auto`/`scroll`
  // ancestor.
  // Found live on pages/home.html: <div x-demo> starts as a collapsed
  // `height: 32px; overflow: hidden` skeleton until its lazy-build
  // (IntersectionObserver-driven grid construction) runs; the demo's
  // real content -- a <div x-cardhero> -- is already fully laid out
  // *inside* it with its true ~400px height, so getBoundingClientRect()
  // reports geometry hundreds of pixels below the collapsed parent's
  // own clipped box. checkVisibility() does NOT catch this (clipping
  // via overflow/height is a paint-region concern, not an "is this
  // element suppressed" concern -- confirmed live: checkVisibility()
  // returned true for content clipped this way). Without this,
  // every element inside a not-yet-expanded collapsed container was
  // flagged as "overlapping" whatever renders after it.
  //
  // #556: `auto`/`scroll` clip exactly like `hidden` for THIS purpose
  // -- content past the scrollport is just as invisible on initial
  // paint, only reachable by scrolling. Found live on pages/behaviors.html:
  // #behaviors-search-results is a real, intentional always-populated
  // list (#642 -- "I want an element that has 69 rows of information"),
  // deliberately bounded with `max-height: 16rem; overflow-y: auto`
  // (behaviors.css) so a broad query's 80+ rows scroll internally
  // instead of blowing out the hero. Rows past the 16rem scrollport
  // still get a real laid-out rect from getBoundingClientRect() (flow
  // layout doesn't stop at the scroll boundary), so without clipping
  // here, a row scrolled out of view was flagged as "overlapping"
  // <nav> content sitting after the hero in the document -- geometry
  // that's true on paper but never actually painted on top of
  // anything, exactly the same false positive already fixed for
  // overflow:hidden above, just via scroll instead of clip.
  //
  // The walk starts at `el` ITSELF, not at el.parentElement. For a
  // border-box paint rect that is a no-op (intersecting a box with its
  // own box changes nothing), but the Range-based rect above is NOT a
  // box the element clips for free: it is the geometry of the element's
  // own text runs in full, laid out as though nothing capped them. An
  // element that clips ITSELF -- `overflow: hidden` plus a max-height or
  // a line-clamp -- therefore reported text hundreds of pixels below the
  // region Chromium actually paints. Found live on demos/site/cards.html:
  // card.css's `.x-card__expandable-content` is exactly that shape
  // (`overflow: hidden; max-height: var(--x-card-expandable-max-height,
  // none)`), and cardexpandable() (src/wb-viewmodels/card.js) collapses
  // it to its 100px default; the ~330 characters of that demo's own
  // `content` wrap to roughly 330px of text inside a `size="sm"` card, so
  // the unclipped Range rect ran ~230px past the collapsed box and was
  // reported as overlapping the card's OWN footer (232x60px) and its
  // "Show More" button (232x35px) -- neither of which anything is ever
  // drawn on top of. Same class of false positive the ancestor walk below
  // already fixes, just one level closer in.
  function getClippedRect(el, rect) {
    let r = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: 0, height: 0 };
    let node = el;
    while (node && node !== document.documentElement) {
      const ncs = getComputedStyle(node);
      const clipsX = ncs.overflowX === 'hidden' || ncs.overflowX === 'clip' || ncs.overflowX === 'auto' || ncs.overflowX === 'scroll';
      const clipsY = ncs.overflowY === 'hidden' || ncs.overflowY === 'clip' || ncs.overflowY === 'auto' || ncs.overflowY === 'scroll';
      if (clipsX || clipsY) {
        const nRect = node.getBoundingClientRect();
        const left = clipsX ? Math.max(r.left, nRect.left) : r.left;
        const right = clipsX ? Math.min(r.right, nRect.right) : r.right;
        const top = clipsY ? Math.max(r.top, nRect.top) : r.top;
        const bottom = clipsY ? Math.min(r.bottom, nRect.bottom) : r.bottom;
        if (right <= left || bottom <= top) return null; // fully clipped away -- not actually painted anywhere
        r = { left, right, top, bottom, width: 0, height: 0 };
      }
      node = node.parentElement;
    }
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.right - r.left, height: r.bottom - r.top };
  }

  const all = Array.from(document.querySelectorAll('body *'));
  const SKIP_TAGS = new Set(['script', 'style', 'link', 'meta', 'template', 'noscript', 'br', 'wbr', 'option']);

  const candidates = [];
  for (const el of all) {
    if (!(el instanceof HTMLElement)) continue;
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) continue;

    const cs = getComputedStyle(el);
    if (!isVisible(el, cs)) continue;
    if (isLayeringException(el, cs)) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;

    const paint = getPaint(el, cs);
    if (!paint.hasBg && !paint.hasBorder && !paint.hasShadow && !paint.isReplaced && !paint.hasOwnText) {
      continue; // pure layout wrapper — paints nothing of its own, can't visually occlude anything
    }

    const paintRect = getPaintRect(el, paint);
    if (paintRect.width < 2 || paintRect.height < 2) continue;

    const clipped = getClippedRect(el, paintRect);
    if (!clipped || clipped.width < 2 || clipped.height < 2) continue;

    candidates.push({ el, rect: clipped });
  }

  function contains(a, b) {
    return a.left <= b.left + 0.5 && a.top <= b.top + 0.5 && a.right >= b.right - 0.5 && a.bottom >= b.bottom - 0.5;
  }

  function label(el) {
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `<${el.tagName.toLowerCase()}${id}${cls}> "${text}"`;
  }

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const A = candidates[i];
      const B = candidates[j];
      if (A.el.contains(B.el) || B.el.contains(A.el)) continue; // ancestor/descendant — content, not a collision

      // Two inline runs sharing a parent are text flowing across lines,
      // not a collision. Their border boxes legitimately overlap when
      // line-height is tighter than the inline content, which is how
      // <code.x-code> "x-ripple" was reported as overlapping
      // <code.x-code> "x-fadein" by 48x5px — adjacent chips in one
      // paragraph. Occlusion means a painted box covering something it
      // does not belong to; siblings in the same text flow cannot.
      const inlineish = (el) => {
        const d = getComputedStyle(el).display;
        return d === 'inline' || d === 'inline-block' || d === 'inline-flex';
      };
      if (
        A.el.parentElement &&
        A.el.parentElement === B.el.parentElement &&
        inlineish(A.el) &&
        inlineish(B.el)
      ) continue;

      const a = A.rect;
      const b = B.rect;
      const overlapW = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (overlapW < minOverlapDim || overlapH < minOverlapDim) continue;

      if (contains(a, b) || contains(b, a)) continue; // one visually contains the other

      problems.push(
        `${label(A.el)} overlaps ${label(B.el)} (${overlapW.toFixed(0)}x${overlapH.toFixed(0)}px @ [${Math.max(a.left, b.left).toFixed(0)},${Math.max(a.top, b.top).toFixed(0)}])`
      );
    }
  }

  return problems;
}

/**
 * Every content panel (a box with a full border, or a background distinct
 * from its parent's) that holds its own text with less than `minPad` of
 * padding on a side, as one line each.
 * @param {{minPad: number, minW: number, minH: number}} limits
 * @returns {string[]}
 */
export function panelPaddingViolations({ minPad, minW, minH }) {
  const problems = [];
  const all = Array.from(document.querySelectorAll('body *'));

  // Exclude by ROLE first, before any size heuristic. §13 governs content
  // panels — surfaces that hold block text. Some elements are atoms no
  // matter how large they get: a wide <code> chip, a long <button>, a
  // badge, an avatar. Judging those by size produced a steady drip of
  // false positives (#561 patched exactly one, by shape, and more kept
  // arriving), because "big" and "is a panel" are different properties.
  const ATOM_TAGS = new Set(['BUTTON', 'CODE', 'KBD', 'SAMP', 'VAR', 'A', 'LABEL', 'SUMMARY', 'OPTION', 'SELECT', 'INPUT', 'TEXTAREA']);
  const ATOM_CLASS = /(^|[\s_-])(badge|chip|pill|avatar|tag|icon|btn|button|code|label|counter|dot)([\s_-]|$)/i;
  const isAtomByRole = (el) => {
    if (ATOM_TAGS.has(el.tagName)) return true;
    if (ATOM_CLASS.test(el.className || '')) return true;
    const role = el.getAttribute('role') || '';
    if (/^(button|link|img|status|badge)$/i.test(role)) return true;
    // An inline box is by definition not a panel.
    const d = getComputedStyle(el).display;
    return d === 'inline' || d === 'inline-block' || d === 'inline-flex';
  };

  for (const el of all) {
    if (isAtomByRole(el)) continue;
    // A cell of a table its author declared `compact` is on the
    // compact padding scale on purpose -- data.css's
    // `.x-table--compact` 0.5rem is the whole point of the variant,
    // exactly as a badge's small padding is the point of a badge. The
    // size cut-off below was the stand-in for "intentionally compact",
    // and it only held while the demo tables were empty: with real rows
    // (demos/site/content.html) a compact "Name" header is 127px wide
    // and got judged as a 1rem content panel. No compact padding can
    // satisfy that (with `bordered` every compact cell has four edges),
    // so the variant itself is the exclusion. Non-compact cells are
    // still held to 1rem (#545).
    if ((el.tagName === 'TH' || el.tagName === 'TD') && el.closest('table.x-table--compact')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < minW || rect.height < minH) continue; // a UI atom, not a content panel
    // #561: the SIZE-based atom exclusion above (width/height < 120px)
    // doesn't catch x-cardportfolio__avatar-placeholder (card.js's
    // initials-fallback avatar circle) -- its default diameter is
    // exactly 7.5rem/120px, and its lg/xl/full size variants exceed
    // it, so this check treated it as a full content panel needing
    // 1rem padding. But this element centers its initials via
    // `display:flex; align-items:center; justify-content:center`, not
    // via padding -- the real gap from "JS"/"SC" to the circle's edge
    // is (diameter - content size) / 2, generous regardless of the
    // padding value the CSS declares. A circular, flex-centered
    // element is never "crowding" text the way a padding check can
    // detect, at any size, so exclude by SHAPE here as a second,
    // independent test -- the describe block's own intro comment
    // already lists "avatars" among the intentionally-excluded
    // compact atoms; this just makes that exclusion match the actual
    // centering mechanism instead of only a width/height heuristic
    // that happens to miss this element at its default size.
    const shapeCs = getComputedStyle(el);
    // Chromium's computed `border-*-radius` stays a PERCENTAGE string
    // (e.g. "50%") rather than resolving to px, even though the USED
    // value is resolved against the box -- so this must compare
    // against the declared percentage (>=50 == fully round), never
    // against rect.width/2 in px (a px comparison silently fails for
    // every avatar, since parseFloat("50%") is 50 regardless of the
    // element's actual size).
    const isFullyRound = (side) => {
      const v = shapeCs[`border${side}Radius`];
      return v.trim().endsWith('%') && parseFloat(v) >= 50;
    };
    const isCircular = isFullyRound('TopLeft') && isFullyRound('TopRight')
      && isFullyRound('BottomLeft') && isFullyRound('BottomRight');
    const isFlexCentered = shapeCs.display === 'flex'
      && shapeCs.alignItems === 'center'
      && shapeCs.justifyContent === 'center';
    if (isCircular && isFlexCentered) continue;
    // Must have direct, non-whitespace text of its own (not just via
    // nested elements) -- otherwise the padding requirement belongs to
    // whichever descendant actually renders text.
    const hasOwnText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
    );
    if (!hasOwnText) continue;

    const cs = getComputedStyle(el);
    const parent = el.parentElement ? getComputedStyle(el.parentElement) : null;
    // #447: a single-side border (e.g. a heading's border-bottom
    // underline/divider) isn't an enclosing "panel" -- it doesn't
    // crowd the text against edges the way a real bordered box does.
    // Require all four sides so a genuine panel (a card, a bordered
    // box) is still caught, but a plain underlined heading isn't
    // (confirmed live: demos/autoinject.html's "Zero-Config Form" h2
    // has only a border-bottom divider, flagged as a false positive).
    const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].every(
      (side) => parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none'
    );
    const bg = cs.backgroundColor;
    const isTransparent = bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
    const hasDistinctBg = !isTransparent && (!parent || parent.backgroundColor !== bg);
    if (!hasBorder && !hasDistinctBg) continue; // not a "panel" -- no visible edge to crowd

    const pads = [
      parseFloat(cs.paddingTop),
      parseFloat(cs.paddingRight),
      parseFloat(cs.paddingBottom),
      parseFloat(cs.paddingLeft),
    ];
    const minSide = Math.min(...pads);
    if (minSide < minPad) {
      const label = (el.textContent || '').trim().slice(0, 40);
      problems.push(
        `<${el.tagName.toLowerCase()} class="${el.className}"> "${label}" has ${minSide}px padding on its tightest side < ${minPad}px`
      );
    }
  }
  return problems;
}
