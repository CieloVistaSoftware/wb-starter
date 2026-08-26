import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#374 / BUG-2026-07-27-001): x-lightbox triggers that carry
 * their image URL via data-src (the canonical form emitted by
 * scripts/generate-behaviors-page.js for non-<img> triggers, e.g.
 * <button x-lightbox data-src="...">) opened the overlay but rendered no
 * image — lightbox() in src/wb-viewmodels/overlay.js never read
 * element.dataset.src, only src/href. Same class of bug as
 * BUG-2024-12-19-001 (src belongs on dataset for elements with no native
 * src attribute).
 *
 * Also: the local dev server (server.js) used to WB.init() with the
 * (lazy, IntersectionObserver-gated) default scan instead of matching
 * production's eager one (scripts/generate-site.mjs), so any x-* trigger
 * below the fold — this lightbox demo included — never had its click
 * handler attached at all in local dev. That's the actual "clicking does
 * nothing" symptom reported; the data-src gap only became visible once
 * the trigger was reachable. Both are fixed together and covered here.
 *
 * Requests to the picsum.photos placeholder image are mocked with a 1x1
 * PNG — the test verifies wiring (src plumbed through, overlay renders),
 * not that a third-party image host is reachable/fast.
 */
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

test.describe('Lightbox reads data-src on non-<img> triggers (#374)', () => {
  test('clicking a <button x-lightbox data-src="..."> shows the image, not a blank lightbox', async ({ page }) => {
    await page.route('https://picsum.photos/**', route =>
      route.fulfill({ status: 200, body: ONE_PX_PNG, contentType: 'image/png' })
    );

    await page.goto('/pages/behaviors.html');

    const trigger = page.locator('button[x-lightbox][data-src]').first();
    await expect(trigger, 'pages/behaviors.html should still have a button[x-lightbox][data-src] demo').toHaveCount(1);

    const expectedSrc = await trigger.getAttribute('data-src');
    await trigger.click();

    const lightboxImg = page.locator('.x-lightbox img');
    await expect(lightboxImg).toBeVisible({ timeout: 5000 });

    const actualSrc = await lightboxImg.getAttribute('src');
    expect(actualSrc, 'lightbox image src must not be empty').toBeTruthy();
    expect(actualSrc).toBe(expectedSrc);
  });

  test('<img x-lightbox src="..."> (existing convention) still works', async ({ page }) => {
    await page.route('https://picsum.photos/**', route =>
      route.fulfill({ status: 200, body: ONE_PX_PNG, contentType: 'image/png' })
    );

    await page.goto('/demos/playground.html');

    const trigger = page.locator('img[x-lightbox][src]').first();
    if (await trigger.count() === 0) test.skip();

    const expectedSrc = await trigger.getAttribute('src');
    await trigger.click();

    const lightboxImg = page.locator('.x-lightbox img');
    await expect(lightboxImg).toBeVisible({ timeout: 5000 });
    await expect(lightboxImg).toHaveAttribute('src', expectedSrc!);
  });
});
