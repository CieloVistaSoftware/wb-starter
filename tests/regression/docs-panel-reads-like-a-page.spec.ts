import { test, expect } from '../fixtures/offline';

/**
 * The Docs panel reads like a page, not like hero copy, and covers what is
 * under it.
 *
 * John, 2026-10-15, on Behaviors -> card -> Docs: "Why is this format failing
 * again we already know about this." Measured on the Card doc at 1786px wide:
 *   - every paragraph was 600px wide and auto-centred (x=799) while its
 *     headings and examples started at x=461. The panel sits in
 *     #behaviors-hero.page__hero, and site.css's `.page__hero p` caps and
 *     centres hero copy; #690 reset that for the stage only, not the Docs panel.
 *   - the live pane's own "HTML" / "JavaScript" code-panel labels painted
 *     through the opaque Docs panel at its right edge: the panel sat at
 *     z-index 5, the labels at 9-11 in the same stacking context.
 */
test.use({ viewport: { width: 1786, height: 967 } });

test('Docs: paragraphs start with their headings, and nothing under the panel shows through', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await expect(page.locator('.behaviors-live__body')).toBeVisible({ timeout: 15000 });
  await page.locator('#behaviors-live-doc > summary').click();
  const body = page.locator('#behaviors-live-doc-body');
  await expect(body.locator('h2').first()).toBeVisible({ timeout: 15000 });

  const m = await page.evaluate(() => {
    const doc = document.querySelector('#behaviors-live-doc-body')!;
    const h = doc.querySelector('h1, h2')!.getBoundingClientRect();
    // Prose only: the doc's own paragraphs, not ones an example renders.
    const ps = [...doc.querySelectorAll(':scope > p, :scope > * > p')]
      .filter((p) => !p.closest('.x-demo, [x-demo]'))
      .map((p) => { const r = p.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width) }; });
    const panel = doc.getBoundingClientRect();
    // Every code-panel label under the panel: what is painted at its centre?
    const leaks = [...document.querySelectorAll('.x-pre__language')]
      .filter((l) => !doc.contains(l))
      .map((l) => { const r = l.getBoundingClientRect(); return { l, x: r.x + r.width / 2, y: r.y + r.height / 2 }; })
      .filter((s) => s.x > panel.left && s.x < panel.right && s.y > panel.top && s.y < panel.bottom)
      .filter((s) => { const top = document.elementFromPoint(s.x, s.y); return top && !doc.contains(top); })
      .map((s) => s.l.textContent);
    return { hx: Math.round(h.x), ps, leaks };
  });

  expect(m.ps.length, 'the doc has paragraphs to measure').toBeGreaterThan(0);
  for (const p of m.ps) {
    expect(Math.abs(p.x - m.hx), `a paragraph starts at x=${p.x}, its heading at x=${m.hx}`).toBeLessThanOrEqual(2);
  }
  expect(m.leaks, 'code-panel labels from under the Docs panel paint through it').toEqual([]);
});
