import { test, expect } from '@playwright/test';

test('semantic <article> should be processed to card synchronously on page load', async ({ page }) => {
  await page.goto('/tests/repro_card_semantic.html');

  // The semantic article should be processed into a card with proper classes
  const article = page.locator('article').first();
  await expect(article).toHaveClass(/x-card/);

  // Should have card structure (header, main content, etc.)
  await expect(article.locator('.x-card__header, .x-card__main, .x-card__footer')).toHaveCount(await article.locator('[class*="x-card__"]').count());

  // Should be styled as a card (not just a plain article)
  await expect(article).toHaveCSS('display', 'flex'); // x-card is a flex container
});