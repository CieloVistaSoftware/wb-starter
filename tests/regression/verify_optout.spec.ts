import { test, expect } from '../fixtures/offline';

// Cards stopped stamping .x-card onto an <article> (a8a7362e -- card.css
// matches the tag), so `toHaveClass(/x-card/)` failed on the real card and
// passed vacuously on both opt-outs. x-ready is the behavior's own
// completion signal (ready-signal.js, stamped under automation); an element
// that was never injected never gets it.
test('Auto-injection opt-out mechanisms', async ({ page }) => {
  await page.goto('/tests/repro_optout.html');

  // 1. Standard article -> Should be a card
  const auto = page.locator('#auto');
  await expect(auto).toHaveAttribute('x-ready', '');

  // 2. data-wb="" -> Should NOT be a card
  const optout = page.locator('#optout');
  await expect(optout).not.toHaveAttribute('x-ready');

  // 3. data-x-ignore -> Should NOT be a card
  const ignore = page.locator('#optout-ignore');
  await expect(ignore).not.toHaveAttribute('x-ready');
});
