import { test, expect } from '../fixtures/offline';

test('Article should not be auto-injected, but can accept behavior', async ({ page }) => {
  await page.goto('/tests/repro_explicit_card.html');

  // Cards no longer stamp .x-card / .x-card__header (a8a7362e): card.css
  // matches `article` by tag, so a class can't tell a card from a plain
  // article any more. Whether the card BEHAVIOR ran is what separates them, and
  // x-ready is its completion signal. The explicit card settling first also
  // proves the scan is done before the plain one is judged.

  // 2. Explicit article -> Should BE a card
  const explicit = page.locator('#explicit');
  await expect(explicit).toHaveAttribute('x-ready', '');
  // Its authored header survives as the card's header, in place.
  await expect(explicit.locator(':scope > header h3')).toHaveText('Explicit Card');

  // 1. Plain article -> Should NOT be a card (autoInject is off on this page)
  const plain = page.locator('#plain');
  await expect(plain).not.toHaveAttribute('x-ready', '');
});
