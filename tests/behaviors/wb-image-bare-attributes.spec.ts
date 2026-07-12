/**
 * x-image's image() only read data-lazy/data-zoomable, not the bare
 * lazy/zoomable attributes every demo actually uses — the same
 * bare-attribute-fallback gap found repeatedly this session.
 *
 * Since fixed, this behavior was migrated from the old media.js grab-bag
 * file to src/wb-viewmodels/semantics/img.js (matching the project's
 * one-file-per-semantic-element convention) — the CSS class prefix
 * changed from wb-image to wb-img to match the file/tag name (audio.js →
 * wb-audio, table.js → wb-table, ...); no CSS ever depended on the old
 * wb-image name (confirmed: zero matches in src/styles/).
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'image-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';

test.describe('x-image bare zoomable/lazy attributes', () => {
  test('bare zoomable attribute adds wb-img--zoomable', async ({ page }) => {
    await setup(page, `<img id="img1" x-image src="${PIXEL}" zoomable alt="test">`);
    await expect(page.locator('#img1')).toHaveClass(/wb-img--zoomable/);
  });

  test('bare lazy attribute sets native loading="lazy"', async ({ page }) => {
    await setup(page, `<img id="img2" x-image src="${PIXEL}" lazy alt="test">`);
    await expect(page.locator('#img2')).toHaveAttribute('loading', 'lazy');
  });

  test('without zoomable, wb-img--zoomable is not added', async ({ page }) => {
    await setup(page, `<img id="img3" x-image src="${PIXEL}" alt="test">`);
    await expect(page.locator('#img3')).not.toHaveClass(/wb-img--zoomable/);
  });
});
