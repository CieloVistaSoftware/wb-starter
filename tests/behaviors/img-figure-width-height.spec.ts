/**
 * John: "why isn't figure and image able to set width height? we have no
 * examples of this in behaviors."
 *
 * <img height> was dead: normalize.css and site.css both set
 * `img { height: auto }`, which beats the attribute, so once the photo loaded
 * its real shape won. img.js now turns a width + height pair into the
 * image's aspect ratio (cropped, like aspect-ratio=""). <figure> had no
 * width at all -- HTML gives it none -- so figure.js now reads width="".
 */
import { test, expect, Page } from '../fixtures/offline';

const IMG = '/images/dachshund-puppy-image-960x540.jpg';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate(async (h: string) => {
    const c = document.createElement('div');
    c.id = 'size-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
    // <figure> is mapped only under autoInject, as on every real page.
    (window as any).WB.config.set('autoInject', true);
    await (window as any).WB.scan(document.body, { eager: true });
  }, html);
  await page.waitForFunction(() => Array.from(document.querySelectorAll('#size-test-area img'))
    .every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0), { timeout: 10000 });
}

async function box(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
  });
}

test.describe('img width + height', () => {
  test('a width + height pair sets the shape, cropped not stretched', async ({ page }) => {
    await setup(page, `<img id="sq" src="${IMG}" width="240" height="240" alt="square">`);
    expect(await box(page, '#sq')).toEqual({ width: 240, height: 240 });
    await expect(page.locator('#sq')).toHaveCSS('object-fit', 'cover');
  });

  test('width alone keeps the photo shape', async ({ page }) => {
    await setup(page, `<img id="w" src="${IMG}" width="240" alt="width only">`);
    expect(await box(page, '#w')).toEqual({ width: 240, height: 135 });
  });

  test('an explicit aspect-ratio wins over the pair', async ({ page }) => {
    await setup(page, `<img id="ar" src="${IMG}" width="240" height="240" aspect-ratio="2/1" alt="ratio wins">`);
    expect(await box(page, '#ar')).toEqual({ width: 240, height: 120 });
  });
});

test.describe('figure width', () => {
  test('width="320" sizes the whole figure and its image', async ({ page }) => {
    await setup(page, `<figure id="f" width="320"><img src="${IMG}" alt="f"><figcaption>cap</figcaption></figure>`);
    expect((await box(page, '#f')).width).toBe(320);
    expect((await box(page, '#f img')).width).toBe(320);
    await expect(page.locator('#f')).not.toHaveAttribute('style', /width/);
  });

  test('a CSS length is kept and the figure never outgrows its container', async ({ page }) => {
    await setup(page, `<div id="narrow" style="width:200px"><figure id="g" width="30rem"><img src="${IMG}" alt="g"></figure></div>`);
    expect((await box(page, '#g')).width).toBeLessThanOrEqual(200);
  });
});
