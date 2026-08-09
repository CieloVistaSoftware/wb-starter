import { test, expect, type Page } from '@playwright/test';

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
 */

type OverlapHit = {
  a: string;
  b: string;
  aText: string;
  bText: string;
  ratio: number;
  area: number;
};

const TARGET_PAGES: { name: string; url: string }[] = [
  { name: 'pages/behaviors', url: '/?page=behaviors' },
  { name: 'pages/components', url: '/?page=components' },
  { name: 'demos/site/cards', url: '/demos/site/cards.html' },
  { name: 'demos/site/content', url: '/demos/site/content.html' },
  { name: 'demos/site/effects', url: '/demos/site/effects.html' },
  { name: 'demos/site/feedback', url: '/demos/site/feedback.html' },
  { name: 'demos/site/forms', url: '/demos/site/forms.html' },
  { name: 'demos/site/index', url: '/demos/site/index.html' },
  { name: 'demos/site/interactive', url: '/demos/site/interactive.html' },
  { name: 'demos/site/layout', url: '/demos/site/layout.html' },
  { name: 'demos/site/overlays', url: '/demos/site/overlays.html' },
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

    const all = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
    const candidates: { el: HTMLElement; rects: DOMRect[] }[] = [];

    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) continue;
      if (cs.pointerEvents === 'none') continue;
      if (cs.position !== 'static' && cs.position !== 'relative') continue;
      if (!hasOwnVisibleContent(el)) continue;
      if (isDecorative(el)) continue;

      const rects = Array.from(el.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
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
