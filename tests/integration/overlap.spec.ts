import { test, expect, type Page } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

/**
 * Standard §24 (#274): elements must never unintentionally overlap. Reported
 * originally on /?page=behaviors (hero subtitle rendering under the category
 * pills) — that specific case no longer reproduces (see issue comment), but
 * the request is a durable project-wide gate, not a one-off repro test.
 *
 * DETECTION METHODOLOGY
 * ----------------------
 * A prior pass on this issue tried the naive version — flag any two visible
 * elements whose `getBoundingClientRect()` intersects — and found it has an
 * unworkable false-positive rate:
 *   1. Layout CONTAINERS geometrically overlap things they never paint over.
 *      e.g. the page's flex-grow wrapper has `min-height` to push the footer
 *      down; its bounding box extends into the footer's screen region even
 *      though the wrapper itself renders nothing there. A geometry-only check
 *      can't distinguish "empty box" from "actually occluded content".
 *   2. INTENTIONAL overlap is everywhere by design: the nav resize handle
 *      sits exactly on the nav's boundary; badges pin to card corners;
 *      tooltips/popovers/dropdowns float over other content; decorative
 *      absolutely-positioned layers (glass-card shimmer, backdrops) are
 *      meant to sit on top of something.
 *
 * This version narrows the check on two axes instead of reaching for real
 * pixel/occlusion detection:
 *
 *   a) CANDIDATE SCOPE — only elements that (i) render their own visible
 *      content directly (a non-whitespace text node child, or a replaced/
 *      form element: img/svg/canvas/video/picture/iframe/input/button/
 *      select/textarea) and (ii) sit in normal document flow (computed
 *      `position` is `static` or `relative`). This throws out both known
 *      false-positive classes for free: layout containers rarely have their
 *      OWN direct text (their children do), and virtually everything used
 *      for intentional overlap (badges, tooltips, popovers, dropdowns, the
 *      nav resizer) is `position: absolute` / `fixed` / `sticky` to achieve
 *      that overlap in the first place.
 *   b) BELT-AND-SUSPENDERS EXCLUSIONS — on top of (a), still skip elements
 *      that are `aria-hidden`, `pointer-events: none`, zero-opacity, or
 *      whose class/id matches a recognizable decorative-role pattern
 *      (badge, tooltip, popover, dropdown, resizer, shimmer, glass,
 *      backdrop, skeleton, spinner, ripple, indicator, handle, caret,
 *      chevron, ribbon, toast, corner) — covers a legitimate normal-flow
 *      component that still plays a decorative/overlay role.
 *
 * Geometry itself uses `getClientRects()` (per-line boxes), not
 * `getBoundingClientRect()` — a wrapped multi-line inline element's overall
 * bounding box can span the full container width and falsely "collide" with
 * a sibling that sits beside an earlier line but not the wrapped one.
 * Per-line rects avoid that.
 *
 * A pair is only flagged when the intersection area is at least 25% of the
 * SMALLER rect's area AND at least 5x5px — filters out 1px anti-aliasing/
 * border-adjacency touches that aren't a real visual collision.
 *
 * Ancestor/descendant pairs are always skipped (nesting isn't overlap).
 *
 * Each rect is CLIPPED to every ancestor that clips its content (overflow
 * other than visible) before comparing: content scrolled out of a scroll
 * container is not painted, so it cannot overlap what is (#274 -- the SPA
 * scrolls pages inside .site__body above the footer).
 */

type OverlapHit = {
  a: string;
  b: string;
  aText: string;
  bText: string;
  ratio: number;
  area: number;
};

// Every page the site serves, read from disk so a new page is covered the day
// it is added (#274 asked for a project-wide gate; the hand-written list had
// drifted to one SPA page -- listed twice -- and nine demos). SPA pages load
// through the site shell, the way a visitor reaches them.
const htmlIn = (dir: string) => fs.readdirSync(path.join(process.cwd(), dir))
  .filter((f) => f.endsWith('.html')).sort().map((f) => f.slice(0, -5));
const TARGET_PAGES: { name: string; url: string }[] = [
  ...htmlIn('pages').map((p) => ({ name: `pages/${p}`, url: `/?page=${p}` })),
  ...htmlIn('demos/site').map((p) => ({ name: `demos/site/${p}`, url: `/demos/site/${p}.html` })),
  ...htmlIn('demos').map((p) => ({ name: `demos/${p}`, url: `/demos/${p}.html` })),
];

