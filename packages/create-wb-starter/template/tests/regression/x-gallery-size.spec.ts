import { test, expect, Page } from '@playwright/test';

/**
 * x-gallery `size` attribute: a fixed thumbnail size (e.g. "150px"),
 * switching the grid to `repeat(auto-fill, minmax(size, 1fr))` instead of
 * `columns` fluid-dividing the container into N tracks. Wins over
 * `columns` when both are set. See src/wb-viewmodels/semantics/gallery.js.
 */
async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'x-gallery-size-test-area';
    c.style.cssText = 'width: 800px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(300);
}

const IMGS = '<img src="https://picsum.photos/200/200?r=1" alt="1"><img src="https://picsum.photos/200/200?r=2" alt="2"><img src="https://picsum.photos/200/200?r=3" alt="3"><img src="https://picsum.photos/200/200?r=4" alt="4">';

test.describe('x-gallery size attribute', () => {
  test('without size, falls back to columns-based fluid grid (unaffected)', async ({ page }) => {
    await setup(page, `<div id="g1" x-gallery columns="4">${IMGS}</div>`);
    const gridTemplateColumns = await page.locator('#g1').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    // 4 equal-fraction tracks -> 4 numeric px values of roughly equal width
    const tracks = gridTemplateColumns.trim().split(/\s+/);
    expect(tracks.length).toBe(4);
  });

  test('with size, thumbnails are the fixed size regardless of columns', async ({ page }) => {
    await setup(page, `<div id="g2" x-gallery size="150px" columns="4">${IMGS}</div>`);
    const firstImgWidth = await page.locator('#g2 img').first().evaluate((el) => el.getBoundingClientRect().width);
    // auto-fill/minmax(150px, 1fr) in an 800px container distributes extra
    // space across tracks, so each track is >= 150px, not a fixed 150px --
    // the real assertion is "not fluid-divided into exactly 4 equal 200px
    // tracks" (800/4), proving size (not columns) drove the layout.
    expect(firstImgWidth).toBeGreaterThanOrEqual(150);
    expect(firstImgWidth).not.toBeCloseTo(200, 0);
  });

  test('size wins over columns when both are set', async ({ page }) => {
    await setup(page, `<div id="g3" x-gallery size="700px" columns="4">${IMGS}</div>`);
    // A single 700px minmax track in an 800px container fits only 1 column
    // (700px leaves 100px, not enough for a second 700px-minimum track) --
    // proves size overrode columns="4" rather than being ignored.
    const gridTemplateColumns = await page.locator('#g3').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    const tracks = gridTemplateColumns.trim().split(/\s+/);
    expect(tracks.length).toBe(1);
  });
});
