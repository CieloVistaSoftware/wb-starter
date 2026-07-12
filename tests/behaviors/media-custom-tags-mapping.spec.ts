/**
 * <wb-video>, <wb-vimeo>, <wb-youtube>, <wb-gallery>, <wb-ratio>, and
 * <wb-figure> (as a custom tag — separate from native <figure>, covered
 * in wb-figure-tag-mapping.spec.ts) had ZERO selector→behavior mapping
 * anywhere in tag-map.js or wb-lazy.js — only <wb-audio> among this
 * whole media-behavior family was ever wired up. Every one of these tags
 * was completely inert on every page, everywhere, always. Discovered
 * while migrating the underlying functions out of the old media.js
 * grab-bag file into src/wb-viewmodels/semantics/*.js.
 *
 * Also fixed along the way: vimeo()'s old media.js implementation
 * referenced undefined `iframe`/`params` variables (only `videoIframe`/
 * `embedParams` were ever declared) — a real ReferenceError that would
 * have fired instantly, the moment <wb-vimeo> was ever actually reachable.
 */
import { test, expect, Page } from '@playwright/test';

const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'media-tags-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('media custom-tag mappings (were completely unmapped)', () => {
  test('<wb-video> gets enhanced and wraps a real <video>', async ({ page }) => {
    await setup(page, '<wb-video id="v1" src="https://example.com/x.mp4"></wb-video>');
    await expect(page.locator('#v1')).toHaveClass(/wb-video/);
    await expect(page.locator('#v1 video')).toHaveCount(1);
  });

  test('<wb-vimeo> renders a real iframe with no ReferenceError (previously undefined iframe/params)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setup(page, '<wb-vimeo id="vm1" video-id="123456789"></wb-vimeo>');
    await expect(page.locator('#vm1')).toHaveClass(/wb-vimeo/);
    const iframe = page.locator('#vm1 iframe');
    await expect(iframe).toHaveCount(1);
    await expect(iframe).toHaveAttribute('src', /player\.vimeo\.com\/video\/123456789/);
    expect(errors).toEqual([]);
  });

  test('<wb-youtube> renders a poster (no autoplay)', async ({ page }) => {
    await setup(page, '<wb-youtube id="yt1" video-id="dQw4w9WgXcQ"></wb-youtube>');
    await expect(page.locator('#yt1')).toHaveClass(/wb-youtube/);
    await expect(page.locator('#yt1 .wb-youtube__poster')).toHaveCount(1);
  });

  test('<wb-gallery> gets enhanced with a grid layout', async ({ page }) => {
    await setup(page, `<wb-gallery id="g1"><img src="${PIXEL}"><img src="${PIXEL}"></wb-gallery>`);
    await expect(page.locator('#g1')).toHaveClass(/wb-gallery/);
    const display = await page.locator('#g1').evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('grid');
  });

  test('<wb-ratio> gets enhanced with the configured aspect-ratio', async ({ page }) => {
    await setup(page, '<wb-ratio id="r1" ratio="16x9"><div>content</div></wb-ratio>');
    await expect(page.locator('#r1')).toHaveClass(/wb-ratio/);
    const aspectRatio = await page.locator('#r1').evaluate((el) => (el as HTMLElement).style.aspectRatio);
    expect(aspectRatio).toBe('16 / 9');
  });

  test('<wb-figure> (custom tag) gets enhanced', async ({ page }) => {
    await setup(page, `<wb-figure id="f1"><img src="${PIXEL}"></wb-figure>`);
    await expect(page.locator('#f1')).toHaveClass(/wb-figure/);
  });
});
