import { test, expect } from '@playwright/test';

/**
 * x-progress applies the progress behavior to any host that is not a
 * <progress>. It was once documented but registered nowhere, so every
 * example was an inert div: no class, no fill, no percent text.
 *
 * It also had a second spelling, x-progressbar, routed to the same behavior.
 * That alias is gone -- one behavior, one name, as x-article -> x-card -- and
 * the last test here keeps it from coming back.
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

test('x-progress on a plain div actually renders a fill matching its value/variant', async ({ page }) => {
  await inject(page, `
    <div id="p1" x-progress value="40" style="width:300px;height:24px;"></div>
    <div id="p2" x-progress value="80" variant="success" style="width:300px;height:24px;"></div>
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

test('x-progressbar is not a second name for progress', async ({ page }) => {
  await page.goto(HARNESS);
  const map = await page.evaluate(async () => {
    const m = await import('/src/core/tag-map.js');
    return { alias: m.extensionMap['x-progressbar'] ?? null, main: m.extensionMap['x-progress'] ?? null };
  });
  expect(map.main, 'x-progress must stay registered').toBe('progress');
  expect(map.alias, 'x-progressbar is back: one behavior, one name -- write x-progress').toBeNull();
});
