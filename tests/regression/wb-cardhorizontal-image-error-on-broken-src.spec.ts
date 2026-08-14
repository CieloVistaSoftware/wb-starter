import { test, expect } from '@playwright/test';

/**
 * #604. John, live report: "cardhorizontal is failing now on images. I
 * want a runtime error that says that, it should log and error" -- reproduced via
 * docs/components/cards/cardhorizontal.md, whose examples pointed at
 * nonexistent /images/feature.jpg and /images/wide.jpg. The <img> created by
 * cardhorizontal() (src/wb-viewmodels/card.js) had NO 'error' listener at
 * all -- a 404/unreachable image rendered as nothing but the browser's own
 * broken-image icon, with zero console/error-log signal.
 *
 * Fixed to match the same "throw a real Error so the app's global error
 * handler (src/core/error-logger.js's setupGlobalErrorHandler) catches and
 * logs it" convention already used by semantics/audio.js for a broken
 * `src` (#433, see tests/regression/wb-audio-error-on-broken-src.spec.ts)
 * and by cardhero's own background-image probe earlier in this same file.
 */

test('wb-cardhorizontal throws a catchable runtime error when its image src is missing/unreachable', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );

  await page.evaluate(() => {
    const container = document.createElement('div');
    // A path that deterministically 404s on this project's own dev server
    // -- no dependency on external network availability.
    container.innerHTML = '<wb-cardhorizontal title="Broken" image="/tests/fixtures/does-not-exist-cardhorizontal.jpg">Body</wb-cardhorizontal>';
    document.body.appendChild(container);
    return (window as any).WB.scan(container);
  });

  await page.waitForTimeout(1500);

  const cardError = pageErrors.find(
    (e) => e.includes('wb-cardhorizontal') && e.includes('does-not-exist-cardhorizontal.jpg')
  );
  expect(cardError, `expected a wb-cardhorizontal runtime error for the broken image, got: ${JSON.stringify(pageErrors)}`).toBeTruthy();
});

test('wb-cardhorizontal with a real, working image never throws', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );

  await page.evaluate(() => {
    const container = document.createElement('div');
    container.innerHTML = '<wb-cardhorizontal title="Working" image="https://picsum.photos/seed/cardhorizontal-error-test-control/400/300">Body</wb-cardhorizontal>';
    document.body.appendChild(container);
    return (window as any).WB.scan(container);
  });

  const img = page.locator('wb-cardhorizontal img');
  await expect.poll(
    () => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
    { timeout: 15000 }
  ).toBe(true);

  const cardError = pageErrors.find((e) => e.includes('wb-cardhorizontal'));
  expect(cardError, `a real, working image must never throw a wb-cardhorizontal error, got: ${JSON.stringify(pageErrors)}`).toBeFalsy();
});
