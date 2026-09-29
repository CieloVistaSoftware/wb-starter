/**
 * x-cardimage: every position shows its image, and every fit looks different.
 *
 * position="left|right" are in cardimage.schema.json's enum, but cardimage()
 * only built a figure for top and bottom -- the side positions rendered a
 * card with no image at all. And the example's placeholder.svg paints with
 * preserveAspectRatio="slice", i.e. always as if cropped to cover, so the four
 * fit= rows looked identical ("are these images all supposed to be the same?").
 */
import { test, expect, Page } from '../fixtures/offline';

async function card(page: Page, attrs: string) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors);
  await page.evaluate(async (a) => {
    const host = document.createElement('div');
    host.id = 'ci-test';
    host.style.width = '640px';
    host.innerHTML = `<article x-cardimage src="/images/placeholder-portrait.svg" alt="Test image" title="Title" ${a}></article>`;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  }, attrs);
  const el = page.locator('#ci-test [x-cardimage]');
  await expect(el.locator('img')).toHaveJSProperty('complete', true);
  return el;
}

for (const side of ['left', 'right'] as const) {
  test(`position="${side}" renders the image beside the title`, async ({ page }) => {
    const el = await card(page, `position="${side}"`);
    const img = await el.locator('img').boundingBox();
    const title = await el.locator('h3').boundingBox();
    expect(img!.width, 'the image is rendered').toBeGreaterThan(50);
    if (side === 'left') expect(img!.x + img!.width).toBeLessThanOrEqual(title!.x + 1);
    else expect(title!.x + title!.width).toBeLessThanOrEqual(img!.x + 1);
  });
}

test('the four fit options render four different pictures', async ({ page }) => {
  const shots = new Set<string>();
  for (const fit of ['cover', 'contain', 'fill', 'none']) {
    const el = await card(page, `fit="${fit}"`);
    shots.add((await el.locator('img').screenshot()).toString('base64'));
  }
  expect(shots.size).toBe(4);
});
