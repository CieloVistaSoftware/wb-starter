import { test, expect, Page } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * #1880: x-gallery thumbnails keep a photo shape at any column width.
 *
 * gallery.css fixed every image at 3.125rem (50px) tall, so a 3-column
 * gallery 1200px wide showed each photo as a ~390x50 strip, and sites had to
 * add their own CSS. Thumbnails are now 4:3 by default, and a site can pick
 * another shape with the --x-gallery-ratio custom property.
 */
async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'x-gallery-ratio-test-area';
    c.style.cssText = 'width: 1200px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await wbIdle(page);
}

const PHOTOS = [1, 2, 3].map((n) =>
  `<figure><img src="https://picsum.photos/1280/720?r=${n}" alt="photo ${n}"><figcaption>Photo ${n}</figcaption></figure>`).join('');

async function firstTile(page: Page, id: string): Promise<{ width: number; height: number }> {
  return page.locator(`#${id} img`).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height };
  });
}

test.describe('x-gallery thumbnails keep a photo shape (#1880)', () => {
  test('a 3-column gallery shows 4:3 tiles, not 50px strips', async ({ page }) => {
    await setup(page, `<div id="gr1" x-gallery columns="3">${PHOTOS}</div>`);
    const { width, height } = await firstTile(page, 'gr1');
    expect(width).toBeGreaterThan(300);
    expect(height).toBeGreaterThan(200);
    expect(width / height).toBeCloseTo(4 / 3, 1);
  });

  test('--x-gallery-ratio picks another shape', async ({ page }) => {
    await setup(page, `<div id="gr2" x-gallery columns="3" style="--x-gallery-ratio: 1 / 1">${PHOTOS}</div>`);
    const { width, height } = await firstTile(page, 'gr2');
    expect(width / height).toBeCloseTo(1, 1);
  });

  test('a figure inside the gallery has no default margin', async ({ page }) => {
    await setup(page, `<div id="gr3" x-gallery columns="3">${PHOTOS}</div>`);
    const margin = await page.locator('#gr3 figure').first().evaluate((el) => getComputedStyle(el).marginLeft);
    expect(margin).toBe('0px');
  });
});
