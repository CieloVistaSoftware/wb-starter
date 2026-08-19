import { test, expect } from '@playwright/test';
import { globSync } from 'glob';

/**
 * Standard §22 (new) — GitHub #274: "Elements must never visually overlap
 * unless intentionally layered." Scope matches demo-layout-standards.spec.ts's
 * own convention: every file under demos/**\/*.html and pages/**\/*.html.
 *
 * Originally spotted on pages/behaviors.html: the hero subtitle rendered
 * under/through the category-pills box. A first attempt at this test
 * (issue #274 comment, 2026-07-10) used a naive AABB (bounding-box)
 * intersection check across every element and found it produced false
 * positives that couldn't be allow-listed away cleanly, e.g.:
 *   - a page-container div "overlapping" the footer purely because its
 *     geometric box (sized for a flex-grow footer-push layout) extends into
 *     that region even though nothing is actually drawn there;
 *   - a resize-handle that's *supposed* to sit exactly on a boundary.
 * Both of those false positives came from treating every DOM node as a
 * paint candidate, when most nodes are pure layout wrappers that render
 * nothing of their own. This version fixes that by only comparing elements
 * that actually PAINT something visible of their own (background, border,
 * shadow, replaced media, or their own direct text) — a pure wrapper <div>
 * with no background/border/text can never visually occlude anything, so it
 * is excluded from the candidate set entirely (not just tolerated via a
 * bigger allow-list). Text-only elements (no background/border/shadow) use
 * the tight bounding box of their own actual text runs (via Range), not
 * their full block box, so a wide paragraph whose text only fills part of
 * its line doesn't "overlap" something sitting in the empty part of that
 * line.
 *
 * Intentional-layering exclusions:
 *   - position: fixed / position: sticky (headers, toasts, drawers, notes,
 *     mobile nav, backdrops — grep of src/styles confirms these are the
 *     only positioning scheme real overlays in this codebase use for
 *     document.body-appended overlays).
 *   - Known overlay/decoration classes (grepped from src/wb-viewmodels/
 *     tooltip.js, overlay.js and src/styles/behaviors/{dropdown,modal,
 *     popover,toast,dialog,drawer}.css, plus wb-signature.css's glass
 *     variants) — these are position:absolute (not fixed), so the
 *     position check alone wouldn't catch them.
 *   - The `data-allow-overlap` escape hatch (on either element in the
 *     pair) for any other deliberate, verified-by-eye overlap (e.g. a
 *     decorative badge) that isn't already covered above.
 *   - DOM ancestor/descendant pairs — a parent can never meaningfully
 *     "collide" with its own content, however that content is positioned.
 */

const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd() }),
  ...globSync('pages/**/*.html', { cwd: process.cwd() }),
].sort();

// Minimum overlap width AND height (px) to count as a real visual collision,
// not sub-pixel rounding noise at a shared/adjacent edge (e.g. collapsed
// table borders, hairline flex-item seams).
const MIN_OVERLAP_DIM = 3;

