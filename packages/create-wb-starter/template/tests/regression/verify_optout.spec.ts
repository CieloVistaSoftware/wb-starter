import { test, expect } from '@playwright/test';

test('Auto-injection opt-out mechanisms', async ({ page }) => {
  await page.goto('http://localhost:3000/tests/repro_optout.html');

  // 1. Standard article -> Should be a card
  const auto = page.locator('#auto');
  await expect(auto).toHaveClass(/wb-card/);

  // 2. data-wb="" -> Should NOT be a card
  const optout = page.locator('#optout');
  await expect(optout).not.toHaveClass(/wb-card/);

  // 3. data-wb-ignore -> Should NOT be a card
  const ignore = page.locator('#optout-ignore');
  await expect(ignore).not.toHaveClass(/wb-card/);
});
