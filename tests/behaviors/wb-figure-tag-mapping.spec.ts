/**
 * <figure> had zero selector→behavior mapping in either tag-map.js's
 * nativeMap or wb-lazy.js's autoInjectMappings — media.js's figure()
 * (the correct, working implementation) could never run on any page.
 * Also found a fully dead, unreachable duplicate implementation at
 * src/wb-viewmodels/semantics/figure.js (deleted) — behaviorModules
 * always routed the "figure" behavior name to media.js, never to it.
 *
 * media.js's figure() itself was correct — lightbox/zoom/caption-position
 * already read bare attributes properly. The bug was purely "nothing ever
 * calls this function." Fixed by registering figure in both tag-map.js's
 * nativeMap and wb-lazy.js's autoInjectMappings.
 */
import { test, expect, Page } from '@playwright/test';

const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate(async (h: string) => {
    const c = document.createElement('div');
    c.id = 'figure-test-area';
    c.style.cssText = 'padding:20px; width:400px;';
    c.innerHTML = h;
    document.body.appendChild(c);
    // figure is only mapped under autoInject — matches how every
    // demos/*.html page that uses <figure> actually boots
    // (WB.init({ autoInject: true })).
    (window as any).WB.config.set('autoInject', true);
    await (window as any).WB.scan(document.body, { eager: true });
  }, html);
  await page.waitForTimeout(400);
}

test.describe('<figure> auto-inject mapping (was completely unmapped)', () => {
  test('a plain <figure> gets enhanced with the wb-figure class', async ({ page }) => {
    await setup(page, `<figure id="fig1"><img src="${PIXEL}"><figcaption>Caption</figcaption></figure>`);
    await expect(page.locator('#fig1')).toHaveClass(/wb-figure/);
  });

  test('caption-position="overlay" adds the overlay modifier class', async ({ page }) => {
    await setup(page, `<figure id="fig2" caption-position="overlay"><img src="${PIXEL}"><figcaption>Overlay</figcaption></figure>`);
    await expect(page.locator('#fig2')).toHaveClass(/wb-figure--overlay/);
  });

  test('zoom sets a zoom-in cursor on the inner image', async ({ page }) => {
    await setup(page, `<figure id="fig3" zoom><img src="${PIXEL}"></figure>`);
    const cursor = await page.locator('#fig3 img').evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('zoom-in');
  });
});
