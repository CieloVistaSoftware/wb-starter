/**
 * An <img> takes the height it is given (#1327).
 *
 * John: in the playground, <img width height> and <figure><img width height>
 * would not take the height. site.css had `img { max-width: 100%; height: auto }`
 * (#293), and any CSS height beats the HTML height attribute, so height="50"
 * on a 240x150 image rendered 62.5px tall. Now height:auto applies only to an
 * <img> with no height attribute.
 */
import { test, expect } from '../fixtures/offline';

const SNIPPET = [
  '<img id="bare-sized" src="/images/placeholder.svg" alt="a" width="100" height="50">',
  '<figure><img id="figure-sized" src="/images/placeholder.svg" alt="b" width="100" height="50"><figcaption>cap</figcaption></figure>',
  '<img id="unsized" src="/images/placeholder.svg" alt="c" width="100">',
].join('\n');

test('playground: img and figure img honor width AND height; an img with no height keeps its ratio', async ({ page }) => {
  await page.goto('/demos/playground.html');
  await page.waitForFunction(() => (window as any).WB?.scan);
  const editor = page.locator('textarea').first();
  await editor.fill(SNIPPET);
  await editor.dispatchEvent('input');

  for (const id of ['bare-sized', 'figure-sized']) {
    const img = page.locator(`#pg-preview #${id}`);
    await expect(img).toBeVisible({ timeout: 15_000 });
    await img.evaluate((el: HTMLImageElement) => el.decode());
    const box = (await img.boundingBox())!;
    expect(Math.round(box.width), `${id} width`).toBe(100);
    expect(Math.round(box.height), `${id} height`).toBe(50);
  }

  // No height attribute: still responsive, height follows the 240x150 ratio.
  const unsized = page.locator('#pg-preview #unsized');
  await unsized.evaluate((el: HTMLImageElement) => el.decode());
  const box = (await unsized.boundingBox())!;
  expect(Math.round(box.width)).toBe(100);
  expect(box.height).toBeCloseTo(62.5, 0);
});
