import { test, expect } from '@playwright/test';

test('Article should not be auto-injected, but can accept behavior', async ({ page }) => {
  await page.goto('/tests/repro_explicit_card.html');

  // 1. Plain article -> Should NOT be a card
  const plain = page.locator('#plain');
  await expect(plain).not.toHaveClass(/x-card/);

  // 2. Explicit article -> Should BE a card
  const explicit = page.locator('#explicit');
  await expect(explicit).toHaveClass(/x-card/);
  await expect(explicit.locator('header')).toHaveClass(/x-card__header/);
});
