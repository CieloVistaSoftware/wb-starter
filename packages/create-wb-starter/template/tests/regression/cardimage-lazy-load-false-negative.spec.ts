import { test, expect } from '@playwright/test';

/**
 * REGRESSION (BUG-2026-07-27-005): every <div x-cardimage> on what was then
 * demos/site/cards.html's "Image Card" section (now
 * tests/fixtures/cards-permutation-matrix.html -- the permutation-matrix
 * content was split out of the demo page separately) rendered "⚠ Image
 * unavailable" even though the picsum.photos URL is perfectly valid (curl
 * confirms 200). Root cause: cardimage() (src/wb-viewmodels/card.js) sets
 * img.loading = 'lazy' unconditionally, but attachImageLoadRetry()
 * (src/wb-viewmodels/media-load-retry.js) starts its readiness-check timer
 * immediately regardless of native lazy-load state. Off-screen (or not-yet-
 * observed-visible) images never actually get fetched by the browser --
 * confirmed live via read_network_requests: ZERO requests were ever made
 * for the image URL -- so naturalWidth stays 0/complete stays false purely
 * because the browser is intentionally deferring the fetch, not because
 * anything failed. After 5 retries (each just cache-busting the src, which
 * does NOT override loading="lazy") it gives up and shows the permanent
 * "unavailable" fallback on a URL that was never actually attempted.
 *
 * Also explains why tests/cards/cardimage-render.spec.ts never caught this:
 * it only asserts an <img> element exists with a non-empty src attribute --
 * it never checks naturalWidth/complete or whether the load-failed fallback
 * fired.
 */
test.describe('cardimage image actually loads, not just has a src attribute (#cardimage-lazy)', () => {
  test('a valid src does not get permanently marked "Image unavailable" for staying off-screen', async ({ page }) => {
    test.setTimeout(75000); // deliberately outlasts the ~27.5s pre-fix give-up window
    // Deliberately do NOT scroll to the section -- reproduces the reported
    // failure exactly: the retry clock starts the instant cardimage() runs
    // (eager site-generator scan), regardless of scroll position, so an
    // image that's off-screen when the page loads races its own retry
    // timeout. attachImageLoadRetry gives up after 5 attempts
    // (4s check + exponential 500/1000/2000/4000ms backoff ≈ 27.5s total)
    // and PERMANENTLY hides the element -- no observer ever retries it
    // later even once the user does scroll to it.
    await page.goto('/tests/fixtures/cards-permutation-matrix.html');

    const section = page.locator('#cardimage-image-card');
    await expect(section, 'the matrix fixture should still have the Image Card section').toHaveCount(1);
    const firstCard = section.locator('x-cardimage').first();
    const img = firstCard.locator('img');
    await expect(img, 'cardimage must render a real <img>').toHaveCount(1);

    // Confirm the URL itself is genuinely valid -- this proves any
    // "unavailable" state is a false negative, not a real broken link.
    const src = await img.getAttribute('src');
    const direct = await page.request.get(src!);
    expect(direct.ok(), `the image URL itself must be reachable: ${src}`).toBe(true);

    // Sit off-screen well past the OLD ~27.5s give-up window (5 attempts,
    // 4s check + exponential 500/1000/2000/4000ms backoff) without
    // scrolling. The fix gates the retry clock on real intersection, so
    // this must NOT have given up yet.
    await page.waitForTimeout(28000);
    await expect(firstCard.locator('.x-media-load-failed'), 'must not give up while still off-screen').toHaveCount(0);

    // Now scroll to it — a real user looking at this section, which the
    // reported screenshot proves happens well within any reasonable
    // reading pace.
    await firstCard.scrollIntoViewIfNeeded();

    // The actual functional check tests/cards/cardimage-render.spec.ts never
    // made: does the image actually finish loading a real frame?
    await expect
      .poll(async () => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
        timeout: 30000,
        message: 'image never finished loading (naturalWidth stayed 0) -- a valid URL got permanently marked unavailable',
      })
      .toBe(true);

    const failedSibling = firstCard.locator('.x-media-load-failed');
    await expect(failedSibling, 'a valid, loadable image must never trigger the "unavailable" fallback').toHaveCount(0);
    await expect(img).not.toHaveClass(/x-img--load-failed/);
  });
});
