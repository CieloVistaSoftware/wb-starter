import { test, expect } from '@playwright/test';

/**
 * docs/behaviors/*.md documents `x-progressbar` ("attribute-based progress
 * bar -- apply directly to any element, no custom tag required") with
 * examples like `<div x-progressbar value="40">` and `<div x-progressbar
 * value="80" variant="success">` -- but neither `x-progressbar` nor
 * `x-progress` was ever registered in tag-map.js's extensionMap OR
 * wb-lazy.js's own attribute table. Every documented example was a fully
 * inert div: no class, no fill, no percent text.
 */
const HARNESS = '/demos/test-harness.html';

async function inject(page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(async (h: string) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container, { eager: true });
  }, html);
}

test('x-progressbar on a plain div actually renders a fill matching its value/variant', async ({ page }) => {
  await inject(page, `
    <div id="p1" x-progressbar value="40" style="width:300px;height:24px;"></div>
    <div id="p2" x-progressbar value="80" variant="success" style="width:300px;height:24px;"></div>
  `);
  const p1Bar = page.locator('#p1 .x-progress__bar');
  const p2Bar = page.locator('#p2 .x-progress__bar');
  await expect(p1Bar).toBeVisible();
  await expect(p2Bar).toBeVisible();

  const p1Width = await p1Bar.evaluate((el) => el.style.width);
  const p2Width = await p2Bar.evaluate((el) => el.style.width);
  expect(p1Width).toBe('40%');
  expect(p2Width).toBe('80%');

  const p2Bg = await p2Bar.evaluate((el) => getComputedStyle(el).backgroundColor);
  const p1Bg = await p1Bar.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(p2Bg, 'variant="success" should differ from default color').not.toBe(p1Bg);
});
