/**
 * #693 — DEMOS-AND-DOCS-STANDARDS.md §13 for the behaviors page's LIVE examples.
 *
 * demo-layout-standards.spec.ts enforces §13 by parsing `<div x-demo>` blocks out
 * of demos/**\/*.html and pages/**\/*.html. Since #664 the behaviors page does
 * not author its examples — all 585 are built from the x-* registry at runtime
 * and rendered into #behaviors-live-stage when a row is picked. There is no
 * <div x-demo> block for that sweep to find, so none of them were ever checked.
 * That is how the `details` example shipped with its content flush against the
 * border (#689).
 *
 * Scope: container-like examples only — an example root that has element
 * children AND a visible border or background. A bare <button>, chip or badge
 * has no element children and is deliberately out of scope; that carve-out is
 * what #685 is still arguing about and this test must not re-litigate it.
 *
 * Rule: no text may render within 1rem of the example root's own edge. Same
 * measure as demo-layout-standards.spec.ts's MIN_TEXT_EDGE_PX, applied to the
 * rendered result instead of the authored markup.
 */
import { test, expect, Page } from '@playwright/test';

const MIN_TEXT_EDGE_PX = 15;   // 1rem at the default root size, minus rounding slack
const SLICES = 6;              // split the 585 rows so no single test runs long

type Violation = { token: string; variant: string; tag: string; worstPx: number };

async function openBrowseList(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'x-');
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    { timeout: 30000 },
  );
}

/**
 * Measures one row's rendered example. Returns null when the example is not
 * container-like (out of scope) or rendered nothing.
 */
async function measureRow(page: Page, index: number): Promise<Violation | null> {
  return page.evaluate(async (i: number) => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
    const row = rows[i];
    if (!row) return null;

    row.click();
    await sleep(40);

    const stage = document.getElementById('behaviors-live-stage');
    const root = stage?.firstElementChild as HTMLElement | undefined;
    if (!root) return null;

    // Out of scope: bare controls with no element children, and anything with
    // no surface of its own to pad against.
    if (root.children.length === 0) return null;
    const cs = getComputedStyle(root);
    const hasSurface = parseFloat(cs.borderTopWidth) > 0
      || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
    if (!hasSurface) return null;

    const rb = root.getBoundingClientRect();
    if (rb.width === 0 || rb.height === 0) return null;

    let worst = Number.POSITIVE_INFINITY;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const t of Array.from(range.getClientRects())) {
        if (t.width <= 0 || t.height <= 0) continue;
        worst = Math.min(worst, t.left - rb.left, rb.right - t.right, t.top - rb.top, rb.bottom - t.bottom);
      }
    }
    if (!Number.isFinite(worst)) return null;   // container renders no text

    return {
      token: row.getAttribute('data-browse-token') || '?',
      variant: row.getAttribute('data-variant') || '',
      tag: root.tagName.toLowerCase(),
      worstPx: Math.round(worst),
    };
  }, index);
}

for (let slice = 0; slice < SLICES; slice++) {
  test(`§13: live examples ${slice + 1}/${SLICES} keep text 1rem clear of their own edge`, async ({ page }) => {
    test.setTimeout(180_000);
    await openBrowseList(page);

    const total = await page.evaluate(
      () => document.querySelectorAll('.behaviors-search-results__row').length,
    );
    const per = Math.ceil(total / SLICES);
    const start = slice * per;
    const end = Math.min(start + per, total);

    const violations: Violation[] = [];
    for (let i = start; i < end; i++) {
      const result = await measureRow(page, i);
      if (result && result.worstPx < MIN_TEXT_EDGE_PX) violations.push(result);

      // Some behaviors open a dialog, drawer or overlay when they render.
      // Escape clears them so the next row is measured against its own output.
      await page.keyboard.press('Escape').catch(() => {});

      // Toasts, confetti and stagelight overlays accumulate; start clean
      // periodically rather than measuring through someone else's leftovers.
      if ((i - start) > 0 && (i - start) % 60 === 0) await openBrowseList(page);
    }

    const report = violations
      .map((v) => `  ${v.token}${v.variant ? ` (${v.variant})` : ''} — <${v.tag}> text ${v.worstPx}px from its edge`)
      .join('\n');

    expect(
      violations,
      violations.length
        ? `§13 requires >=1rem between an example container's edge and its text.\n${report}`
        : '',
    ).toHaveLength(0);
  });
}
