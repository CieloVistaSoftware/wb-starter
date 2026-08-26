import { test, expect } from '@playwright/test';

test('Auto-injection opt-out mechanisms', async ({ page }) => {
  await page.goto('/tests/repro_optout.html');

  // 1. Standard article -> Should be a card
  const auto = page.locator('#auto');
  await expect(auto).toHaveClass(/x-card/);

  // 2. data-wb="" -> Should NOT be a card
  const optout = page.locator('#optout');
  await expect(optout).not.toHaveClass(/x-card/);

  // 3. data-x-ignore -> Should NOT be a card
  const ignore = page.locator('#optout-ignore');
  await expect(ignore).not.toHaveClass(/x-card/);
});