async function detectOverlaps(page: Page): Promise<OverlapHit[]> {
  return page.evaluate(() => {
    const DECORATIVE_RE =
      /badge|tooltip|popover|dropdown|resizer|resize|shimmer|glass|backdrop|skeleton|spinner|ripple|indicator|handle|caret|chevron|ribbon|toast|corner|drawer|modal/i;

    const REPLACED_TAGS = new Set([
      'IMG', 'SVG', 'CANVAS', 'VIDEO', 'PICTURE', 'IFRAME',
      'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA',
    ]);

    function hasOwnVisibleContent(el: Element): boolean {
      if (REPLACED_TAGS.has(el.tagName)) return true;
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim().length > 0) {
          return true;
        }
      }
      return false;
    }

    function isDecorative(el: Element): boolean {
      let cur: Element | null = el;
      while (cur && cur !== document.body) {
        if (DECORATIVE_RE.test(cur.className?.toString?.() || '') || DECORATIVE_RE.test(cur.id || '')) {
          return true;
        }
        if (cur.getAttribute('aria-hidden') === 'true') return true;
        cur = cur.parentElement;
      }
      return false;
    }

    function shortSelector(el: Element): string {
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    }

    /** The box an element is visible within: every ancestor that clips its content. */
    function clipBoxFor(el: Element): DOMRect | null {
      let box: DOMRect | null = null;
      for (let cur = el.parentElement; cur && cur !== document.documentElement; cur = cur.parentElement) {
        const cs = getComputedStyle(cur);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const r = cur.getBoundingClientRect();
        box = box ? clipTo(box, r) : r;
        if (!box) return new DOMRect(0, 0, 0, 0);
      }
      return box;
    }

    function clipTo(r: DOMRect, c: DOMRect): DOMRect | null {
      const left = Math.max(r.left, c.left);
      const top = Math.max(r.top, c.top);
      const right = Math.min(r.right, c.right);
      const bottom = Math.min(r.bottom, c.bottom);
      return right > left && bottom > top ? new DOMRect(left, top, right - left, bottom - top) : null;
    }

    const all = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
    const candidates: { el: HTMLElement; rects: DOMRect[] }[] = [];

    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) continue;
      if (cs.pointerEvents === 'none') continue;
      // The body of a CLOSED <details> is never painted (its ::details-content
      // slot is content-visibility: hidden), yet getClientRects() still forces
      // layout for it and returns real boxes -- which "overlapped" the code
      // sample under every collapsed details demo. checkVisibility() is the
      // browser's own answer to "is this rendered at all?".
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) continue;
      if (cs.position !== 'static' && cs.position !== 'relative') continue;
      if (!hasOwnVisibleContent(el)) continue;
      if (isDecorative(el)) continue;

      // Only the PAINTED part of each box counts. The site scrolls its page
      // content inside .site__body (overflow:auto) above the footer, so text
      // scrolled below that container's bottom edge has a rect "under" the
      // footer while being clipped away -- the footer is what is actually on
      // screen there. Unclipped rects reported the footer overlapping 7 pages.
      const clip = clipBoxFor(el);
      const rects = Array.from(el.getClientRects())
        .map((r) => (clip ? clipTo(r, clip) : r))
        .filter((r): r is DOMRect => !!r && r.width > 0 && r.height > 0);
      if (rects.length === 0) continue;

      candidates.push({ el, rects });
    }

    function intersectArea(a: DOMRect, b: DOMRect): number {
      const left = Math.max(a.left, b.left);
      const right = Math.min(a.right, b.right);
      const top = Math.max(a.top, b.top);
      const bottom = Math.min(a.bottom, b.bottom);
      const w = right - left;
      const h = bottom - top;
      if (w <= 5 || h <= 5) return 0;
      return w * h;
    }

    const hits: OverlapHit[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const A = candidates[i];
        const B = candidates[j];
        if (A.el === B.el) continue;
        if (A.el.contains(B.el) || B.el.contains(A.el)) continue;

        let bestRatio = 0;
        let bestArea = 0;
        for (const ra of A.rects) {
          for (const rb of B.rects) {
            const area = intersectArea(ra, rb);
            if (area <= 0) continue;
            const smaller = Math.min(ra.width * ra.height, rb.width * rb.height);
            const ratio = smaller > 0 ? area / smaller : 0;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestArea = area;
            }
          }
        }

        if (bestRatio >= 0.25) {
          const key = shortSelector(A.el) + '|' + shortSelector(B.el);
          if (seen.has(key)) continue;
          seen.add(key);
          hits.push({
            a: shortSelector(A.el),
            b: shortSelector(B.el),
            aText: (A.el.textContent || '').trim().slice(0, 40),
            bText: (B.el.textContent || '').trim().slice(0, 40),
            ratio: Math.round(bestRatio * 100) / 100,
            area: Math.round(bestArea),
          });
        }
      }
    }

    return hits;
  });
}

function formatReport(pageName: string, hits: OverlapHit[]): string {
  if (hits.length === 0) return '';
  const lines = hits.map(
    (h) =>
      `  ${h.a} ("${h.aText}") overlaps ${h.b} ("${h.bText}") — ${Math.round(h.ratio * 100)}% of smaller rect, ${h.area}px^2`
  );
  return `Unintended overlap on ${pageName}:\n${lines.join('\n')}`;
}

test('the detector catches a real overlap and ignores content clipped out of view (#274)', async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'load' });
  await page.setContent(`
    <div style="font: 16px/20px sans-serif; width: 400px">
      <p id="first">First line of real text</p>
      <p id="second" style="position: relative; margin-top: -30px">Second line drawn on the first</p>
    </div>
    <div style="height: 60px; overflow: auto; width: 400px">
      <p style="margin: 0 0 40px; font: 16px/20px sans-serif">Inside a scroller</p>
      <p id="scrolled-away" style="margin: 0; font: 16px/20px sans-serif">Scrolled out of view</p>
    </div>
    <p id="below" style="margin: 0; font: 16px/20px sans-serif; width: 400px">Text directly below the scroller</p>
  `);
  const hits = await detectOverlaps(page);
  const pairs = hits.map((h) => `${h.a} / ${h.b}`).join('\n');
  expect(pairs, 'a real overlap must be reported').toMatch(/#first[^\n]*#second|#second[^\n]*#first/);
  expect(pairs, 'content clipped by its scroller is not painted, so it overlaps nothing').not.toMatch(/scrolled-away/);
});

for (const target of TARGET_PAGES) {
  test(`no unintended element overlap on ${target.name} (#274, §24)`, async ({ page }) => {
    await page.goto(target.url, { waitUntil: 'networkidle' });
    if (target.url.startsWith('/?page=')) {
      await page.waitForFunction(() => !!(window as any).WB, { timeout: 20000 });
    }

    const hits = await detectOverlaps(page);
    expect(hits, formatReport(target.name, hits)).toEqual([]);
  });
}
