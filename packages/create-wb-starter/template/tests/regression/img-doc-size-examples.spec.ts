/**
 * THE IMG DOC'S "CONTROLLING SIZE" EXAMPLES DO WHAT THEY SAY
 * ==========================================================
 * John, 2026-09-28, on docs/behaviors/img.md: "What options does user have to
 * control the img size?" The answer is HTML's own width/height and the
 * aspect-ratio attribute, not a size enum -- so the doc shows each, and this
 * holds the doc to its claims: 240px wide, fills its container, square.
 */
import { test, expect } from '../fixtures/offline';

test('img.md size examples: fixed 240px, fills its container, square crop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/img.md'));
  const imgs = page.locator('[x-demo] img[alt^="Dachshund puppy"]');
  await expect(imgs).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await imgs.nth(i).scrollIntoViewIfNeeded();
    await expect.poll(() => imgs.nth(i).evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  const box = (i: number) => imgs.nth(i).evaluate((el) => {
    const r = el.getBoundingClientRect();
    const host = el.parentElement!.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), hostW: Math.round(host.width) };
  });

  const fixed = await box(0);
  expect(fixed.w, 'width="240" renders 240px wide').toBe(240);
  expect(fixed.h, 'height follows the 16:9 shape').toBe(135);

  const fill = await box(1);
  expect(fill.w, `a 960px image fills its narrower container (${fill.hostW}px)`).toBeLessThanOrEqual(fill.hostW);
  expect(fill.w, 'and actually fills it').toBeGreaterThanOrEqual(fill.hostW - 2);
  expect(Math.abs(fill.w / fill.h - 16 / 9), 'keeping its proportions').toBeLessThan(0.02);

  const square = await box(2);
  expect(square.w).toBe(200);
  expect(square.h, 'aspect-ratio="1/1" crops it square').toBe(200);
});