test.describe('No element overlap (§22) — project-wide detection', () => {
  for (const file of FILES) {
    test(`${file}: no unintentional element overlap`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      // networkidle (not domcontentloaded) -- under concurrent-worker load
      // (many tests hitting the shared dev server at once), slow image
      // fetches finish AFTER the fixed settle timeout below, so an overlay
      // positioned against an image (e.g. wb-card__overlay on a still-
      // loading card image) gets measured mid-layout-shift. Confirmed via
      // repeated runs: flaked only under full-suite concurrency, passed
      // every time in isolation -- a load-timing race, not a real defect.
      await page.goto(urlPath, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800); // settle lazy/eager scan + layout

      const violations = await page.evaluate((minOverlapDim) => {
        const problems: string[] = [];

        // Known overlay/decoration classes that render via position:absolute
        // (not fixed/sticky), so the position check alone won't exclude
        // them. Grepped from src/wb-viewmodels/tooltip.js, overlay.js and
        // src/styles/behaviors/{dropdown,modal,popover,toast,dialog,
        // drawer}.css + wb-signature.css.
        //
        // #540: wb-card__overlay (src/styles/behaviors/hero.css,
        // wb-cardhero's "legibility scrim") wasn't in this list even though
        // it's the exact same pattern -- a position:absolute, z-index:0
        // decorative layer that ALWAYS renders behind its sibling
        // .wb-card__hero-content (z-index:1, set two rules below it in
        // hero.css). Confirmed live on demos/charity-food.html: the scrim's
        // full-card box geometrically overlaps the hero title/subtitle
        // bounding boxes, but the text renders cleanly on top per the
        // z-index stacking -- not a visual defect, just a gap in this
        // list's original grep (which covered tooltip/popover/modal/dialog/
        // toast/drawer but never card.css/hero.css's own scrim).
        //
        // #540: wb-demo__card-doc-link (src/styles/behaviors/demo.css #388,
        // src/wb-viewmodels/demo.js's attachCardDocLink) is demo.js's own
        // per-card "📖" docs badge, attached to the top-right corner of
        // EVERY wb-card* element inside a <wb-demo> grid site-wide --
        // demo.css's own comment calls it out explicitly: "Sits at the
        // card's own top-right corner, slightly overlapping the border, so
        // it's clearly a separate 'meta/docs' affordance." Confirmed live
        // on demos/site/cards.html: dozens of these badges geometrically
        // overlap their card's header/image by design (position:absolute,
        // top:-0.5rem, right:-0.5rem, z-index:5) -- this single class
        // explains the bulk of this codebase's demo-page failures under
        // §22, since nearly every demos/**/*.html and pages/**/*.html file
        // renders at least one <wb-demo> grid of wb-card* examples.
        const OVERLAY_CLASS_RE = new RegExp(
          [
            'wb-tooltip', 'wb-tooltip__arrow', 'wb-tooltip__content', 'wb-tooltip-glass',
            'wb-popover', 'wb-popover-trigger',
            'wb-dropdown-menu',
            'wb-modal', 'wb-modal-content', 'wb-modal-glass-overlay', 'wb-modal-glass-content',
            'wb-dialog', 'wb-dialog-trigger',
            'wb-toast', 'wb-toast-container',
            'wb-lightbox',
            'wb-drawer__panel', 'wb-drawer__backdrop',
            'wb-offcanvas',
            'wb-sheet',
            'wb-notes__backdrop', 'wb-notes__drawer',
            'site__nav-backdrop',
            'wb-demo__card-doc-link',
            // #556: the native <input> that drives a <wb-switch>'s :checked
            // state (switch.css's own comment: "visually-hidden native
            // checkbox (state driver)") -- position:absolute, opacity:0,
            // deliberately sized/positioned to sit exactly under the visible
            // .wb-switch__thumb/.wb-switch__track it controls, same
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
            'wb-switch__input',
            // #556: wb-stagelight's "beam" variant (stagelight.js) is a
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
            'wb-stagelight__beam',
          ].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
          // wb-card__overlay needs an exact-token match (word-boundary
          // anchored to whitespace/string edges), not a plain substring
          // like every entry above -- unanchored, it would ALSO swallow
          // the unrelated wb-card__overlay-content/-title/-subtitle classes
          // from cardoverlay() (card.js's separate image-caption component,
          // src/wb-viewmodels/card.js ~L2130-2168), whose text is real
          // visible content sitting on an image, not a decorative layer
          // behind other content -- those must stay checked.
          + '|(?:^|\\s)wb-card__overlay(?:\\s|$)'
        );

        function isVisible(el: HTMLElement, cs: CSSStyleDeclaration): boolean {
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
        // own #wb-error-display error-log viewer, src/core/error-log*.js)
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
        function hasFixedOrStickyAncestor(el: HTMLElement): boolean {
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
        function hasMultiColumnAncestor(el: HTMLElement): boolean {
          let node: HTMLElement | null = el;
          while (node) {
            const ncs = getComputedStyle(node);
            if (ncs.columnCount !== 'auto' || (ncs.columnWidth !== 'auto' && ncs.columnWidth !== '0px')) return true;
            node = node.parentElement;
          }
          return false;
        }

        function isLayeringException(el: HTMLElement, cs: CSSStyleDeclaration): boolean {
          if (cs.position === 'fixed' || cs.position === 'sticky') return true;
          if (hasFixedOrStickyAncestor(el)) return true;
          if (OVERLAY_CLASS_RE.test(el.className || '')) return true;
          if (el.hasAttribute('data-allow-overlap')) return true;
          if (el.closest('[data-allow-overlap]')) return true;
          if (hasMultiColumnAncestor(el)) return true;
          return false;
        }

        type Paint = { hasBg: boolean; hasBorder: boolean; hasShadow: boolean; isReplaced: boolean; hasOwnText: boolean };

        function getPaint(el: HTMLElement, cs: CSSStyleDeclaration): Paint {
          const bg = cs.backgroundColor;
          const hasBg = !!bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)';
          const hasBgImage = !!cs.backgroundImage && cs.backgroundImage !== 'none';
          const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some(
            (side) => parseFloat((cs as any)[`border${side}Width`]) > 0 && (cs as any)[`border${side}Style`] !== 'none'
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
        function getPaintRect(el: HTMLElement, paint: Paint): DOMRect {
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

        type Rect = { left: number; right: number; top: number; bottom: number; width: number; height: number };

        // Clip a rect against every `overflow: hidden`/`clip`/`auto`/`scroll`
        // ancestor.
        // Found live on pages/home.html: <wb-demo> starts as a collapsed
        // `height: 32px; overflow: hidden` skeleton until its lazy-build
        // (IntersectionObserver-driven grid construction) runs; the demo's
        // real content -- a <wb-cardhero> -- is already fully laid out
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
        function getClippedRect(el: HTMLElement, rect: DOMRect | Rect): Rect | null {
          let r: Rect = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: 0, height: 0 };
          let node = el.parentElement;
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

        const all = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
        const SKIP_TAGS = new Set(['script', 'style', 'link', 'meta', 'template', 'noscript', 'br', 'wbr', 'option']);

        const candidates: { el: HTMLElement; rect: Rect }[] = [];
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

        function contains(a: Rect, b: Rect): boolean {
          return a.left <= b.left + 0.5 && a.top <= b.top + 0.5 && a.right >= b.right - 0.5 && a.bottom >= b.bottom - 0.5;
        }

        function label(el: HTMLElement): string {
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
      }, MIN_OVERLAP_DIM);

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});
